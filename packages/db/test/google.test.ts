import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Client } from 'pg';
import { createTestDb, type TestDb } from './helpers';

let db: TestDb;
const uA = '00000000-0000-0000-0000-0000000000f1';
const uB = '00000000-0000-0000-0000-0000000000f2';
const year = new Date().getFullYear();
let childA: string;
let childB: string;

async function commitAs<T>(u: string, fn: (c: Client) => Promise<T>): Promise<T> {
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

const link = (u: string, child: string, email: string | null) =>
  commitAs(u, (c) => c.query(`select public.set_child_google($1,$2)`, [child, email]));

async function paired(u: string, child: string) {
  const code = (await commitAs(u, async (c) => (await c.query(`select code from public.create_pairing_code($1)`, [child])).rows[0])).code;
  return (await db.admin.query(`select * from public.redeem_pairing_code($1,'android',$2,'Tablet')`, [code, `ip-${Math.random()}`])).rows[0] as {
    device_id: string;
    device_token: string;
  };
}
const google = async (token: string, sub: string | null, email: string | null) =>
  (await db.admin.query(`select * from public.child_login_google($1,$2,$3)`, [token, sub, email])).rows[0];

beforeAll(async () => {
  db = await createTestDb();
  await db.admin.query(
    `insert into auth.users(id, email, encrypted_password) values
       ($1,'resp.a@exemplo.com', crypt('senhaDoPai123', gen_salt('bf'))),
       ($2,'resp.b@exemplo.com', crypt('senhaDaMae123', gen_salt('bf')))`,
    [uA, uB],
  );
  for (const u of [uA, uB]) await commitAs(u, (c) => c.query(`select public.register_guardian('Resp', true, 'v1')`));
  childA = await commitAs(uA, async (c) => (await c.query(`select public.create_child('Tati',$1,'6º ano','raposa','123456') as id`, [year - 11])).rows[0].id);
  childB = await commitAs(uB, async (c) => (await c.query(`select public.create_child('Beto',$1,'5º ano','gato','654321') as id`, [year - 10])).rows[0].id);
});
beforeEach(async () => {
  await db.admin.query('delete from attempt_counter');
  await db.admin.query('update child set google_email = null, google_sub = null');
});
afterAll(async () => {
  await db.close();
});

describe('login com Google', () => {
  it('sem vínculo do responsável, nenhuma conta Google entra', async () => {
    const d = await paired(uA, childA);
    expect((await google(d.device_token, 'sub-1', 'tati@gmail.com')).status).toBe('invalid');
  });

  it('com e-mail vinculado, o primeiro login grava o sub e abre a sessão', async () => {
    await link(uA, childA, 'Tati@Gmail.com');
    const d = await paired(uA, childA);
    const r = await google(d.device_token, 'sub-1', 'tati@gmail.com');
    expect(r.status).toBe('ok');
    expect((await db.admin.query(`select * from public.verify_child_session($1)`, [r.session_token])).rows[0]).toMatchObject({ child_id: childA });
    expect((await db.admin.query(`select google_sub from child where id=$1`, [childA])).rows[0].google_sub).toBe('sub-1');
  });

  it('depois do primeiro login vale o sub: outra conta com o mesmo e-mail é recusada', async () => {
    await link(uA, childA, 'tati@gmail.com');
    const d = await paired(uA, childA);
    expect((await google(d.device_token, 'sub-1', 'tati@gmail.com')).status).toBe('ok');
    expect((await google(d.device_token, 'sub-2', 'tati@gmail.com')).status).toBe('invalid');
    expect((await google(d.device_token, 'sub-1', 'outro@gmail.com')).status).toBe('ok');
  });

  it('e-mail diferente do vinculado é recusado', async () => {
    await link(uA, childA, 'tati@gmail.com');
    const d = await paired(uA, childA);
    expect((await google(d.device_token, 'sub-9', 'estranho@gmail.com')).status).toBe('invalid');
    expect((await google(d.device_token, null, 'tati@gmail.com')).status).toBe('invalid');
  });

  it('usa o contador do PIN: 6 erros bloqueiam, inclusive o PIN correto', async () => {
    await link(uA, childA, 'tati@gmail.com');
    const d = await paired(uA, childA);
    for (let i = 0; i < 6; i++) expect((await google(d.device_token, 'x', 'estranho@gmail.com')).status).toBe('invalid');
    expect((await google(d.device_token, 'sub-1', 'tati@gmail.com')).status).toBe('locked');
    expect((await db.admin.query(`select status from public.child_login($1,null,'123456')`, [d.device_token])).rows[0].status).toBe('locked');
  });

  it('aparelho revogado não entra', async () => {
    await link(uA, childA, 'tati@gmail.com');
    const d = await paired(uA, childA);
    await commitAs(uA, (c) => c.query(`select public.revoke_device($1)`, [d.device_id]));
    expect((await google(d.device_token, 'sub-1', 'tati@gmail.com')).status).toBe('revoked');
  });

  it('a conta Google do filho A não abre sessão no aparelho do filho B', async () => {
    await link(uA, childA, 'tati@gmail.com');
    const devB = await paired(uB, childB);
    expect((await google(devB.device_token, 'sub-1', 'tati@gmail.com')).status).toBe('invalid');
  });
});

describe('vínculo pelo responsável', () => {
  it('trocar o e-mail zera o sub; desvincular impede o login', async () => {
    await link(uA, childA, 'tati@gmail.com');
    const d = await paired(uA, childA);
    await google(d.device_token, 'sub-1', 'tati@gmail.com');
    await link(uA, childA, 'novo@gmail.com');
    expect((await db.admin.query(`select google_sub from child where id=$1`, [childA])).rows[0].google_sub).toBeNull();
    await link(uA, childA, null);
    expect((await google(d.device_token, 'sub-2', 'novo@gmail.com')).status).toBe('invalid');
  });

  it('responsável não vincula Google em filho de outra família e rejeita e-mail inválido', async () => {
    await expect(link(uA, childB, 'x@gmail.com')).rejects.toThrow(/child_not_found/);
    await expect(link(uA, childA, 'sem-arroba')).rejects.toThrow(/invalid_email/);
  });

  it('o mesmo e-mail Google não vincula dois filhos', async () => {
    await link(uA, childA, 'tati@gmail.com');
    await expect(link(uB, childB, 'TATI@gmail.com')).rejects.toThrow(/email_in_use/);
  });

  it('o responsável não lê o sub nem chama a função da API', async () => {
    await link(uA, childA, 'tati@gmail.com');
    await expect(commitAs(uA, (c) => c.query(`select google_sub from public.child`))).rejects.toThrow(/permission denied/);
    await expect(commitAs(uA, (c) => c.query(`select public.child_login_google('x','y','z')`))).rejects.toThrow(/permission denied/);
    const ok = await commitAs(uA, (c) => c.query(`select google_email from public.child where id=$1`, [childA]));
    expect(ok.rows[0].google_email).toBe('tati@gmail.com');
  });
});
