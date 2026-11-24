// Cria o banco de teste (tata_e2e) com o stub do Supabase e todas as migrações. Roda antes do Playwright.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const admin = process.env.E2E_ADMIN_DATABASE_URL ?? 'postgres://postgres@localhost:5432/postgres';
const name = process.env.E2E_DB_NAME ?? 'tata_e2e';
const repo = join(import.meta.dirname, '..', '..', '..');

const root = new pg.Client({ connectionString: admin });
await root.connect();
await root.query(`drop database if exists ${name} with (force)`);
await root.query(`create database ${name}`);
await root.end();

const url = new URL(admin);
url.pathname = `/${name}`;
const client = new pg.Client({ connectionString: url.toString() });
await client.connect();
await client.query(readFileSync(join(repo, 'packages/db/test/supabase-stub.sql'), 'utf8'));
const dir = join(repo, 'supabase', 'migrations');
for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
  await client.query(readFileSync(join(dir, f), 'utf8'));
}
await client.end();
console.log(`Banco ${name} pronto.`);
