// Retenção de conversas (B-02). Os mesmos limites valem no banco (check family_settings_retention_days_range).

export const RETENTION_MIN_DAYS = 30;
export const RETENTION_MAX_DAYS = 365;
export const RETENTION_DEFAULT_DAYS = 90;
/** Opções oferecidas no painel. O banco aceita qualquer inteiro da faixa. */
export const RETENTION_CHOICES = [30, 60, 90, 180, 365] as const;

/** Número inteiro de 30 a 365, ou null. Texto, decimal e fora da faixa não passam. */
export function parseRetentionDays(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= RETENTION_MIN_DAYS && v <= RETENTION_MAX_DAYS ? v : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
