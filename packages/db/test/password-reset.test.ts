import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Client } from 'pg';
import { createTestDb, type TestDb } from './helpers';

let db: TestDb;
const uA = '00000000-0000-0000-0000-0000000000f1';
const uB = '00000000-0000-0000-0000-0000000000f2';
const emailA = 'resp.a@exemplo.com';
const SENHA = 'senhaDoPai123';
let guardianA: string;
let familyA: string;

const q = (s: string, p?: unknown[]) => db.admin.query(s, p);

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

const confirmReq = async (email = emailA, origin = 'ip-1') =>
  (await q(`select * from public.guardian_confirm_request($1,$2)`, [email, origin])).rows;
const resetReq = async (email = emailA, origin = 'ip-1') =>
  (await q(`select * from public.guardian_password_reset_request($1,$2)`, [email, origin])).rows;
const confirm = async (token: string, origin = 'ip-1') =>
  (await q(`select public.guardian_confirm_email($1,$2) as s`, [token, origin])).rows[0].s as string;
const reset = async (token: string, pw: string, origin = 'ip-1') =>
  (await q(`select public.guardian_password_reset($1,$2,$3) as s`, [token, pw, origin])).rows[0].s as string;
const login = async (email: string, pw: string) =>
  (await q(`select * from public.guardian_login($1,$2)`, [email, pw])).rows[0];
const actions = async () => (await q(`select action from audit_log where family_id=$1 order by created_at, id`, [familyA])).rows.map((r) => r.action);

beforeAll(async () => {
  db = await createTestDb();
  await q(
    `insert into auth.users(id, email, encrypted_password) values
       ($1,$3, crypt($4, gen_salt('bf'))), ($2,'resp.b@exemplo.com', crypt('senhaDaMae123', gen_salt('bf')))`,
    [uA, uB, emailA, SENHA],
  );
  for (const u of [uA, uB]) await commitAs(u, (c) => c.query(`select public.register_guardian('Resp', true, 'v1')`));
  const g = (await q(`select id, family_id from guardian where auth_user_id=$1`, [uA])).rows[0];
  guardianA = g.id;
  familyA = g.family_id;
});
beforeEach(async () => {
  await q('delete from attempt_counter');
  await q('delete from guardian_email_token');
  await q('delete from guardian_session');
  await q('delete from audit_log');
  await q('delete from child');
  await q('update guardian set email_confirmed_at = null');
  await q(`update auth.users set encrypted_password = crypt($2, gen_salt('bf')) where id=$1`, [uA, SENHA]);
});
afterAll(async () => {
  await db.close();
});

describe('confirmação de e-mail', () => {
  it('o cadastro novo começa sem confirmação e o login é recusado só depois de acertar a senha', async () => {
    expect(await login(emailA, SENHA)).toMatchObject({ status: 'unconfirmed', token: null });
    expect(await login(emailA, 'errada123')).toMatchObject({ status: 'invalid' });
    expect(await login('ninguem@exemplo.com', SENHA)).toMatchObject({ status: 'invalid' });
  });

  it('o link confirma a conta, vale uma vez só e vai para a auditoria', async () => {
    const [{ token, guardian_name }] = await confirmReq();
    expect(guardian_name).toBe('Resp');
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    const stored = (await q(`select token_hash from guardian_email_token`)).rows[0];
    expect(stored.token_hash).not.toContain(token);
    expect(await confirm(token)).toBe('ok');
    expect(await confirm(token)).toBe('invalid');
    expect((await login(emailA, SENHA)).status).toBe('ok');
    expect(await actions()).toEqual(['email_confirmation_requested', 'email_confirmed', 'guardian_login']);
  });

  it('link vencido, inventado ou de outro tipo dá a mesma resposta', async () => {
    const [{ token }] = await confirmReq();
    await q(`update guardian_email_token set expires_at = now() - interval '1 second'`);
    expect(await confirm(token)).toBe('invalid');
    expect(await confirm('naoexiste')).toBe('invalid');
    expect(await confirm(null as unknown as string)).toBe('invalid');
    const [{ token: reset_ }] = await resetReq();
    expect(await confirm(reset_)).toBe('invalid');
    expect((await q(`select email_confirmed_at from guardian where id=$1`, [guardianA])).rows[0].email_confirmed_at).toBeNull();
  });

  it('o link de confirmação vale 24 horas e um pedido novo invalida o anterior', async () => {
    const [{ token: t1 }] = await confirmReq();
    const [{ token: t2 }] = await confirmReq();
    expect(await confirm(t1)).toBe('invalid');
    const exp = (await q(`select extract(epoch from expires_at - now()) as s from guardian_email_token where used_at is null`)).rows[0].s;
    expect(Number(exp)).toBeGreaterThan(23 * 3600);
    expect(Number(exp)).toBeLessThanOrEqual(24 * 3600);
    expect(await confirm(t2)).toBe('ok');
  });

  it('não reenvia para conta já confirmada nem para e-mail sem conta', async () => {
    expect(await confirmReq('ninguem@exemplo.com')).toEqual([]);
    expect(await confirmReq('')).toEqual([]);
    await q(`update guardian set email_confirmed_at = now()`);
    expect(await confirmReq()).toEqual([]);
  });

  it('o e-mail é comparado sem diferenciar maiúsculas e espaços', async () => {
    expect(await confirmReq('  Resp.A@Exemplo.com ')).toHaveLength(1);
  });

  it('o modo Responsável também exige confirmação', async () => {
    const child = await commitAs(uA, async (c) => (await c.query(`select public.create_child('Tati',$1,'6º ano','raposa','123456') as id`, [new Date().getFullYear() - 11])).rows[0].id);
    const dev = (await q(`insert into device(child_id, platform, token_hash) values ($1,'android','dh') returning id`, [child])).rows[0].id;
    await q(`insert into child_session(device_id, child_id, token_hash, expires_at) values ($1,$2, public._sha256('st'), now() + interval '1 day')`, [dev, child]);
    const enter = async (pw: string) => (await q(`select * from public.guardian_mode_enter('st', $1, $2)`, [emailA, pw])).rows[0];
    expect(await enter('errada123')).toMatchObject({ status: 'invalid' });
    expect(await enter(SENHA)).toMatchObject({ status: 'unconfirmed', mode_token: null });
    const [{ token }] = await confirmReq();
    await confirm(token);
    expect((await enter(SENHA)).status).toBe('ok');
  });
});

