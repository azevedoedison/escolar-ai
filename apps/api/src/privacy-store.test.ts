import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { createPairingStore } from './pairing-store';
import { createPrivacyStore } from './privacy-store';

// Ponta a ponta: login real do responsável (SQL) -> rotas de privacidade -> banco. Duas famílias, para provar o isolamento.
const adminUrl = process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/postgres';
const repo = join(import.meta.dirname, '..', '..', '..');
const name = `tata_priv_${randomBytes(6).toString('hex')}`;
const year = new Date().getFullYear();
let pool: pg.Pool;
let app: ReturnType<typeof createApp>;
const fam = { A: '', B: '' };
const child = { A: '', B: '' };
const guardian = { A: '', B: '' };
const token = { A: '', B: '' };
const users = { A: '00000000-0000-0000-0000-0000000000b1', B: '00000000-0000-0000-0000-0000000000b2' };
const q = (s: string, p?: unknown[]) => pool.query(s, p);
const count = async (table: string, where = 'true') => Number((await q(`select count(*) from ${table} where ${where}`)).rows[0].count);

const req = (k: 'A' | 'B', method: string, path: string, body?: unknown) =>
  app.request(`/guardian/privacy${path}`, {
    method,
    headers: { authorization: `Bearer ${token[k]}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

async function seed(k: 'A' | 'B', daysAgo = 1) {
  const ts = `now() - interval '${daysAgo} days'`;
  const conv = (await q(`insert into conversation(child_id, title, started_at) values ($1,'t',${ts}) returning id`, [child[k]])).rows[0].id;
  await q(`insert into message(conversation_id, role, content, created_at) values ($1,'child','oi ${k}',${ts})`, [conv]);
  return conv as string;
}

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

  const authStore = createPairingStore(pool);
  app = createApp(undefined, undefined, { store: createPrivacyStore(pool), auth: authStore });
  for (const k of ['A', 'B'] as const) {
    const email = `pai-${k}@exemplo.com`;
    await q(`insert into auth.users(id,email,encrypted_password) values ($1,$2, crypt('senhaDoPai123', gen_salt('bf')))`, [users[k], email]);
    fam[k] = (await q(`insert into family default values returning id`)).rows[0].id;
    await q(`insert into family_settings(family_id) values ($1) on conflict do nothing`, [fam[k]]);
    guardian[k] = (await q(`insert into guardian(family_id, auth_user_id, name, email, consent_at, consent_version) values ($1,$2,'Pai',$3, now(), 'v1') returning id`, [fam[k], users[k], email])).rows[0].id;
    child[k] = (await q(`insert into child(family_id, nickname, birth_year, pin_hash) values ($1,'Ana ${k}',$2, crypt('1234', gen_salt('bf'))) returning id`, [fam[k], year - 11])).rows[0].id;
    const r = await authStore.guardianLogin(email, 'senhaDoPai123');
    expect(r.status).toBe('ok');
    token[k] = r.token!;
  }
});

afterAll(async () => {
  await pool.end();
  const c = new pg.Client({ connectionString: adminUrl });
  await c.connect();
  await c.query(`drop database if exists ${name} with (force)`);
  await c.end();
});

describe('retenção pela API', () => {
  it('nasce em 90, muda, persiste e audita com o login do responsável', async () => {
    expect((await (await req('A', 'GET', '/retention')).json()).days).toBe(90);
    expect((await req('A', 'PUT', '/retention', { days: 45 })).status).toBe(200);
    expect((await (await req('A', 'GET', '/retention')).json()).days).toBe(45);
    expect((await q(`select retention_days from family_settings where family_id = $1`, [fam.A])).rows[0].retention_days).toBe(45);
    expect(await count('audit_log', `family_id = '${fam.A}' and action = 'retention_changed' and target = '45' and actor = '${users.A}'`)).toBe(1);
  });

  it('a retenção de uma família não muda a da outra', async () => {
    expect((await q(`select retention_days from family_settings where family_id = $1`, [fam.B])).rows[0].retention_days).toBe(90);
  });

  it('a limpeza automática usa a retenção escolhida: A (45 dias) apaga a de 60 dias, B (90) mantém', async () => {
    const a = await seed('A', 60);
    const b = await seed('B', 60);
    await q('select public.purge_expired_all()');
    expect(await count('conversation', `id = '${a}'`)).toBe(0);
    expect(await count('conversation', `id = '${b}'`)).toBe(1);
    await q(`delete from conversation where child_id = $1`, [child.B]);
  });

  it('valor inválido não chega ao banco', async () => {
    expect((await req('A', 'PUT', '/retention', { days: 10 })).status).toBe(400);
    expect((await (await req('A', 'GET', '/retention')).json()).days).toBe(45);
  });
});

describe('exportar pela API', () => {
  it('traz só a própria família e registra data_exported', async () => {
    await seed('A');
    await seed('B');
    const res = await req('A', 'GET', '/export');
    expect(res.status).toBe(200);
    const out = await res.json();
    expect(out.children.map((c: { nickname: string }) => c.nickname)).toEqual(['Ana A']);
    expect(out.conversations).toHaveLength(1);
    expect(out.conversations[0].messages[0].content).toBe('oi A');
    const text = JSON.stringify(out);
    for (const secret of ['pin_hash', 'Ana B', 'oi B', fam.B, child.B, 'senhaDoPai123']) expect(text).not.toContain(secret);
    expect(await count('audit_log', `family_id = '${fam.A}' and action = 'data_exported' and actor = '${users.A}'`)).toBe(1);
    await q(`delete from conversation`);
  });
});

describe('apagar pela API', () => {
  it('apaga uma conversa e audita; a de outra família responde 404 e fica', async () => {
    const mine = await seed('A');
    const theirs = await seed('B');
    expect((await req('A', 'DELETE', `/conversations/${mine}`)).status).toBe(204);
    expect(await count('conversation', `id = '${mine}'`)).toBe(0);
    expect(await count('audit_log', `family_id = '${fam.A}' and action = 'conversation_deleted' and target = '${mine}'`)).toBe(1);
    expect((await req('A', 'DELETE', `/conversations/${theirs}`)).status).toBe(404);
    expect(await count('conversation', `id = '${theirs}'`)).toBe(1);
  });

  it('apaga as conversas de um filho; filho de outra família responde 404', async () => {
    await seed('A');
    await seed('A');
    const res = await req('A', 'DELETE', `/children/${child.A}/conversations`);
    expect(await res.json()).toEqual({ deleted: 2 });
    expect(await count('conversation', `child_id = '${child.A}'`)).toBe(0);
    expect(await count('conversation', `child_id = '${child.B}'`)).toBe(1);
    expect((await req('A', 'DELETE', `/children/${child.B}/conversations`)).status).toBe(404);
  });

  it('excluir filho de outra família responde 404 e não apaga nada', async () => {
    expect((await req('A', 'DELETE', `/children/${child.B}`, { confirm: true })).status).toBe(404);
    expect(await count('child', `id = '${child.B}'`)).toBe(1);
    expect(await count('conversation', `child_id = '${child.B}'`)).toBe(1);
  });

  it('excluir filho sem confirmação não apaga; com confirmação apaga só ele, e a família fica', async () => {
    const extra = (await q(`insert into child(family_id, nickname, birth_year, pin_hash) values ($1,'Beto',$2, crypt('1234', gen_salt('bf'))) returning id`, [fam.A, year - 9])).rows[0].id;
    expect((await req('A', 'DELETE', `/children/${extra}`)).status).toBe(400);
    expect(await count('child', `id = '${extra}'`)).toBe(1);
    expect((await req('A', 'DELETE', `/children/${extra}`, { confirm: true })).status).toBe(204);
    expect(await count('child', `id = '${extra}'`)).toBe(0);
    expect(await count('child', `id = '${child.A}'`)).toBe(1);
    expect(await count('family', `id = '${fam.A}'`)).toBe(1);
    expect(await count('audit_log', `family_id = '${fam.A}' and action = 'child_deleted' and target = '${extra}'`)).toBe(1);
  });
});

describe('sem acesso', () => {
  it('sem sessão do responsável nada funciona e nada é apagado', async () => {
    const before = await count('child');
    for (const [m, p] of [['GET', '/export'], ['GET', '/retention'], ['DELETE', `/children/${child.B}`]] as const) {
      const res = await app.request(`/guardian/privacy${p}`, { method: m, headers: { authorization: 'Bearer invalido' }, body: m === 'DELETE' ? '{"confirm":true}' : undefined });
      expect(res.status).toBe(401);
    }
    expect(await count('child')).toBe(before);
  });

  it('as funções api_* não são executáveis pelo papel authenticated (nem pelo painel via RPC)', async () => {
    const c = await pool.connect();
    try {
      await c.query('begin');
      await c.query('set local role authenticated');
      await expect(c.query(`select public.api_export_family($1)`, [guardian.B])).rejects.toThrow(/permission denied/);
    } finally {
      await c.query('rollback');
      c.release();
    }
  });
});
