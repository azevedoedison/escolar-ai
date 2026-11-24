import { serve } from '@hono/node-server';
import pg from 'pg';
import { createApp } from './app';
import { createAnthropic } from './anthropic';
import { createPgStore } from './store';
import { createGoogleAuth, googleConfigFromEnv } from './google';
import { createPairingStore } from './pairing-store';
import { createPrivacyStore } from './privacy-store';
import { startRetentionJob } from './retention';

// Tudo sensível vem do ambiente: nenhuma chave fica em arquivo.
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

const model = createAnthropic({ apiKey: need('ANTHROPIC_API_KEY'), model: process.env.TATA_MODEL });
const googleCfg = googleConfigFromEnv(process.env);
const pool = new pg.Pool({ connectionString: need('DATABASE_URL') });
const authStore = createPairingStore(pool);
const app = createApp(
  {
    store: createPgStore(pool),
    generator: model,
    classifier: model,
    tokenSecret: need('CHILD_TOKEN_SECRET'),
  },
  { store: authStore, tokenSecret: need('CHILD_TOKEN_SECRET'), google: googleCfg ? createGoogleAuth(googleCfg) : null },
  { store: createPrivacyStore(pool), auth: authStore },
);

startRetentionJob(pool);

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port });
if (!googleCfg) console.log('Login com Google desligado: faltam GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_REDIRECT_URIS.');
console.log(`API ouvindo na porta ${port}`);
