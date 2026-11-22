import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type pg from 'pg';
import { createTestDb, type TestDb } from './helpers';

// M-06: um responsável nunca acessa dados de outra família.
// Aqui as famílias nascem pelo fluxo real (register_guardian + create_child), não por insert direto,
// e há testes "de catálogo" que quebram se uma migração futura criar tabela ou função sem proteção.

let db: TestDb;
const uA = '00000000-0000-0000-0000-0000000000e1';
const uB = '00000000-0000-0000-0000-0000000000e2';
const year = new Date().getFullYear();
const fam: Record<'A' | 'B', string> = { A: '', B: '' };
const children: Record<'A' | 'B', string[]> = { A: [], B: [] };

async function asUserCommit<T>(u: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  await db.admin.query('begin');
  try {
    await db.admin.query(`set local role authenticated`);
    await db.admin.query(`select set_config('request.jwt.claim.sub', $1, true)`, [u]);
    const r = await fn(db.admin);
    await db.admin.query('commit');
    return r;
  } catch (e) {
    await db.admin.query('rollback');
    throw e;
  }
}

beforeAll(async () => {
  db = await createTestDb();
  const q = (s: string, p?: unknown[]) => db.admin.query(s, p);
  await q(`insert into auth.users(id, email) values ($1,'a@exemplo.com'), ($2,'b@exemplo.com')`, [uA, uB]);
  for (const [k, u, n] of [['A', uA, 2], ['B', uB, 1]] as const) {
    fam[k] = (await asUserCommit(u, (c) => c.query(`select public.register_guardian($1, true, 'v1') as id`, [`Resp ${k}`]))).rows[0].id;
    for (let i = 0; i < n; i++) {
      const id = (await asUserCommit(u, (c) => c.query(`select public.create_child($1,$2,'6º ano','raposa','1234') as id`, [`Filho ${k}${i}`, year - 11]))).rows[0].id;
      children[k].push(id);
    }
  }
  // Conteúdo escrito pela API (service role): aparelho, conversa, mensagens, evento e alerta por filho.
  for (const k of ['A', 'B'] as const) {
    for (const child of children[k]) {
      await q(`insert into device(child_id, platform) values ($1,'android')`, [child]);
      const conv = (await q(`insert into conversation(child_id, title) values ($1,'t') returning id`, [child])).rows[0].id;
      for (const role of ['child', 'tata']) {
        const msg = (await q(`insert into message(conversation_id, role, content) values ($1,$2,$3) returning id`, [conv, role, `conteúdo ${k}`])).rows[0].id;
        const ev = (await q(`insert into safety_event(message_id, layer, category, decision) values ($1,'input','escola','allow') returning id`, [msg])).rows[0].id;
        if (role === 'child') await q(`insert into alert(family_id, child_id, safety_event_id, severity) values ($1,$2,$3,'low')`, [fam[k], child, ev]);
      }
    }
  }
});
afterAll(async () => {
  await db.close();
});

// Como achar, pelo lado do administrador, os ids que cada família DEVERIA enxergar.
const own: Record<string, string> = {
  family: `select id from family where id = $1`,
  guardian: `select id from guardian where family_id = $1`,
  child: `select id from child where family_id = $1`,
  family_settings: `select family_id as id from family_settings where family_id = $1`,
  alert: `select id from alert where family_id = $1`,
  audit_log: `select id from audit_log where family_id = $1`,
  device: `select d.id from device d join child c on c.id = d.child_id where c.family_id = $1`,
  conversation: `select v.id from conversation v join child c on c.id = v.child_id where c.family_id = $1`,
  message: `select m.id from message m join conversation v on v.id = m.conversation_id join child c on c.id = v.child_id where c.family_id = $1`,
  safety_event: `select s.id from safety_event s join message m on m.id = s.message_id join conversation v on v.id = m.conversation_id join child c on c.id = v.child_id where c.family_id = $1`,
};
const idCol = (t: string) => (t === 'family_settings' ? 'family_id' : 'id');

