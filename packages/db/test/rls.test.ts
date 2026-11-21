import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from './helpers';

let db: TestDb;

// Duas famílias, cada uma com um responsável, um filho, aparelho, conversa, mensagem, evento e alerta.
const ids = {
  userA: '00000000-0000-0000-0000-0000000000a1',
  userB: '00000000-0000-0000-0000-0000000000b1',
  famA: '00000000-0000-0000-0000-00000000fa01',
  famB: '00000000-0000-0000-0000-00000000fb01',
  childA: '00000000-0000-0000-0000-00000000ca01',
  childB: '00000000-0000-0000-0000-00000000cb01',
  convA: '00000000-0000-0000-0000-0000000c0a01',
  convB: '00000000-0000-0000-0000-0000000c0b01',
  msgA: '00000000-0000-0000-0000-00000000aa01',
  msgB: '00000000-0000-0000-0000-00000000ab01',
  evA: '00000000-0000-0000-0000-0000000e0a01',
  evB: '00000000-0000-0000-0000-0000000e0b01',
  devA: '00000000-0000-0000-0000-0000000d0a01',
  devB: '00000000-0000-0000-0000-0000000d0b01',
  alA: '00000000-0000-0000-0000-00000000a1a1',
  alB: '00000000-0000-0000-0000-00000000a1b1',
};

beforeAll(async () => {
  db = await createTestDb();
  const q = (s: string, p?: unknown[]) => db.admin.query(s, p);
  await q(`insert into auth.users(id, email) values ($1,'a@exemplo.com'), ($2,'b@exemplo.com')`, [ids.userA, ids.userB]);
  await q(`insert into family(id) values ($1), ($2)`, [ids.famA, ids.famB]);
  await q(
    `insert into guardian(family_id, auth_user_id, name, email) values
       ($1,$2,'Resp A','a@exemplo.com'), ($3,$4,'Resp B','b@exemplo.com')`,
    [ids.famA, ids.userA, ids.famB, ids.userB],
  );
  await q(
    `insert into child(id, family_id, nickname, birth_year) values ($1,$2,'Filha A',2015), ($3,$4,'Filho B',2013)`,
    [ids.childA, ids.famA, ids.childB, ids.famB],
  );
  await q(`insert into device(id, child_id, platform) values ($1,$2,'android'), ($3,$4,'android')`, [ids.devA, ids.childA, ids.devB, ids.childB]);
  await q(`insert into family_settings(family_id) values ($1), ($2)`, [ids.famA, ids.famB]);
  await q(`insert into conversation(id, child_id) values ($1,$2), ($3,$4)`, [ids.convA, ids.childA, ids.convB, ids.childB]);
  await q(
    `insert into message(id, conversation_id, role, content) values ($1,$2,'child','pergunta A'), ($3,$4,'child','pergunta B')`,
    [ids.msgA, ids.convA, ids.msgB, ids.convB],
  );
  await q(
    `insert into safety_event(id, message_id, layer, category, decision) values ($1,$2,'input','escola','allow'), ($3,$4,'input','escola','allow')`,
    [ids.evA, ids.msgA, ids.evB, ids.msgB],
  );
  await q(
    `insert into alert(id, family_id, child_id, safety_event_id, severity) values ($1,$2,$3,$4,'low'), ($5,$6,$7,$8,'low')`,
    [ids.alA, ids.famA, ids.childA, ids.evA, ids.alB, ids.famB, ids.childB, ids.evB],
  );
  await q(`insert into audit_log(family_id, actor, action) values ($1,'x','view'), ($2,'y','view')`, [ids.famA, ids.famB]);
});

afterAll(async () => {
  await db.close();
});

const tables = [
  'family', 'guardian', 'child', 'device', 'family_settings',
  'conversation', 'message', 'safety_event', 'alert', 'audit_log',
];

