import { serve } from '@hono/node-server';
import pg from 'pg';
import { createApp } from './app';
import { createAnthropic } from './anthropic';
import { createPgStore } from './store';
import { createPairingStore } from './pairing-store';
import { startRetentionJob } from './retention';
import { createSimulatedMailer, startOutboxJob } from './mailer';

// Tudo sensível vem do ambiente: nenhuma chave fica em arquivo.
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

const model = createAnthropic({ apiKey: need('ANTHROPIC_API_KEY'), model: process.env.TATA_MODEL });
const pool = new pg.Pool({ connectionString: need('DATABASE_URL') });
const app = createApp(
  {
    store: createPgStore(pool),
    generator: model,
    classifier: model,
    tokenSecret: need('CHILD_TOKEN_SECRET'),
  },
  { store: createPairingStore(pool), tokenSecret: need('CHILD_TOKEN_SECRET') },
);

startRetentionJob(pool);
// Envio de e-mail simulado: nada sai de verdade. O provedor real entra no lugar do Mailer depois.
startOutboxJob(pool, createSimulatedMailer({ echo: console.log, baseUrl: process.env.INVITE_BASE_URL }));

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port });
console.log(`API ouvindo na porta ${port}`);
