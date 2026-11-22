import { serve } from '@hono/node-server';
import pg from 'pg';
import { createApp } from './app';
import { createAnthropic } from './anthropic';
import { createPgStore } from './store';

// Tudo sensível vem do ambiente: nenhuma chave fica em arquivo.
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

const model = createAnthropic({ apiKey: need('ANTHROPIC_API_KEY'), model: process.env.TATA_MODEL });
const pool = new pg.Pool({ connectionString: need('DATABASE_URL') });
const app = createApp({
  store: createPgStore(pool),
  generator: model,
  classifier: model,
  tokenSecret: need('CHILD_TOKEN_SECRET'),
});

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port });
console.log(`API ouvindo na porta ${port}`);
