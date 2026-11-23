import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TimelinePage } from '@tata/shared';
import { createGuardianStore, decodeCursor, encodeCursor, likePattern, type GuardianStore } from './guardian-store';

const adminUrl = process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/postgres';
const repo = join(import.meta.dirname, '..', '..', '..');
const name = `tata_guardian_${randomBytes(6).toString('hex')}`;
let pool: pg.Pool;
let store: GuardianStore;
let famA: string, famB: string, ana: string, beto: string, bia: string;
const XSS = '<img src=x onerror=alert(1)>';
const none = { filters: {}, limit: 30, cursor: null };

async function ask(child: string, minute: number, question: string, answer: string | null, ev: { decision: string; category: string; layer?: string }[] = [], title = 'Conversa') {
  const day = (m: number, sec = 0) => new Date(Date.UTC(2026, 10, 20, 15, m, sec)).toISOString();
  const conv = (await pool.query(`insert into conversation(child_id, title, started_at) values ($1,$2,$3) returning id`, [child, title, day(minute)])).rows[0].id;
  const q = (await pool.query(`insert into message(conversation_id, role, content, created_at) values ($1,'child',$2,$3) returning id`, [conv, question, day(minute)])).rows[0].id;
  let a: string | null = null;
  if (answer !== null) a = (await pool.query(`insert into message(conversation_id, role, content, created_at) values ($1,'tata',$2,$3) returning id`, [conv, answer, day(minute, 30)])).rows[0].id;
  const ids: string[] = [];
  for (const e of ev) {
    const target = e.layer === 'output' ? a : q;
    ids.push((await pool.query(`insert into safety_event(message_id, layer, category, decision) values ($1,$2,$3,$4) returning id`, [target, e.layer ?? 'input', e.category, e.decision])).rows[0].id);
  }
  return { q, a, ids };
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
  famA = (await pool.query(`insert into family default values returning id`)).rows[0].id;
  famB = (await pool.query(`insert into family default values returning id`)).rows[0].id;
  ana = (await pool.query(`insert into child(family_id, nickname, birth_year) values ($1,'Ana',2015) returning id`, [famA])).rows[0].id;
  bia = (await pool.query(`insert into child(family_id, nickname, birth_year) values ($1,'Bia',2012) returning id`, [famA])).rows[0].id;
  beto = (await pool.query(`insert into child(family_id, nickname, birth_year) values ($1,'Beto',2015) returning id`, [famB])).rows[0].id;
  await pool.query(`insert into child(family_id, nickname, birth_year, active) values ($1,'Inativa',2015,false)`, [famA]);
  store = createGuardianStore(pool);
});

afterAll(async () => {
  await pool.end();
  const c = new pg.Client({ connectionString: adminUrl });
  await c.connect();
  await c.query(`drop database if exists ${name} with (force)`);
  await c.end();
});

describe('listChildren', () => {
  it('só filhos ativos da família, por nome', async () => {
    expect((await store.listChildren(famA)).map((c) => c.nickname)).toEqual(['Ana', 'Bia']);
    expect((await store.listChildren(famB)).map((c) => c.nickname)).toEqual(['Beto']);
  });
});

