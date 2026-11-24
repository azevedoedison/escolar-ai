import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { createGoogleAuth } from './google';
import { createPairingStore } from './pairing-store';
import { createPgStore } from './store';

// Ponta a ponta: pareamento e login reais (SQL) -> token aceito pelo /chat real.
const adminUrl = process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/postgres';
const repo = join(import.meta.dirname, '..', '..', '..');
const name = `tata_pair_${randomBytes(6).toString('hex')}`;
const SECRET = 'segredo-de-teste';
let pool: pg.Pool;
let app: ReturnType<typeof createApp>;
let childId: string;
let familyId: string;
const GOOGLE_CFG = { clientId: 'cid.apps.googleusercontent.com', clientSecret: 'x', redirectUris: ['tata://auth'] };
const idToken = (c: object) => `h.${Buffer.from(JSON.stringify(c)).toString('base64url')}.s`;
/** Google de mentira: o código "ana" devolve a conta da Ana; "intruso" devolve outra conta. */
const fakeGoogle = (async (_url: unknown, init?: { body?: URLSearchParams }) => {
  const code = init?.body?.get('code');
  const who = code === 'ana' ? { sub: 'g-ana', email: 'ana@gmail.com' } : code === 'intruso' ? { sub: 'g-x', email: 'intruso@gmail.com' } : null;
  if (!who) return new Response('{}', { status: 400 });
  const claims = { iss: 'https://accounts.google.com', aud: GOOGLE_CFG.clientId, exp: Math.floor(Date.now() / 1000) + 3600, email_verified: true, ...who };
  return new Response(JSON.stringify({ id_token: idToken(claims) }));
}) as unknown as typeof fetch;
const guardianUser = '00000000-0000-0000-0000-0000000000a1';

const post = (path: string, body: unknown, token?: string, extra: Record<string, string> = {}) =>
  app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...extra },
    body: JSON.stringify(body),
  });

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
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    await pool.query(readFileSync(join(dir, f), 'utf8'));
  }
  await pool.query(`insert into auth.users(id,email,encrypted_password) values ($1,'pai@exemplo.com', crypt('senhaDoPai123', gen_salt('bf')))`, [guardianUser]);
  familyId = (await pool.query(`insert into family default values returning id`)).rows[0].id;
  await pool.query(`insert into guardian(family_id, auth_user_id, name, email, email_confirmed_at) values ($1,$2,'Pai','pai@exemplo.com', now())`, [familyId, guardianUser]);
  const year = new Date().getFullYear();
  childId = (await pool.query(
    `insert into child(family_id, nickname, birth_year, pin_hash) values ($1,'Ana',$2, crypt('1234', gen_salt('bf'))) returning id`,
    [familyId, year - 11],
  )).rows[0].id;
  app = createApp(
    {
      store: createPgStore(pool),
      tokenSecret: SECRET,
      generator: { generate: async () => 'Oi!' },
      classifier: {
        complete: async ({ system }) =>
          system.includes('classifica a mensagem')
            ? '{"decisao":"allow","categoria":"nenhuma"}'
            : '{"decisao":"allow","categoria":"nenhuma","motivo":"ok"}',
      },
    },
    { store: createPairingStore(pool), tokenSecret: SECRET, google: createGoogleAuth(GOOGLE_CFG, fakeGoogle) },
  );
});

afterAll(async () => {
  await pool.end();
  const c = new pg.Client({ connectionString: adminUrl });
  await c.connect();
  await c.query(`drop database if exists ${name} with (force)`);
  await c.end();
});

// O responsável chama as RPCs com o papel authenticated.
async function asGuardian<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query('set local role authenticated');
    await c.query(`select set_config('request.jwt.claim.sub', $1, true)`, [guardianUser]);
    const r = await fn(c);
    await c.query('commit');
    return r;
  } finally {
    c.release();
  }
}
const pair = () => asGuardian(async (c) => (await c.query(`select code from public.create_pairing_code($1)`, [childId])).rows[0].code as string);

describe('pareamento -> login -> chat', () => {
  it('o token emitido no login abre o /chat; desconectar derruba a renovação', async () => {
    const redeem = await post('/pairing/redeem', { code: await pair(), platform: 'android' });
    expect(redeem.status).toBe(200);
    const { deviceToken, deviceId } = await redeem.json();

    const login = await post('/child/login', { pin: '1234' }, deviceToken);
    expect(login.status).toBe(200);
    const { token, sessionToken, age } = await login.json();
    expect(age).toBe(11);

    const chat = await post('/chat', { message: 'oi' }, token);
    expect(chat.status).toBe(200);

    // desconectar (como o responsável faria pela RPC)
    await asGuardian((c) => c.query('select public.revoke_device($1)', [deviceId]));
    expect((await post('/child/token', {}, sessionToken)).status).toBe(401);
    expect((await post('/child/login', { pin: '1234' }, deviceToken)).status).toBe(401);
  });

  it('PIN errado → 401; 6 erros → 429 mesmo com o PIN certo', async () => {
    const { deviceToken } = await (await post('/pairing/redeem', { code: await pair(), platform: 'ios' })).json();
    await pool.query('delete from attempt_counter');
    for (let i = 0; i < 6; i++) expect((await post('/child/login', { pin: '9999' }, deviceToken)).status).toBe(401);
    expect((await post('/child/login', { pin: '1234' }, deviceToken)).status).toBe(429);
  });

  it('código usado de novo → 401', async () => {
    const code = await pair();
    expect((await post('/pairing/redeem', { code, platform: 'web' }, undefined, { 'x-forwarded-for': '9.9.9.9' })).status).toBe(200);
    expect((await post('/pairing/redeem', { code, platform: 'web' }, undefined, { 'x-forwarded-for': '9.9.9.9' })).status).toBe(401);
  });
});

describe('login com Google -> chat', () => {
  it('conta vinculada pelo responsável entra, o token abre o /chat; conta estranha não', async () => {
    await asGuardian((c) => c.query(`select public.set_child_google($1,'Ana@Gmail.com')`, [childId]));
    const { deviceToken } = await (await post('/pairing/redeem', { code: await pair(), platform: 'ios' }, undefined, { 'x-forwarded-for': '8.8.8.8' })).json();
    await pool.query('delete from attempt_counter');
    const body = (code: string) => ({ code, codeVerifier: 'v', redirectUri: 'tata://auth' });

    expect((await post('/child/login/google', body('intruso'), deviceToken)).status).toBe(401);
    const ok = await post('/child/login/google', body('ana'), deviceToken);
    expect(ok.status).toBe(200);
    const { token, age } = await ok.json();
    expect(age).toBe(11);
    expect((await post('/chat', { message: 'oi' }, token)).status).toBe(200);
  });
});