describe('cada família vê exatamente o que é seu', () => {
  for (const [k, u] of [['A', uA], ['B', uB]] as const) {
    for (const t of Object.keys(own)) {
      it(`${t}: família ${k}`, async () => {
        const expected = (await db.admin.query(own[t]!, [fam[k]])).rows.map((r) => r.id as string).sort();
        const visible = (await db.asUser(u, async (c) => (await c.query(`select ${idCol(t)} as id from public.${t}`)).rows)).map((r) => r.id as string).sort();
        expect(expected.length).toBeGreaterThan(0);
        expect(visible).toEqual(expected);
      });
    }
  }

  it('contagens esperadas do cenário (A: 2 filhos, B: 1)', async () => {
    expect(children.A).toHaveLength(2);
    const a = await db.asUser(uA, async (c) => (await c.query(`select count(*)::int n from message`)).rows[0].n);
    const b = await db.asUser(uB, async (c) => (await c.query(`select count(*)::int n from message`)).rows[0].n);
    expect([a, b]).toEqual([4, 2]);
  });
});

describe('tentativas de acessar dados de outra família', () => {
  it('buscar por id conhecido de outra família não retorna nada', async () => {
    await db.asUser(uA, async (c) => {
      expect((await c.query(`select 1 from child where id = $1`, [children.B[0]])).rows).toHaveLength(0);
      expect((await c.query(`select 1 from family where id = $1`, [fam.B])).rows).toHaveLength(0);
    });
  });

  it('joins e subconsultas também não vazam', async () => {
    const rows = await db.asUser(uA, async (c) =>
      (await c.query(`select m.content from message m join conversation v on v.id = m.conversation_id join child c on c.id = v.child_id`)).rows,
    );
    expect(rows.every((r) => r.content === 'conteúdo A')).toBe(true);
  });

  it('set_child_pin e update em filho de outra família não têm efeito', async () => {
    await expect(asUserCommit(uA, (c) => c.query(`select public.set_child_pin($1, '9999')`, [children.B[0]]))).rejects.toThrow(/child_not_found/);
    const r = await db.asUser(uA, (c) => c.query(`update child set nickname = 'hack' where id = $1`, [children.B[0]]));
    expect(r.rowCount).toBe(0);
    const still = await db.admin.query(`select (pin_hash = crypt('1234', pin_hash)) as ok, nickname from child where id = $1`, [children.B[0]]);
    expect(still.rows[0]).toMatchObject({ ok: true, nickname: 'Filho B0' });
  });

  it('apagar filho de outra família não tem efeito; apagar o próprio apaga conversas em cascata', async () => {
    const r = await db.asUser(uA, (c) => c.query(`delete from child where id = $1`, [children.B[0]]));
    expect(r.rowCount).toBe(0);
    await db.asUser(uA, async (c) => {
      expect((await c.query(`delete from child where id = $1`, [children.A[0]])).rowCount).toBe(1);
      expect((await c.query(`select 1 from conversation where child_id = $1`, [children.A[0]])).rows).toHaveLength(0);
    });
  });

  it('responsável não vê o hash do PIN nem das próprias crianças', async () => {
    await expect(db.asUser(uA, (c) => c.query(`select pin_hash from child`))).rejects.toThrow(/permission denied/);
  });
});

describe('catálogo: nada novo escapa da proteção', () => {
  it('toda tabela de public tem RLS ligado e ao menos uma política', async () => {
    const { rows } = await db.admin.query(`
      select c.relname, c.relrowsecurity,
             (select count(*)::int from pg_policy p where p.polrelid = c.oid) as policies
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'`);
    expect(rows.length).toBeGreaterThanOrEqual(11);
    expect(rows.filter((r) => !r.relrowsecurity || r.policies === 0)).toEqual([]);
  });

  it('anon não tem nenhum privilégio em tabelas de public', async () => {
    const { rows } = await db.admin.query(`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
        and (has_table_privilege('anon', c.oid, 'select') or has_table_privilege('anon', c.oid, 'insert')
          or has_table_privilege('anon', c.oid, 'update') or has_table_privilege('anon', c.oid, 'delete'))`);
    expect(rows).toEqual([]);
  });

  it('funções security definer fixam search_path e não são executáveis por anon', async () => {
    const { rows } = await db.admin.query(`
      select p.proname,
             coalesce(p.proconfig::text ilike '%search_path%', false) as fixed,
             has_function_privilege('anon', p.oid, 'execute') as anon_exec
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prosecdef`);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows.filter((r) => !r.fixed || r.anon_exec)).toEqual([]);
  });
});