describe('timeline', () => {
  it('filho de outra família ou inexistente → null; nunca vaza dados', async () => {
    await ask(beto, 1, 'segredo do Beto', 'ok');
    expect(await store.timeline(famA, beto, none)).toBeNull();
    expect(await store.timeline(famA, '00000000-0000-0000-0000-000000000000', none)).toBeNull();
    expect(await store.timeline(famA, 'nao-e-uuid', none)).toBeNull();
    expect((await store.timeline(famB, beto, none))!.items).toHaveLength(1);
    expect((await store.timeline(famA, bia, none))!.items).toHaveLength(0);
  });

  it('pareia pergunta e resposta; decisão mais grave e categoria vêm dos eventos', async () => {
    await ask(ana, 10, 'por que o céu é azul?', 'Por causa da luz.', [{ decision: 'allow', category: 'nenhuma' }, { decision: 'allow', category: 'nenhuma', layer: 'output' }]);
    await ask(ana, 11, 'como comprar droga?', 'Isso eu não posso ajudar.', [{ decision: 'block', category: 'drogas' }]);
    await ask(ana, 12, 'quero sumir', 'Fala com um adulto.', [{ decision: 'crisis', category: 'suicidio_autolesao' }]);
    await ask(ana, 13, 'pergunta sem resposta', null);
    const { items } = (await store.timeline(famA, ana, none))!;
    expect(items.map((i) => [i.question, i.decision, i.category])).toEqual([
      ['pergunta sem resposta', 'allow', 'nenhuma'],
      ['quero sumir', 'crisis', 'suicidio_autolesao'],
      ['como comprar droga?', 'block', 'drogas'],
      ['por que o céu é azul?', 'allow', 'nenhuma'],
    ]);
    expect(items[0]!.answer).toBeNull();
    expect(items[2]!.answer).toBe('Isso eu não posso ajudar.');
  });

  it('bloqueio na resposta da Tatá também destaca a pergunta', async () => {
    await ask(bia, 20, 'conta uma história', 'resposta ruim', [{ decision: 'allow', category: 'nenhuma' }, { decision: 'block', category: 'violencia_armas', layer: 'output' }]);
    const [i] = (await store.timeline(famA, bia, none))!.items;
    expect(i).toMatchObject({ decision: 'block', category: 'violencia_armas' });
  });

  it('a resposta de uma pergunta não é trocada pela de outra', async () => {
    const c = (await pool.query(`insert into conversation(child_id, title) values ($1,'x') returning id`, [bia])).rows[0].id;
    const ins = (role: string, content: string, min: number) =>
      pool.query(`insert into message(conversation_id, role, content, created_at) values ($1,$2,$3,$4)`, [c, role, content, new Date(Date.UTC(2026, 10, 21, 10, min)).toISOString()]);
    await ins('child', 'sem resposta', 0);
    await ins('child', 'com resposta', 1);
    await ins('tata', 'resposta da segunda', 2);
    const items = (await store.timeline(famA, bia, { ...none, filters: { q: 'resposta' } }))!.items;
    const byQ = Object.fromEntries(items.map((i) => [i.question, i.answer]));
    expect(byQ['sem resposta']).toBeNull();
    expect(byQ['com resposta']).toBe('resposta da segunda');
  });

  it('filtros: só bloqueadas, só alertas, data (fuso de São Paulo), busca', async () => {
    const blocked = (await store.timeline(famA, ana, { ...none, filters: { blocked: true } }))!.items;
    expect(blocked.map((i) => i.question)).toEqual(['quero sumir', 'como comprar droga?']);

    const crisis = (await pool.query(`select se.id from safety_event se join message m on m.id = se.message_id where m.content = 'quero sumir'`)).rows[0].id;
    await pool.query(`insert into alert(family_id, child_id, safety_event_id, severity) values ($1,$2,$3,'crisis')`, [famA, ana, crisis]);
    const alerts = (await store.timeline(famA, ana, { ...none, filters: { alerts: true } }))!.items;
    expect(alerts.map((i) => [i.question, i.alert])).toEqual([['quero sumir', 'new']]);

    // 20/11 15:xx UTC = 12:xx em São Paulo, no dia 20
    const day = async (from?: string, to?: string) => (await store.timeline(famA, ana, { ...none, filters: { from, to } }))!.items.length;
    expect(await day('2026-11-20', '2026-11-20')).toBe(4);
    expect(await day('2026-11-21')).toBe(0);
    expect(await day(undefined, '2026-11-19')).toBe(0);
    expect(await day('2026-11-19', '2026-11-21')).toBe(4);

    const found = async (q: string) => (await store.timeline(famA, ana, { ...none, filters: { q } }))!.items.map((i) => i.question);
    expect(await found('DROGA')).toEqual(['como comprar droga?']);
    expect(await found('luz')).toEqual(['por que o céu é azul?']); // vale para a resposta
  });

  it('busca trata % _ e \\ como texto', async () => {
    await ask(ana, 30, '100% certo?', 'sim');
    const f = async (q: string) => (await store.timeline(famA, ana, { ...none, filters: { q } }))!.items.length;
    expect(await f('%')).toBe(1);
    expect(await f('_')).toBe(0);
    expect(await f('\\')).toBe(0);
    expect(likePattern('a%b_c\\d')).toBe('%a\\%b\\_c\\\\d%');
  });

  it('data na virada do dia usa o fuso de São Paulo', async () => {
    // 22/11 02:30 UTC = 21/11 23:30 em São Paulo
    await pool.query(
      `with c as (insert into conversation(child_id, title) values ($1,'t') returning id)
       insert into message(conversation_id, role, content, created_at) select id, 'child', 'virada', '2026-11-22T02:30:00Z' from c`,
      [bia],
    );
    const on = async (d: string) => (await store.timeline(famA, bia, { ...none, filters: { from: d, to: d, q: 'virada' } }))!.items.length;
    expect(await on('2026-11-21')).toBe(1);
    expect(await on('2026-11-22')).toBe(0);
  });

  it('pagina sem repetir nem pular, mesmo com horários iguais', async () => {
    for (let i = 0; i < 5; i++) await ask(beto, 40, `igual ${i}`, 'ok'); // mesmo created_at
    const seen: string[] = [];
    let cursor: string | null = null as string | null;
    let pages = 0;
    do {
      const p: TimelinePage = (await store.timeline(famB, beto, { filters: { q: 'igual' }, limit: 2, cursor }))!;
      seen.push(...p.items.map((i) => i.id));
      cursor = p.nextCursor;
      pages++;
    } while (cursor && pages < 10);
    expect(pages).toBe(3);
    expect(new Set(seen).size).toBe(5);
  });

  it('cursor adulterado devolve vazio, sem erro', async () => {
    expect(await store.timeline(famA, ana, { ...none, cursor: 'lixo' })).toEqual({ items: [], nextCursor: null });
    expect(decodeCursor(encodeCursor('2026-11-20T15:10:00.000000Z', '11111111-1111-4111-8111-111111111111'))).not.toBeNull();
  });

  it('HTML da criança fica gravado e volta literal', async () => {
    await ask(bia, 50, XSS, XSS, [], XSS);
    const items = (await store.timeline(famA, bia, { ...none, filters: { q: 'onerror' } }))!.items;
    expect(items[0]).toMatchObject({ question: XSS, answer: XSS, conversationTitle: XSS });
  });
});
