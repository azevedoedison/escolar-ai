import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from './helpers';

let db: TestDb;
const u1 = '00000000-0000-0000-0000-0000000000c1';
const u2 = '00000000-0000-0000-0000-0000000000c2';
const noEmail = '00000000-0000-0000-0000-0000000000c3';

beforeAll(async () => {
  db = await createTestDb();
  await db.admin.query(
    `insert into auth.users(id, email) values ($1,'um@exemplo.com'), ($2,'dois@exemplo.com'), ($3, null)`,
    [u1, u2, noEmail],
  );
});
afterAll(async () => {
  await db.close();
});

const register = (c: import('pg').Client, name = 'Maria', consent = true, v = 'termos-2026-11') =>
  c.query(`select public.register_guardian($1, $2, $3) as family_id`, [name, consent, v]);

describe('register_guardian', () => {
  it('cria família, responsável owner com consentimento, configurações e auditoria', async () => {
    const familyId = await db.asUser(u1, async (c) => {
      const { rows } = await register(c, '  Maria  ');
      const fam = rows[0].family_id as string;
      const g = (await c.query(`select name, email, role, consent_at, consent_version, family_id from guardian`)).rows;
      expect(g).toHaveLength(1);
      expect(g[0]).toMatchObject({ name: 'Maria', email: 'um@exemplo.com', role: 'owner', consent_version: 'termos-2026-11', family_id: fam });
      expect(g[0].consent_at).toBeInstanceOf(Date);
      expect((await c.query(`select * from family_settings`)).rows).toHaveLength(1);
      expect((await c.query(`select action from audit_log`)).rows).toEqual([{ action: 'consent_accepted' }]);
      return fam;
    });
    expect(familyId).toBeTruthy();
  });

  it('exige consentimento verdadeiro', async () => {
    await expect(db.asUser(u1, (c) => register(c, 'Maria', false))).rejects.toThrow(/consent_required/);
    await expect(db.asUser(u1, (c) => c.query(`select public.register_guardian('Maria', null, 'v1')`))).rejects.toThrow(/consent_required/);
  });

  it('exige nome e versão do termo', async () => {
    await expect(db.asUser(u1, (c) => register(c, '   '))).rejects.toThrow(/invalid_input/);
    await expect(db.asUser(u1, (c) => register(c, 'Maria', true, ''))).rejects.toThrow(/invalid_input/);
  });

  it('não funciona sem login nem para usuário sem e-mail', async () => {
    await expect(db.asAnon((c) => register(c))).rejects.toThrow(/permission denied/);
    await expect(db.asUser(noEmail, (c) => register(c))).rejects.toThrow(/not_authenticated/);
  });

  it('não registra duas vezes o mesmo usuário', async () => {
    await db.admin.query('begin');
    try {
      await db.admin.query(`set local role authenticated`);
      await db.admin.query(`select set_config('request.jwt.claim.sub', $1, true)`, [u2]);
      await register(db.admin);
      await expect(register(db.admin)).rejects.toThrow(/already_registered/);
    } finally {
      await db.admin.query('rollback');
    }
  });

  it('dois cadastros geram famílias separadas e isoladas', async () => {
    await db.admin.query('begin');
    try {
      for (const u of [u1, u2]) {
        await db.admin.query(`set local role authenticated`);
        await db.admin.query(`select set_config('request.jwt.claim.sub', $1, true)`, [u]);
        await register(db.admin, `Resp ${u.slice(-1)}`);
        await db.admin.query(`reset role`);
      }
      await db.admin.query(`set local role authenticated`);
      await db.admin.query(`select set_config('request.jwt.claim.sub', $1, true)`, [u1]);
      const g = (await db.admin.query(`select name from guardian`)).rows;
      expect(g).toEqual([{ name: 'Resp 1' }]);
      expect((await db.admin.query(`select * from family`)).rows).toHaveLength(1);
    } finally {
      await db.admin.query('rollback');
    }
  });
});
