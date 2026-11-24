// M-06 (camada da API): uma família nunca acessa dados de outra pela API.
// Roda contra Postgres de verdade (store real + RLS e chaves do esquema), não contra a memória.
// Os testes do banco ficam em packages/db/test/isolation.test.ts. Plano de testes: ISO-01 a ISO-07 e ISO-09.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { signToken } from './auth';
import { createPgStore } from './store';

const adminUrl = process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/postgres';
const repo = join(import.meta.dirname, '..', '..', '..');
const name = `tata_iso_${randomBytes(6).toString('hex')}`;
const secret = 'segredo-de-teste-com-mais-de-32-caracteres';
const exp = Math.floor(Date.now() / 1000) + 600;
const year = new Date().getFullYear();

let pool: pg.Pool;
let app: ReturnType<typeof createApp>;
const fam = { A: '', B: '' };
const kid = { A: '', B: '' };
const conv = { A: '', B: '' };
const generated: string[] = [];

const tok = (role: 'child' | 'guardian', sub: string, f: string, e = exp, s = secret) => signToken({ role, sub, fam: f, exp: e }, s);
const req = async (path: string, token?: string, body?: unknown): Promise<Response> =>
  app.request(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const count = async (sql: string, p: unknown[] = []) => Number((await pool.query(sql, p)).rows[0].n);
const messages = (child: string) =>
  count(`select count(*) n from message m join conversation v on v.id = m.conversation_id where v.child_id = $1`, [child]);

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

  for (const k of ['A', 'B'] as const) {
    fam[k] = (await pool.query(`insert into family default values returning id`)).rows[0].id;
    kid[k] = (await pool.query(`insert into child(family_id, nickname, birth_year) values ($1,$2,$3) returning id`, [fam[k], `Filho ${k}`, year - 11])).rows[0].id;
    conv[k] = (await pool.query(`insert into conversation(child_id, title) values ($1,$2) returning id`, [kid[k], `Conversa ${k}`])).rows[0].id;
    await pool.query(`insert into message(conversation_id, role, content) values ($1,'child',$2), ($1,'tata',$3)`, [conv[k], `pergunta secreta ${k}`, `resposta secreta ${k}`]);
  }

  app = createApp({
    store: createPgStore(pool),
    tokenSecret: secret,
    generator: { generate: async (_s, turns) => (generated.push(turns.map((t) => t.content).join('|')), 'Resposta gerada.') },
    classifier: {
      model: 'c',
      async complete({ system }) {
        return system.includes('classifica a mensagem')
          ? '{"decisao":"responder","categoria":"nenhuma","intencao":"escolar","sinal_de_risco":"nenhum"}'
          : '{"decisao":"allow","categoria":"nenhuma","motivo":"ok"}';
      },
    },
  });
});

afterAll(async () => {
  await pool?.end();
  const c = new pg.Client({ connectionString: adminUrl });
  await c.connect();
  await c.query(`drop database if exists ${name} with (force)`);
  await c.end();
});

describe('criança A não alcança a conversa da família B (ISO-01, ISO-02, ISO-04)', () => {
  it('abrir a conversa de B dá 404 sem vazar conteúdo', async () => {
    const r = await req(`/conversations/${conv.B}`, tok('child', kid.A, fam.A));
    expect(r.status).toBe(404);
    expect(await r.text()).not.toContain('secreta B');
  });

  it('a lista traz só as conversas da própria criança', async () => {
    const r = await req('/conversations', tok('child', kid.A, fam.A));
    const body = JSON.stringify(await r.json());
    expect(body).toContain(conv.A);
    expect(body).not.toContain(conv.B);
  });

  it('continuar a conversa de B pelo /chat dá 404 e não grava nada em nenhuma das duas', async () => {
    const [a0, b0] = [await messages(kid.A), await messages(kid.B)];
    const r = await req('/chat', tok('child', kid.A, fam.A), { message: 'oi', conversationId: conv.B });
    expect(r.status).toBe(404);
    expect([await messages(kid.A), await messages(kid.B)]).toEqual([a0, b0]);
    expect(generated.join()).not.toContain('secreta');
  });

  it('o histórico de B nunca chega ao modelo quando A conversa na própria conversa', async () => {
    const r = await req('/chat', tok('child', kid.A, fam.A), { message: 'e agora?', conversationId: conv.A });
    expect(r.status).toBe(200);
    expect(generated.at(-1)).toContain('pergunta secreta A');
    expect(generated.at(-1)).not.toContain('secreta B');
  });

  it('ids malformados ou com SQL dão 404, sem erro de banco', async () => {
    for (const id of ['x', "' or '1'='1", `${conv.B}/../${conv.A}`, '00000000-0000-0000-0000-000000000000']) {
      const r = await req(`/conversations/${encodeURIComponent(id)}`, tok('child', kid.A, fam.A));
      expect(r.status).toBe(404);
    }
    const r = await req('/chat', tok('child', kid.A, fam.A), { message: 'oi', conversationId: "' or '1'='1" });
    expect(r.status).toBe(404);
  });
});

