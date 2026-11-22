import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPgStore, type ChatStore } from './store';

const adminUrl = process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/postgres';
const repo = join(import.meta.dirname, '..', '..', '..');
const name = `tata_api_${randomBytes(6).toString('hex')}`;
let pool: pg.Pool;
let store: ChatStore;
let famA: string, famB: string, childA: string, childB: string;

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
  famA = (await pool.query(`insert into family default values returning id`)).rows[0].id;
  famB = (await pool.query(`insert into family default values returning id`)).rows[0].id;
  await pool.query(`insert into family_settings(family_id, homework_mode) values ($1, false)`, [famB]);
  const year = new Date().getFullYear();
  childA = (await pool.query(`insert into child(family_id, nickname, birth_year, grade) values ($1,'Ana',$2,'6º ano') returning id`, [famA, year - 11])).rows[0].id;
  childB = (await pool.query(`insert into child(family_id, nickname, birth_year) values ($1,'Beto',$2) returning id`, [famB, year - 9])).rows[0].id;
  store = createPgStore(pool);
});

afterAll(async () => {
  await pool.end();
  const c = new pg.Client({ connectionString: adminUrl });
  await c.connect();
  await c.query(`drop database if exists ${name} with (force)`);
  await c.end();
});

describe('createPgStore', () => {
  it('lê idade, série e Lição de Casa (padrão ligado)', async () => {
    expect(await store.getChild(childA)).toMatchObject({ familyId: famA, age: 11, grade: '6º ano', homeworkMode: true });
    expect(await store.getChild(childB)).toMatchObject({ age: 9, homeworkMode: false });
  });
  it('criança inativa ou inexistente é null', async () => {
    await pool.query(`update child set active = false where id = $1`, [childB]);
    expect(await store.getChild(childB)).toBeNull();
    await pool.query(`update child set active = true where id = $1`, [childB]);
    expect(await store.getChild('00000000-0000-0000-0000-000000000000')).toBeNull();
  });
  it('grava e lê conversa na ordem, isolada por criança', async () => {
    const conv = await store.createConversation(childA, 'Fotossíntese');
    const m1 = await store.addMessage(conv, 'child', 'o que é?');
    await store.addMessage(conv, 'tata', 'É assim.');
    await store.addSafetyEvent({ messageId: m1, layer: 'input', category: 'nenhuma', decision: 'allow', latencyMs: 5 });
    expect((await store.history(conv, 10)).map((m) => m.role)).toEqual(['child', 'tata']);
    expect(await store.ownsConversation(childA, conv)).toBe(true);
    expect(await store.ownsConversation(childB, conv)).toBe(false);
    expect((await store.listConversations(childB))).toEqual([]);
    expect((await store.listConversations(childA)).map((c) => c.title)).toEqual(['Fotossíntese']);
    const ev = await pool.query(`select layer, decision from safety_event where message_id = $1`, [m1]);
    expect(ev.rows).toEqual([{ layer: 'input', decision: 'allow' }]);
  });
  it('limite de uso no banco: por minuto, por dia e isolado por criança', async () => {
    const t0 = Date.UTC(2026, 10, 22, 12, 0, 0);
    const lim = { perMinute: 2, perDay: 3 };
    expect(await store.usageLimited(childB, lim, t0)).toBe(false);
    expect(await store.usageLimited(childB, lim, t0 + 1000)).toBe(false);
    expect(await store.usageLimited(childB, lim, t0 + 2000)).toBe(true);
    expect(await store.usageLimited(childA, lim, t0 + 2000)).toBe(false);
    expect(await store.usageLimited(childB, lim, t0 + 61_000)).toBe(false);
    expect(await store.usageLimited(childB, lim, t0 + 122_000)).toBe(true);
    expect(await store.usageLimited(childB, lim, t0 + 86_400_000 + 1000)).toBe(false);
  });
  it('limite de uso sobrevive a nova instância da API (novo store, mesmo banco)', async () => {
    const t0 = Date.UTC(2026, 10, 23, 12, 0, 0);
    const lim = { perMinute: 1, perDay: 10 };
    expect(await store.usageLimited(childA, lim, t0)).toBe(false);
    expect(await createPgStore(pool).usageLimited(childA, lim, t0 + 1000)).toBe(true);
  });
  it('grava intenção, risco, modelo e a decisão "care"', async () => {
    const conv = await store.createConversation(childA, 'Puberdade');
    const m = await store.addMessage(conv, 'child', 'o que é puberdade?');
    await store.addSafetyEvent({
      messageId: m, layer: 'input', category: 'sexualidade', decision: 'care',
      intent: 'curiosidade', risk: 'baixo', model: 'haiku', latencyMs: 80,
    });
    const ev = await pool.query(`select category, intent, risk, decision, model, latency_ms from safety_event where message_id = $1`, [m]);
    expect(ev.rows).toEqual([
      { category: 'sexualidade', intent: 'curiosidade', risk: 'baixo', decision: 'care', model: 'haiku', latency_ms: 80 },
    ]);
  });
  it('history respeita o limite pegando as mais recentes', async () => {
    const conv = await store.createConversation(childA, 'Limite');
    for (let i = 1; i <= 5; i++) await store.addMessage(conv, 'child', `m${i}`);
    expect((await store.history(conv, 2)).map((m) => m.content)).toEqual(['m4', 'm5']);
  });
});
