import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from './helpers';

let db: TestDb;
const uA = '00000000-0000-0000-0000-0000000000d1';
const uB = '00000000-0000-0000-0000-0000000000d2';
const uNone = '00000000-0000-0000-0000-0000000000d3';
const year = new Date().getFullYear();

beforeAll(async () => {
  db = await createTestDb();
  await db.admin.query(
    `insert into auth.users(id, email) values ($1,'a@exemplo.com'), ($2,'b@exemplo.com'), ($3,'c@exemplo.com')`,
    [uA, uB, uNone],
  );
  for (const u of [uA, uB]) {
    await asUserCommit(u, (c) => c.query(`select public.register_guardian('Resp', true, 'v1')`));
  }
});
afterAll(async () => {
  await db.close();
});

// asUser sempre reverte; para persistir usamos admin com papel e COMMIT manual.
async function asUserCommit<T>(u: string, fn: (c: import('pg').Client) => Promise<T>): Promise<T> {
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

const create = (c: import('pg').Client, over: Partial<{ n: string; y: number; g: string | null; a: string; pin: string }> = {}) =>
  c.query(`select public.create_child($1,$2,$3,$4,$5) as id`, [
    over.n ?? 'Tati', over.y ?? year - 11, over.g === undefined ? '6º ano' : over.g, over.a ?? 'raposa', over.pin ?? '123456',
  ]);

describe('create_child', () => {
  let childId: string;

  it('cria o filho na família do responsável e guarda só o hash do PIN', async () => {
    await asUserCommit(uA, async (c) => {
      const { rows } = await create(c, { n: '  Tati ' });
      childId = rows[0].id;
      const child = (await c.query(`select nickname, birth_year, grade, avatar, active from child where id=$1`, [childId])).rows[0];
      expect(child).toMatchObject({ nickname: 'Tati', grade: '6º ano', avatar: 'raposa', active: true });
    });
    const { rows } = await db.admin.query(`select pin_hash, family_id from child where id=$1`, [childId]);
    expect(rows[0].pin_hash).not.toContain('123456');
    expect(rows[0].pin_hash).toMatch(/^\$2[aby]\$/);
    const ok = await db.admin.query(`select (pin_hash = crypt('123456', pin_hash)) as ok, (pin_hash = crypt('000000', pin_hash)) as bad from child where id=$1`, [childId]);
    expect(ok.rows[0]).toEqual({ ok: true, bad: false });
    const log = await db.admin.query(`select action from audit_log where target=$1`, [childId]);
    expect(log.rows).toEqual([{ action: 'child_created' }]);
  });

  it('o filho aparece só para a família A', async () => {
    const a = await db.asUser(uA, async (c) => (await c.query(`select id from child`)).rows);
    const b = await db.asUser(uB, async (c) => (await c.query(`select id from child`)).rows);
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(0);
  });

  it('valida apelido, ano de nascimento e PIN', async () => {
    await expect(db.asUser(uA, (c) => create(c, { n: ' ' }))).rejects.toThrow(/invalid_nickname/);
    await expect(db.asUser(uA, (c) => create(c, { y: year - 3 }))).rejects.toThrow(/invalid_birth_year/);
    await expect(db.asUser(uA, (c) => create(c, { y: year - 25 }))).rejects.toThrow(/invalid_birth_year/);
    for (const pin of ['123', '1234567', 'abcd', '12 34']) {
      await expect(db.asUser(uA, (c) => create(c, { pin }))).rejects.toThrow(/invalid_pin/);
    }
  });

  it('só responsável cadastra; anônimo não', async () => {
    await expect(db.asUser(uNone, (c) => create(c))).rejects.toThrow(/not_a_guardian/);
    await expect(db.asAnon((c) => create(c))).rejects.toThrow(/permission denied/);
  });

  it('set_child_pin troca o PIN só de filho da própria família', async () => {
    await asUserCommit(uA, (c) => c.query(`select public.set_child_pin($1, '4321')`, [childId]));
    const r = await db.admin.query(`select (pin_hash = crypt('4321', pin_hash)) as ok from child where id=$1`, [childId]);
    expect(r.rows[0].ok).toBe(true);
    await expect(db.asUser(uB, (c) => c.query(`select public.set_child_pin($1, '4321')`, [childId]))).rejects.toThrow(/child_not_found/);
    await expect(db.asUser(uA, (c) => c.query(`select public.set_child_pin($1, 'abc')`, [childId]))).rejects.toThrow(/invalid_pin/);
  });
});