describe('ISO-07: identidade vem só do token', () => {
  it('childId, familyId e conversationId extras no corpo não mudam de quem é a mensagem', async () => {
    const before = await messages(kid.B);
    const r = await req('/chat', tok('child', kid.A, fam.A), { message: 'quem sou eu', childId: kid.B, familyId: fam.B, child_id: kid.B });
    expect(r.status).toBe(200);
    expect(await messages(kid.B)).toBe(before);
    const dono = (await pool.query(`select v.child_id from conversation v where v.id = $1`, [(await r.json()).conversationId])).rows[0].child_id;
    expect(dono).toBe(kid.A);
  });

  it('token com família trocada ou criança de outra família: 401, nada gravado', async () => {
    const before = [await messages(kid.A), await messages(kid.B)];
    for (const t of [tok('child', kid.A, fam.B), tok('child', kid.B, fam.A)]) {
      expect((await req('/chat', t, { message: 'oi' })).status).toBe(401);
      expect((await req('/conversations', t)).status).toBe(401);
      expect((await req(`/conversations/${conv.A}`, t)).status).toBe(401);
      expect((await req(`/conversations/${conv.B}`, t)).status).toBe(401);
    }
    expect([await messages(kid.A), await messages(kid.B)]).toEqual(before);
  });

  it('criança desativada perde o acesso na hora, mesmo com token ainda válido', async () => {
    const t = tok('child', kid.B, fam.B);
    expect((await req('/conversations', t)).status).toBe(200);
    await pool.query(`update child set active = false where id = $1`, [kid.B]);
    expect((await req('/conversations', t)).status).toBe(401);
    expect((await req(`/conversations/${conv.B}`, t)).status).toBe(401);
    await pool.query(`update child set active = true where id = $1`, [kid.B]);
  });
});

describe('ISO-05 e ISO-06: papel errado', () => {
  it('token de responsável não usa rotas da criança (e nada é gravado)', async () => {
    const before = await messages(kid.A);
    for (const sub of [kid.A, 'guardian-qualquer']) {
      const g = tok('guardian', sub, fam.A);
      expect((await req('/chat', g, { message: 'oi', conversationId: conv.A })).status).toBe(401);
      expect((await req('/conversations', g)).status).toBe(401);
      expect((await req(`/conversations/${conv.A}`, g)).status).toBe(401);
    }
    expect(await messages(kid.A)).toBe(before);
  });
});

describe('ISO-09: token inválido', () => {
  const rotas = (t?: string): Promise<number>[] => [
    req('/chat', t, { message: 'oi' }).then((r) => r.status),
    req('/conversations', t).then((r) => r.status),
    req(`/conversations/${conv.A}`, t).then((r) => r.status),
  ];

  it('o token bom funciona (controle do teste)', async () => {
    expect(await Promise.all(rotas(tok('child', kid.A, fam.A)))).toEqual([200, 200, 200]);
  });

  it('expirado, segredo errado, assinatura adulterada, payload adulterado e lixo: sempre 401', async () => {
    const t = tok('child', kid.A, fam.A);
    const [body, mac] = t.split('.');
    const outroPayload = Buffer.from(JSON.stringify({ role: 'child', sub: kid.B, fam: fam.B, exp })).toString('base64url');
    const ruins = [
      tok('child', kid.A, fam.A, Math.floor(Date.now() / 1000) - 1),
      tok('child', kid.A, fam.A, exp, 'outro-segredo-qualquer-com-32-caracteres'),
      `${body}.${mac!.slice(0, -2)}AA`,
      `${outroPayload}.${mac}`,
      `${body}.`,
      `.${mac}`,
      `${t}.extra`,
      'lixo',
      Buffer.from('{"alg":"none"}').toString('base64url') + '.',
    ];
    for (const r of ruins) expect(await Promise.all(rotas(r))).toEqual([401, 401, 401]);
    expect(await Promise.all(rotas(undefined))).toEqual([401, 401, 401]);
  });

  it('cabeçalho que não é Bearer não autentica', async () => {
    const t = tok('child', kid.A, fam.A);
    for (const h of [t, `Basic ${t}`, `bearer ${t}`]) {
      const r = await app.request('/conversations', { headers: { authorization: h } });
      expect(r.status).toBe(401);
    }
  });
});
