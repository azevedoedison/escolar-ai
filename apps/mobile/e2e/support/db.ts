// Apoio dos casos de uso: banco Postgres local de teste (criado por e2e/setup-db.mjs), com a mesma regra de pareamento e PIN do app.
import { createHash, randomInt } from 'node:crypto';
import pg from 'pg';

export const E2E_DB_NAME = process.env.E2E_DB_NAME ?? 'tata_e2e';
export const ADMIN_URL = process.env.E2E_ADMIN_DATABASE_URL ?? 'postgres://postgres@localhost:5432/postgres';
export const E2E_PIN = '1234';

export function e2eDatabaseUrl(): string {
  const url = new URL(ADMIN_URL);
  url.pathname = `/${E2E_DB_NAME}`;
  return url.toString();
}

let pool: pg.Pool | null = null;
export const db = () => (pool ??= new pg.Pool({ connectionString: process.env.DATABASE_URL ?? e2eDatabaseUrl(), max: 2 }));
export const closeDb = async () => {
  await pool?.end();
  pool = null;
};

/** Família de teste com uma criança de 11 anos e PIN fixo. Dados sintéticos, nunca de criança real. */
export async function seedChild(nickname: string): Promise<string> {
  const { rows: fam } = await db().query('insert into family default values returning id');
  const { rows } = await db().query(
    `insert into child(family_id, nickname, birth_year, pin_hash)
     values ($1, $2, extract(year from now())::int - 11, crypt($3, gen_salt('bf'))) returning id`,
    [fam[0].id, nickname, E2E_PIN],
  );
  return rows[0].id as string;
}

/** Código de pareamento de 6 números, válido por 10 minutos e de uso único (o banco guarda só o hash). */
export async function newPairingCode(childId: string): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await db().query(
    `insert into pairing_code(child_id, code_hash, expires_at) values ($1, $2, now() + interval '10 minutes')`,
    [childId, createHash('sha256').update(code).digest('hex')],
  );
  return code;
}

/** Decisões de segurança registradas para as mensagens da criança (camada, categoria, decisão). */
export async function safetyDecisions(childId: string): Promise<{ layer: string; category: string; decision: string }[]> {
  const { rows } = await db().query(
    `select se.layer, se.category, se.decision
       from safety_event se
       join message m on m.id = se.message_id
       join conversation c on c.id = m.conversation_id
      where c.child_id = $1 order by m.created_at, se.layer`,
    [childId],
  );
  return rows;
}

export async function messageCount(childId: string): Promise<number> {
  const { rows } = await db().query(
    `select count(*)::int as n from message m join conversation c on c.id = m.conversation_id where c.child_id = $1`,
    [childId],
  );
  return rows[0].n as number;
}