describe('recuperação de senha', () => {
  it('troca a senha, usa o link uma vez e registra na auditoria', async () => {
    await q(`update guardian set email_confirmed_at = now()`);
    const [{ token }] = await resetReq();
    const exp = (await q(`select extract(epoch from expires_at - now()) as s from guardian_email_token`)).rows[0].s;
    expect(Number(exp)).toBeGreaterThan(59 * 60);
    expect(Number(exp)).toBeLessThanOrEqual(3600);
    expect(await reset(token, 'senhaNovaForte1')).toBe('ok');
    expect(await reset(token, 'outra senha de teste')).toBe('invalid');
    expect((await login(emailA, SENHA)).status).toBe('invalid');
    expect((await login(emailA, 'senhaNovaForte1')).status).toBe('ok');
    const a = await actions();
    expect(a).toContain('password_reset_requested');
    expect(a).toContain('password_reset');
    const log = JSON.stringify((await q(`select * from audit_log`)).rows);
    expect(log).not.toContain(token);
    expect(log).not.toContain('senhaNovaForte1');
  });

  it('link vencido não troca a senha', async () => {
    await q(`update guardian set email_confirmed_at = now()`);
    const [{ token }] = await resetReq();
    await q(`update guardian_email_token set expires_at = now() - interval '1 second'`);
    expect(await reset(token, 'senhaNovaForte1')).toBe('invalid');
    expect((await login(emailA, SENHA)).status).toBe('ok');
  });

  it('senha curta é recusada sem gastar o link', async () => {
    const [{ token }] = await resetReq();
    expect(await reset(token, 'curta')).toBe('weak');
    expect(await reset(token, '')).toBe('weak');
    expect(await reset('inventado', 'curta')).toBe('invalid');
    expect(await reset(token, 'senhaNovaForte1')).toBe('ok');
  });

  it('um pedido novo invalida o anterior', async () => {
    const [{ token: t1 }] = await resetReq();
    const [{ token: t2 }] = await resetReq();
    expect(await reset(t1, 'senhaNovaForte1')).toBe('invalid');
    expect(await reset(t2, 'senhaNovaForte1')).toBe('ok');
  });

  it('conta inexistente não gera token nem erro', async () => {
    expect(await resetReq('ninguem@exemplo.com')).toEqual([]);
    expect(await resetReq('')).toEqual([]);
    expect((await q(`select count(*)::int as n from guardian_email_token`)).rows[0].n).toBe(0);
  });

  it('limita a 3 pedidos por e-mail por hora, em silêncio', async () => {
    expect(await resetReq()).toHaveLength(1);
    expect(await resetReq()).toHaveLength(1);
    expect(await resetReq()).toHaveLength(1);
    expect(await resetReq()).toEqual([]);
    // O limite vale para e-mail sem conta também: a resposta não revela a diferença.
    for (let i = 0; i < 4; i++) await resetReq('ninguem@exemplo.com', `ip-${i}`);
    expect((await q(`select locked_until is not null as l from attempt_counter where scope='email_token_reset_password' and key='ninguem@exemplo.com'`)).rows[0].l).toBe(true);
  });

  it('limita 20 pedidos por origem por hora', async () => {
    for (let i = 0; i < 20; i++) await resetReq(`conta${i}@exemplo.com`, 'ip-spam');
    expect(await resetReq(emailA, 'ip-spam')).toEqual([]);
    expect(await resetReq(emailA, 'ip-outro')).toHaveLength(1);
  });

  it('muitos links inválidos bloqueiam a origem', async () => {
    for (let i = 0; i < 10; i++) expect(await reset(`falso${i}`, 'senhaNovaForte1', 'ip-ruim')).toBe('invalid');
    const [{ token }] = await resetReq(emailA, 'ip-bom');
    expect(await reset(token, 'senhaNovaForte1', 'ip-ruim')).toBe('locked');
    expect(await reset(token, 'senhaNovaForte1', 'ip-bom')).toBe('ok');
  });

  it('encerra todas as sessões do responsável e não toca nas de outro', async () => {
    await q(`update guardian set email_confirmed_at = now()`);
    const s1 = await login(emailA, SENHA);
    await q(`insert into auth.sessions(user_id) values ($1), ($2)`, [uA, uB]);
    const gB = (await q(`select id from guardian where auth_user_id=$1`, [uB])).rows[0].id;
    await q(`insert into guardian_session(guardian_id, token_hash, expires_at) values ($1,'hb', now() + interval '1 day')`, [gB]);
    expect((await q(`select * from public.verify_guardian_session($1)`, [s1.token])).rowCount).toBe(1);
    const [{ token }] = await resetReq();
    expect(await reset(token, 'senhaNovaForte1')).toBe('ok');
    expect((await q(`select * from public.verify_guardian_session($1)`, [s1.token])).rowCount).toBe(0);
    expect((await q(`select count(*)::int as n from guardian_session where guardian_id=$1`, [guardianA])).rows[0].n).toBe(0);
    expect((await q(`select count(*)::int as n from auth.sessions where user_id=$1`, [uA])).rows[0].n).toBe(0);
    expect((await q(`select count(*)::int as n from auth.sessions where user_id=$1`, [uB])).rows[0].n).toBe(1);
    expect((await q(`select count(*)::int as n from guardian_session where guardian_id=$1`, [gB])).rows[0].n).toBe(1);
  });

  it('encerra também as sessões do modo Responsável', async () => {
    const child = await commitAs(uA, async (c) => (await c.query(`select public.create_child('Tati',$1,'6º ano','raposa','123456') as id`, [new Date().getFullYear() - 11])).rows[0].id);
    const dev = (await q(`insert into device(child_id, platform, token_hash) values ($1,'android','dh') returning id`, [child])).rows[0].id;
    const cs = (await q(`insert into child_session(device_id, child_id, token_hash, expires_at) values ($1,$2,'ch', now() + interval '1 day') returning id`, [dev, child])).rows[0].id;
    await q(`insert into guardian_mode_session(session_id, guardian_id, token_hash, expires_at) values ($1,$2,'mh', now() + interval '15 minutes')`, [cs, guardianA]);
    const [{ token }] = await resetReq();
    expect(await reset(token, 'senhaNovaForte1')).toBe('ok');
    expect((await q(`select count(*)::int as n from guardian_mode_session`)).rows[0].n).toBe(0);
    // A sessão da criança continua: o PIN dela é independente.
    expect((await q(`select count(*)::int as n from child_session where id=$1`, [cs])).rows[0].n).toBe(1);
  });

  it('quem recebeu o link de redefinição fica com o e-mail confirmado e o bloqueio de login é zerado', async () => {
    for (let i = 0; i < 5; i++) await login(emailA, 'errada123');
    expect((await login(emailA, SENHA)).status).toBe('locked');
    const [{ token }] = await resetReq();
    expect(await reset(token, 'senhaNovaForte1')).toBe('ok');
    expect((await login(emailA, 'senhaNovaForte1')).status).toBe('ok');
  });

  it('a senha nova fica em bcrypt, nunca em texto', async () => {
    const [{ token }] = await resetReq();
    await reset(token, 'senhaNovaForte1');
    const h = (await q(`select encrypted_password from auth.users where id=$1`, [uA])).rows[0].encrypted_password;
    expect(h).toMatch(/^\$2[aby]\$10\$/);
  });
});

describe('isolamento', () => {
  it('responsável autenticado não lê nem chama nada disso', async () => {
    await resetReq();
    await expect(commitAs(uA, (c) => c.query(`select * from guardian_email_token`))).rejects.toThrow(/permission denied/);
    await expect(commitAs(uA, (c) => c.query(`select * from public.guardian_password_reset_request($1,'x')`, [emailA]))).rejects.toThrow(/permission denied/);
    await expect(commitAs(uA, (c) => c.query(`select public.guardian_password_reset('x','senhaNovaForte1','x')`))).rejects.toThrow(/permission denied/);
    await expect(commitAs(uA, (c) => c.query(`select public.guardian_confirm_email('x','x')`))).rejects.toThrow(/permission denied/);
    await expect(db.asAnon((c) => c.query(`select * from guardian_email_token`))).rejects.toThrow(/permission denied/);
  });
});
