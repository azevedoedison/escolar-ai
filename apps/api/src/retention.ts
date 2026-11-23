// Limpeza automática de conversas vencidas (B-02). A regra mora no banco
// (public.purge_expired_all), que aplica a retenção de cada família separadamente.

import type pg from 'pg';

export const RETENTION_INTERVAL_MS = 60 * 60 * 1000;

type Queryable = Pick<pg.Pool, 'query'>;

/** Roda a limpeza uma vez. Devolve quantas conversas foram apagadas. */
export async function runRetention(db: Queryable): Promise<number> {
  const { rows } = await db.query('select public.purge_expired_all() as n');
  return Number(rows[0]?.n ?? 0);
}

/** Agenda a limpeza. Erro numa rodada é registrado e não derruba a API. Devolve a função que para o agendamento. */
export function startRetentionJob(
  db: Queryable,
  intervalMs = RETENTION_INTERVAL_MS,
  log: (msg: string) => void = console.error,
): () => void {
  const tick = () => {
    runRetention(db).catch((e) => log(`Falha na limpeza por retenção: ${e instanceof Error ? e.message : String(e)}`));
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
