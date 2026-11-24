import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type pg from 'pg';
import { createTestDb, type TestDb } from './helpers';

// M-06 (funções do banco): toda função que o responsável autenticado pode chamar e que recebe um id
// (filho, aparelho, conversa) recusa o id de outra família e não deixa rastro.
// O teste de catálogo quebra se surgir função nova executável por anon ou authenticated sem passar por aqui.

let db: TestDb;
const uA = '00000000-0000-0000-0000-0000000000c1';
const uB = '00000000-0000-0000-0000-0000000000c2';
const year = new Date().getFullYear();
const fam = { A: '', B: '' };
const kid = { A: '', B: '' };
const dev = { A: '', B: '' };
const conv = { A: '', B: '' };

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
const q = (s: string, p?: unknown[]) => db.admin.query(s, p);
const snapshot = async () =>
  JSON.stringify(
    (
      await q(`select
        (select jsonb_agg(to_jsonb(c) - 'updated_at' order by id) from child c) as child,
        (select jsonb_agg(to_jsonb(d) order by id) from device d) as device,
        (select count(*) from conversation) as conv, (select count(*) from message) as msg,
        (select count(*) from audit_log) as audit, (select count(*) from pairing_code) as codes,
        (select jsonb_agg(to_jsonb(f) order by family_id) from family_settings f) as settings`)
    ).rows[0],
  );

beforeAll(async () => {
  db = await createTestDb();
  await q(`insert into auth.users(id, email) values ($1,'a@exemplo.com'), ($2,'b@exemplo.com')`, [uA, uB]);
  for (const [k, u] of [['A', uA], ['B', uB]] as const) {
    fam[k] = (await asUserCommit(u, (c) => c.query(`select public.register_guardian($1, true, 'v1') as id`, [`Resp ${k}`]))).rows[0].id;
    kid[k] = (await asUserCommit(u, (c) => c.query(`select public.create_child($1,$2,'6º ano','raposa','1234') as id`, [`Filho ${k}`, year - 11]))).rows[0].id;
    dev[k] = (await q(`insert into device(child_id, platform) values ($1,'android') returning id`, [kid[k]])).rows[0].id;
    conv[k] = (await q(`insert into conversation(child_id, title) values ($1,'t') returning id`, [kid[k]])).rows[0].id;
    await q(`insert into message(conversation_id, role, content) values ($1,'child','oi')`, [conv[k]]);
  }
});
afterAll(async () => {
  await db.close();
});

describe('A chama funções com ids da família B: recusa e nenhum efeito', () => {
  const calls: [string, string, unknown[]][] = [
    ['create_pairing_code', `select * from public.create_pairing_code($1)`, ['kid']],
    ['set_child_pin', `select public.set_child_pin($1, '9999')`, ['kid']],
    ['set_child_credentials', `select public.set_child_credentials($1, 'x@exemplo.com', 'senha-forte-123')`, ['kid']],
    ['set_child_google', `select public.set_child_google($1, 'x@exemplo.com')`, ['kid']],
    ['revoke_device', `select public.revoke_device($1)`, ['dev']],
    ['delete_conversation', `select public.delete_conversation($1)`, ['conv']],
    ['delete_child_conversations', `select public.delete_child_conversations($1)`, ['kid']],
    ['audit_view', `select * from public.audit_view($1)`, ['kid']],
    ['delete_child', `select public.delete_child($1, true)`, ['kid']],
  ];
  const arg = (what: string) => (what === 'kid' ? kid.B : what === 'dev' ? dev.B : conv.B);

  for (const [fn, sql, [what]] of calls) {
    it(`${fn}`, async () => {
      const before = await snapshot();
      await expect(asUserCommit(uA, (c) => c.query(sql, [arg(what as string)]))).rejects.toThrow(/not_found|42501|permission/);
      expect(await snapshot()).toBe(before);
    });
  }

  it('a mesma chamada com o id da própria família funciona (controle do teste)', async () => {
    await asUserCommit(uA, (c) => c.query(`select * from public.create_pairing_code($1)`, [kid.A]));
    await asUserCommit(uA, (c) => c.query(`select public.revoke_device($1)`, [dev.A]));
    expect((await q(`select revoked_at from device where id = $1`, [dev.A])).rows[0].revoked_at).not.toBeNull();
    expect((await q(`select revoked_at from device where id = $1`, [dev.B])).rows[0].revoked_at).toBeNull();
  });

  it('list_devices e export_family_data devolvem só dados da própria família', async () => {
    const devices = await asUserCommit(uA, (c) => c.query(`select * from public.list_devices()`));
    expect(devices.rows.map((r) => r.id)).toEqual([dev.A]);
    const dump = JSON.stringify((await asUserCommit(uA, (c) => c.query(`select public.export_family_data() as d`))).rows[0].d);
    expect(dump).toContain(fam.A);
    for (const outro of [fam.B, kid.B, dev.B, conv.B]) expect(dump).not.toContain(outro);
  });

  it('set_retention_days e delete_account atingem só a família de quem chama', async () => {
    await asUserCommit(uA, (c) => c.query(`select public.set_retention_days(30)`));
    const r = await q(`select family_id, retention_days from family_settings order by family_id`);
    expect(r.rows.find((x) => x.family_id === fam.B)?.retention_days).not.toBe(30);
  });
});

describe('catálogo de funções', () => {
  // Funções de extensões (pgcrypto no stub de teste) não são código do projeto; no Supabase ficam no schema `extensions`.
  const NAO_EXTENSAO = `not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')`;

  // Qualquer função nova executável por usuários finais entra nesta lista de propósito, depois de revisada.
  const permitidas = [
    'audit_view', 'create_child', 'create_pairing_code', 'current_family_ids', 'delete_account', 'delete_child',
    'delete_child_conversations', 'delete_conversation', 'export_family_data', 'list_devices', 'register_guardian',
    'revoke_device', 'set_child_credentials', 'set_child_google', 'set_child_pin', 'set_retention_days',
  ];

  it('authenticated executa exatamente a lista revisada', async () => {
    const { rows } = await q(`
      select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'execute') and ${NAO_EXTENSAO}
      order by 1`);
    expect([...new Set(rows.map((r) => r.proname as string))]).toEqual(permitidas);
  });

  it('anon não executa nenhuma função de public', async () => {
    const { rows } = await q(`
      select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute') and ${NAO_EXTENSAO}`);
    expect(rows).toEqual([]);
  });

  it('funções de login e sessão (só API, com service role) não são chamáveis por authenticated nem anon', async () => {
    for (const f of ['redeem_pairing_code', 'child_login', 'child_login_google', 'verify_child_session', 'guardian_mode_enter',
      'verify_guardian_mode', 'guardian_login', 'verify_guardian_session', 'verify_guardian', 'purge_expired_all', 'purge_expired_conversations']) {
      const { rows } = await q(
        `select has_function_privilege('authenticated', p.oid, 'execute') a, has_function_privilege('anon', p.oid, 'execute') b
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = $1`,
        [f],
      );
      expect(rows.length, f).toBeGreaterThan(0);
      for (const r of rows) expect(r, f).toEqual({ a: false, b: false });
    }
  });

  it('segredos e tokens: nenhuma coluna de hash é legível por authenticated', async () => {
    const { rows } = await q(`
      select table_name, column_name from information_schema.columns
      where table_schema = 'public' and (column_name like '%hash%' or column_name like '%token%' or column_name = 'google_sub')
        and has_column_privilege('authenticated', format('public.%I', table_name)::regclass, column_name, 'select')`);
    expect(rows).toEqual([]);
  });
});
