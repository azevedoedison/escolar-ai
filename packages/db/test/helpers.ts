import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import pg from 'pg';

const root = join(import.meta.dirname, '..', '..', '..');
const adminUrl = process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/postgres';

export interface TestDb {
  admin: pg.Client;
  name: string;
  /** Roda `fn` como usuário autenticado (papel authenticated) numa transação revertida. */
  asUser<T>(userId: string, fn: (c: pg.Client) => Promise<T>): Promise<T>;
  asAnon<T>(fn: (c: pg.Client) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export async function createTestDb(): Promise<TestDb> {
  const name = `tata_test_${randomBytes(6).toString('hex')}`;
  const root_ = new pg.Client({ connectionString: adminUrl });
  await root_.connect();
  await root_.query(`create database ${name}`);
  await root_.end();

  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  const admin = new pg.Client({ connectionString: url.toString() });
  await admin.connect();

  await admin.query(readFileSync(join(import.meta.dirname, 'supabase-stub.sql'), 'utf8'));
  const dir = join(root, 'supabase', 'migrations');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    await admin.query(readFileSync(join(dir, f), 'utf8'));
  }

  async function run<T>(role: string, userId: string | null, fn: (c: pg.Client) => Promise<T>) {
    await admin.query('begin');
    try {
      await admin.query(`set local role ${role}`);
      await admin.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId ?? '']);
      return await fn(admin);
    } finally {
      await admin.query('rollback');
    }
  }

  return {
    admin,
    name,
    asUser: (id, fn) => run('authenticated', id, fn),
    asAnon: (fn) => run('anon', null, fn),
    async close() {
      await admin.end();
      const c = new pg.Client({ connectionString: adminUrl });
      await c.connect();
      await c.query(`drop database if exists ${name} with (force)`);
      await c.end();
    },
  };
}
