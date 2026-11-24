import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import { createPairingStore } from './pairing-store';
import type { MailMessage } from './mailer';

// Ponta a ponta: cadastro -> e-mail simulado -> link -> login, e esqueci a senha, tudo no banco real.
const adminUrl = process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/postgres';
const repo = join(import.meta.dirname, '..', '..', '..');
const name = `tata_reset_${randomBytes(6).toString('hex')}`;
const SECRET = 'segredo-de-teste';
const user = '00000000-0000-0000-0000-0000000000b1';
const EMAIL = 'maria@exemplo.com';
let pool: pg.Pool;
let app: ReturnType<typeof createApp>;
const inbox: MailMessage[] = [];

const post = (path: string, body: unknown, token?: string, ip = '1.2.3.4') =>
  app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
const mailToken = async (kind: 'confirm-email' | 'reset-password') => {
  await vi.waitFor(() => expect(inbox.length).toBeGreaterThan(0));
  const m = inbox.pop()!;
  expect(m.text).toContain(`/${kind}?token=`);
  return m.text.match(/token=([0-9a-f]{64})/)![1]!;
};

beforeAll(async () => {
  const root = new pg.Client({ connectionString: adminUrl });
  await root.connect();
  await root.query(`create database ${name}`);
  await root.end();
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  pool = new pg.Pool({ connectionString: url.toString() });
  await pool.query(readFileSync(join(repo, 'packages/db/test/supabase-stub.sql'), 'utf8'));
  const dir = join(repo, 'supabase', 'migrations');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) await pool.query(readFileSync(join(dir, f), 'utf8'));
  // O app cadastra com supabase.auth.signUp e em seguida chama register_guardian; aqui simulamos os dois.
  await pool.query(`insert into auth.users(id,email,encrypted_password) values ($1,$2, crypt('senhaAntiga123', gen_salt('bf')))`, [user, EMAIL]);
  const c = await pool.connect();
  await c.query('begin');
  await c.query('set local role authenticated');
  await c.query(`select set_config('request.jwt.claim.sub', $1, true)`, [user]);
  await c.query(`select public.register_guardian('Maria Souza', true, 'v1')`);
  await c.query('commit');
  c.release();
  app = createApp(undefined, {
    store: createPairingStore(pool),
    tokenSecret: SECRET,
    mailer: { send: async (m) => void inbox.push(m) },
    appBaseUrl: 'https://tata.exemplo',
  });
});
afterAll(async () => {
  await pool.end();
  const c = new pg.Client({ connectionString: adminUrl });
  await c.connect();
  await c.query(`drop database if exists ${name} with (force)`);
  await c.end();
});

describe('fluxo completo do responsável', () => {
  it('cadastro: login recusado até confirmar, depois entra; o link só vale uma vez', async () => {
    expect((await post('/guardian/login', { email: EMAIL, password: 'senhaAntiga123' })).status).toBe(403);
    expect((await post('/guardian/login', { email: EMAIL, password: 'errada' })).status).toBe(401);

    expect((await post('/guardian/email/resend', { email: EMAIL })).status).toBe(202);
    const token = await mailToken('confirm-email');
    expect((await post('/guardian/email/confirm', { token })).status).toBe(200);
    expect((await post('/guardian/email/confirm', { token })).status).toBe(400);

    const login = await post('/guardian/login', { email: EMAIL, password: 'senhaAntiga123' });
    expect(login.status).toBe(200);
  });

  it('esqueci a senha: resposta igual com e sem conta, troca a senha e derruba as sessões', async () => {
    const first = await post('/guardian/login', { email: EMAIL, password: 'senhaAntiga123' });
    const { token: session } = (await first.json()) as { token: string };
    expect((await pool.query(`select * from public.verify_guardian_session($1)`, [session])).rowCount).toBe(1);

    const real = await post('/guardian/password/forgot', { email: EMAIL });
    const fake = await post('/guardian/password/forgot', { email: 'ninguem@exemplo.com' }, undefined, '5.5.5.5');
    expect(real.status).toBe(fake.status);
    expect(await real.text()).toBe(await fake.text());
    const token = await mailToken('reset-password');
    await new Promise((r) => setTimeout(r, 20));
    expect(inbox).toHaveLength(0);

    const weak = await post('/guardian/password/reset', { token, password: 'curta' });
    expect(await weak.json()).toMatchObject({ error: 'weak' });
    expect((await post('/guardian/password/reset', { token, password: 'senhaNova456' })).status).toBe(200);
    expect((await post('/guardian/password/reset', { token, password: 'outraSenha789' })).status).toBe(400);

    expect((await pool.query(`select * from public.verify_guardian_session($1)`, [session])).rowCount).toBe(0);
    expect((await post('/guardian/login', { email: EMAIL, password: 'senhaAntiga123' })).status).toBe(401);
    expect((await post('/guardian/login', { email: EMAIL, password: 'senhaNova456' })).status).toBe(200);

    const actions = (await pool.query(`select action from audit_log`)).rows.map((r) => r.action);
    expect(actions).toEqual(expect.arrayContaining(['email_confirmed', 'password_reset_requested', 'password_reset']));
  });

  it('link vencido é recusado', async () => {
    await post('/guardian/password/forgot', { email: EMAIL }, undefined, '7.7.7.7');
    const token = await mailToken('reset-password');
    await pool.query(`update guardian_email_token set expires_at = now() - interval '1 minute'`);
    const r = await post('/guardian/password/reset', { token, password: 'senhaNova999' });
    expect(r.status).toBe(400);
    expect((await post('/guardian/login', { email: EMAIL, password: 'senhaNova456' })).status).toBe(200);
  });
});
