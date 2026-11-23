import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import pg from 'pg';
import { createApp } from './app';
import { createOpenRouter } from './openrouter';
import { createPgStore } from './store';
import { createGoogleAuth, googleConfigFromEnv } from './google';
import { createPairingStore } from './pairing-store';
import { startRetentionJob } from './retention';

// Tudo sensível vem do ambiente: nenhuma chave fica em arquivo.
function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

const model = createOpenRouter({ apiKey: need('OPENROUTER_API_KEY'), model: process.env.TATA_MODEL });
const googleCfg = googleConfigFromEnv(process.env);
const pool = new pg.Pool({ connectionString: need('DATABASE_URL') });
const app = createApp(
  {
    store: createPgStore(pool),
    generator: model,
    classifier: model,
    tokenSecret: need('CHILD_TOKEN_SECRET'),
  },
  { store: createPairingStore(pool), tokenSecret: need('CHILD_TOKEN_SECRET'), google: googleCfg ? createGoogleAuth(googleCfg) : null },
);

startRetentionJob(pool);

const port = Number(process.env.PORT ?? 3000);
// O app web roda em outra origem (porta 8081); só as origens listadas podem chamar a API pelo navegador.
const webOrigins = (process.env.WEB_ORIGINS ?? 'http://localhost:8081').split(',').map((o) => o.trim()).filter(Boolean);
const root = new Hono();
root.use('*', cors({ origin: webOrigins }));
root.route('/', app);

serve({ fetch: root.fetch, port });
if (!googleCfg) console.log('Login com Google desligado: faltam GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_REDIRECT_URIS.');
console.log(`API ouvindo na porta ${port}`);
