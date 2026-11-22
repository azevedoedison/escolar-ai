import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createSimulatedMailer, drainOutbox, inviteLink, startOutboxJob, type Mailer } from './mailer';

const adminUrl = process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/postgres';
const repo = join(import.meta.dirname, '..', '..', '..');
const name = `tata_mail_${randomBytes(6).toString('hex')}`;
let pool: pg.Pool;

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
});

afterAll(async () => {
  await pool.end();
  const c = new pg.Client({ connectionString: adminUrl });
  await c.connect();
  await c.query(`drop database if exists ${name} with (force)`);
  await c.end();
});

const enqueue = (to: string, token = 'tok123') =>
  pool.query(`insert into email_outbox(kind, to_email, payload) values ('guardian_invite', $1, $2) returning id`, [to, { token, invite_id: 'x' }]);

describe('fila de e-mail simulada', () => {
  it('entrega pendentes, marca como enviado e tira o token do banco', async () => {
    const { rows } = await enqueue('c@exemplo.com');
    const lines: string[] = [];
    const mailer = createSimulatedMailer({ echo: (l) => lines.push(l) });
    expect(await drainOutbox(pool, mailer)).toBe(1);
    expect(mailer.sent[0]).toMatchObject({ kind: 'guardian_invite', to: 'c@exemplo.com' });
    expect(mailer.sent[0]!.payload.token).toBe('tok123');
    expect(lines[0]).toContain(inviteLink('tok123'));
    const row = (await pool.query(`select sent_at, payload from email_outbox where id = $1`, [rows[0].id])).rows[0];
    expect(row.sent_at).not.toBeNull();
    expect(row.payload.token).toBeUndefined();
    // já enviado: não envia de novo
    expect(await drainOutbox(pool, mailer)).toBe(0);
  });

  it('falha devolve o e-mail à fila com o token e não barra os outros', async () => {
    const bad = (await enqueue('falha@exemplo.com', 'tokbad')).rows[0].id;
    await enqueue('ok@exemplo.com', 'tokok');
    const mailer: Mailer = {
      send: async (m) => {
        if (m.to === 'falha@exemplo.com') throw new Error('provedor fora');
      },
    };
    const log = vi.fn();
    expect(await drainOutbox(pool, mailer, 20, log)).toBe(1);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('provedor fora'));
    const row = (await pool.query(`select sent_at, payload from email_outbox where id = $1`, [bad])).rows[0];
    expect(row.sent_at).toBeNull();
    expect(row.payload.token).toBe('tokbad');
    // próxima rodada, provedor volta
    expect(await drainOutbox(pool, createSimulatedMailer())).toBe(1);
  });

  it('o agendamento roda ao iniciar e para quando pedido', async () => {
    const db = { query: vi.fn(async () => ({ rows: [] })) } as never;
    vi.useFakeTimers();
    const stop = startOutboxJob(db, createSimulatedMailer(), 1000);
    expect((db as { query: ReturnType<typeof vi.fn> }).query).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect((db as { query: ReturnType<typeof vi.fn> }).query).toHaveBeenCalledTimes(3);
    stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect((db as { query: ReturnType<typeof vi.fn> }).query).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });
});
