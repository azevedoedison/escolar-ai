import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from './helpers';

// TAT-56: tabela school e family.school_id (opcional). O isolamento continua sendo por família.

let db: TestDb;
const uA = '00000000-0000-0000-0000-0000000000f1';
const uB = '00000000-0000-0000-0000-0000000000f2';
const uC = '00000000-0000-0000-0000-0000000000f3';
const fam: Record<string, string> = {};
const school: Record<string, string> = {};

beforeAll(async () => {
  db = await createTestDb();
  const q = (s: string, p?: unknown[]) => db.admin.query(s, p);
  await q(`insert into auth.users(id, email) values ($1,'a@e.com'), ($2,'b@e.com'), ($3,'c@e.com')`, [uA, uB, uC]);
  for (const [k, u] of [['A', uA], ['B', uB], ['C', uC]] as const) {
    await q('begin');
    await q(`set local role authenticated`);
    await q(`select set_config('request.jwt.claim.sub', $1, true)`, [u]);
    fam[k] = (await q(`select public.register_guardian($1, true, 'v1') as id`, [`Resp ${k}`])).rows[0].id;
    await q('commit');
  }
  school.S1 = (await q(`insert into school(name) values ('Escola 1') returning id`)).rows[0].id;
  school.S2 = (await q(`insert into school(name) values ('Escola 2') returning id`)).rows[0].id;
  await q(`update family set school_id = $1 where id = $2`, [school.S1, fam.A]);
  await q(`update family set school_id = $1 where id = $2`, [school.S2, fam.B]);
  // família C fica sem escola (caso padrão de hoje)
});
afterAll(async () => {
  await db.close();
});

describe('school_id é opcional', () => {
  it('família nova nasce sem escola', async () => {
    const { rows } = await db.admin.query(`select school_id from family where id = $1`, [fam.C]);
    expect(rows[0].school_id).toBeNull();
  });

  it('apagar a escola não apaga a família: school_id volta a nulo', async () => {
    const id = (await db.admin.query(`insert into school(name) values ('Temporária') returning id`)).rows[0].id;
    await db.admin.query(`update family set school_id = $1 where id = $2`, [id, fam.C]);
    await db.admin.query(`delete from school where id = $1`, [id]);
    const { rows } = await db.admin.query(`select school_id from family where id = $1`, [fam.C]);
    expect(rows).toHaveLength(1);
    expect(rows[0].school_id).toBeNull();
  });

  it('nome da escola não pode ser vazio', async () => {
    await expect(db.admin.query(`insert into school(name) values ('  ')`)).rejects.toThrow(/check/);
  });
});

describe('RLS da tabela school', () => {
  it('responsável vê só a escola da própria família', async () => {
    const a = await db.asUser(uA, async (c) => (await c.query(`select id from school`)).rows.map((r) => r.id));
    const b = await db.asUser(uB, async (c) => (await c.query(`select id from school`)).rows.map((r) => r.id));
    expect(a).toEqual([school.S1]);
    expect(b).toEqual([school.S2]);
  });

  it('família sem escola não vê nenhuma', async () => {
    const rows = await db.asUser(uC, async (c) => (await c.query(`select id from school`)).rows);
    expect(rows).toEqual([]);
  });

  it('buscar por id de escola de outra família não retorna nada', async () => {
    const rows = await db.asUser(uA, async (c) => (await c.query(`select 1 from school where id = $1`, [school.S2])).rows);
    expect(rows).toEqual([]);
  });

  it('anon não acessa school', async () => {
    await expect(db.asAnon((c) => c.query(`select * from school`))).rejects.toThrow(/permission denied/);
  });

  it('responsável não escreve em school', async () => {
    for (const sql of [
      `insert into school(name) values ('x')`,
      `update school set name = 'x'`,
      `delete from school`,
    ]) {
      await expect(db.asUser(uA, (c) => c.query(sql))).rejects.toThrow(/permission denied/);
    }
  });

  it('responsável não consegue vincular a família a uma escola', async () => {
    await expect(
      db.asUser(uC, (c) => c.query(`update family set school_id = $1 where id = $2`, [school.S1, fam.C])),
    ).rejects.toThrow(/permission denied/);
  });
});

describe('isolamento por família continua valendo com escola', () => {
  it('duas famílias na mesma escola não enxergam dados uma da outra', async () => {
    await db.admin.query(`update family set school_id = $1 where id = $2`, [school.S1, fam.C]);
    const seenByA = await db.asUser(uA, async (c) => (await c.query(`select id from family`)).rows.map((r) => r.id));
    const seenByC = await db.asUser(uC, async (c) => (await c.query(`select id from family`)).rows.map((r) => r.id));
    expect(seenByA).toEqual([fam.A]);
    expect(seenByC).toEqual([fam.C]);
    const guardiansA = await db.asUser(uA, async (c) => (await c.query(`select family_id from guardian`)).rows);
    expect(guardiansA.every((r) => r.family_id === fam.A)).toBe(true);
  });
});