describe('isolamento entre famílias (leitura)', () => {
  for (const t of tables) {
    it(`${t}: responsável A vê só 1 linha, da própria família`, async () => {
      const rows = await db.asUser(ids.userA, async (c) => (await c.query(`select * from public.${t}`)).rows);
      expect(rows).toHaveLength(1);
    });
    it(`${t}: responsável B vê só 1 linha, e não a de A`, async () => {
      const a = await db.asUser(ids.userA, async (c) => (await c.query(`select to_jsonb(x)::text as j from public.${t} x`)).rows);
      const b = await db.asUser(ids.userB, async (c) => (await c.query(`select to_jsonb(x)::text as j from public.${t} x`)).rows);
      expect(b).toHaveLength(1);
      expect(b[0]).not.toEqual(a[0]);
    });
    it(`${t}: anônimo e usuário desconhecido não leem nada`, async () => {
      await expect(db.asAnon((c) => c.query(`select * from public.${t}`))).rejects.toThrow(/permission denied/);
      const rows = await db.asUser('00000000-0000-0000-0000-0000000000ff', async (c) => (await c.query(`select * from public.${t}`)).rows);
      expect(rows).toHaveLength(0);
    });
  }

  it('conteúdo das mensagens de B não aparece para A', async () => {
    const rows = await db.asUser(ids.userA, async (c) => (await c.query(`select content from message`)).rows);
    expect(rows).toEqual([{ content: 'pergunta A' }]);
  });
});

describe('isolamento entre famílias (escrita)', () => {
  it('A não consegue criar filho na família B', async () => {
    await expect(
      db.asUser(ids.userA, (c) =>
        c.query(`insert into child(family_id, nickname, birth_year) values ($1,'Intruso',2014)`, [ids.famB]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('A não consegue mover o próprio filho para a família B', async () => {
    await expect(
      db.asUser(ids.userA, (c) => c.query(`update child set family_id = $1 where id = $2`, [ids.famB, ids.childA])),
    ).rejects.toThrow(/row-level security/);
  });

  it('A não altera nem apaga filho, configurações, alertas ou aparelhos de B (0 linhas afetadas)', async () => {
    await db.asUser(ids.userA, async (c) => {
      expect((await c.query(`update child set nickname='x' where id=$1`, [ids.childB])).rowCount).toBe(0);
      expect((await c.query(`delete from child where id=$1`, [ids.childB])).rowCount).toBe(0);
      expect((await c.query(`update family_settings set homework_mode=false where family_id=$1`, [ids.famB])).rowCount).toBe(0);
      expect((await c.query(`update alert set status='resolved' where id=$1`, [ids.alB])).rowCount).toBe(0);
      expect((await c.query(`update device set revoked_at=now() where id=$1`, [ids.devB])).rowCount).toBe(0);
    });
  });

  it('A não escreve em tabelas só da API (mensagem, evento, conversa, auditoria, família, responsável)', async () => {
    for (const sql of [
      `insert into message(conversation_id, role, content) values ('${ids.convA}','child','x')`,
      `insert into conversation(child_id) values ('${ids.childA}')`,
      `insert into audit_log(family_id, actor, action) values ('${ids.famA}','a','b')`,
      `insert into family default values`,
      `update guardian set role='owner'`,
      `delete from message`,
    ]) {
      await expect(db.asUser(ids.userA, (c) => c.query(sql))).rejects.toThrow(/permission denied/);
    }
  });
});

describe('o que o responsável pode fazer na própria família', () => {
  it('cria e edita filho, resolve alerta e revoga aparelho', async () => {
    await db.asUser(ids.userA, async (c) => {
      const ins = await c.query(`insert into child(family_id, nickname, birth_year) values ($1,'Nova',2016) returning id`, [ids.famA]);
      expect(ins.rows).toHaveLength(1);
      expect((await c.query(`update child set grade='6º ano' where id=$1`, [ins.rows[0].id])).rowCount).toBe(1);
      expect((await c.query(`update alert set status='resolved' where id=$1`, [ids.alA])).rowCount).toBe(1);
      expect((await c.query(`update device set revoked_at=now() where id=$1`, [ids.devA])).rowCount).toBe(1);
      expect((await c.query(`update family_settings set homework_mode=false where family_id=$1`, [ids.famA])).rowCount).toBe(1);
    });
  });
});

describe('integridade', () => {
  it('apagar uma família apaga tudo em cascata', async () => {
    await db.admin.query('begin');
    try {
      await db.admin.query(`delete from family where id = $1`, [ids.famA]);
      for (const t of ['child', 'device', 'conversation', 'message', 'safety_event', 'alert', 'guardian']) {
        const { rows } = await db.admin.query(`select count(*)::int n from public.${t}`);
        expect(rows[0].n).toBe(1);
      }
    } finally {
      await db.admin.query('rollback');
    }
  });

  it('rejeita decisão de segurança inválida', async () => {
    await expect(
      db.admin.query(`insert into safety_event(message_id, layer, category, decision) values ($1,'input','x','talvez')`, [ids.msgA]),
    ).rejects.toThrow(/check constraint/);
  });
});
