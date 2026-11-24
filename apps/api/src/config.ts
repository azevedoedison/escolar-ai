// Configuração da API (change seguranca-da-aplicacao). Nada aqui tem valor padrão para segredo:
// faltou variável ou ela é fraca, o processo encerra antes de abrir a porta.

import { z } from 'zod';

const secret = (name: string, min = 1) =>
  z
    .string({ error: `${name} é obrigatória` })
    .min(min, min > 1 ? `${name} precisa ter ao menos ${min} caracteres` : `${name} é obrigatória`);

/** Lista separada por vírgulas. Vazio ou ausente: nenhuma origem de navegador é aceita. */
const origins = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .pipe(
    z.array(
      z.string().refine((o) => {
        try {
          const u = new URL(o);
          return (u.protocol === 'https:' || u.protocol === 'http:') && u.origin === o;
        } catch {
          return false;
        }
      }, 'origem inválida: use esquema e host sem barra final, como https://app.exemplo.com'),
    ),
  );

const schema = z.object({
  ANTHROPIC_API_KEY: secret('ANTHROPIC_API_KEY'),
  DATABASE_URL: secret('DATABASE_URL'),
  CHILD_TOKEN_SECRET: secret('CHILD_TOKEN_SECRET', 32),
  CORS_ORIGINS: origins,
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  TATA_MODEL: z.string().optional(),
});

export interface Config {
  anthropicApiKey: string;
  databaseUrl: string;
  tokenSecret: string;
  corsOrigins: string[];
  production: boolean;
  port: number;
  model?: string;
}

export class ConfigError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Configuração inválida:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'ConfigError';
  }
}

/** Lê e valida o ambiente. Os erros citam só o nome da variável, nunca o valor. */
export function loadConfig(env: Record<string, string | undefined>): Config {
  const r = schema.safeParse(env);
  if (!r.success) {
    throw new ConfigError(r.error.issues.map((i) => `${i.path.join('.') || 'ambiente'}: ${i.message}`));
  }
  const v = r.data;
  return {
    anthropicApiKey: v.ANTHROPIC_API_KEY,
    databaseUrl: v.DATABASE_URL,
    tokenSecret: v.CHILD_TOKEN_SECRET,
    corsOrigins: v.CORS_ORIGINS,
    production: v.NODE_ENV === 'production',
    port: v.PORT,
    model: v.TATA_MODEL || undefined,
  };
}
