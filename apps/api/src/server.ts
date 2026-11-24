import { serve } from '@hono/node-server';
import pg from 'pg';
import { createApp } from './app';
import { createAnthropic } from './anthropic';
import { createPgStore } from './store';
import { createGoogleAuth, googleConfigFromEnv } from './google';
import { createPairingStore } from './pairing-store';
import { startRetentionJob } from './retention';
import { loadConfig, type Config } from './config';
import { jsonLogger } from './http';

// Tudo sensível vem do ambiente e é validado antes de qualquer conexão: nenhuma chave fica em arquivo.
let config: Config;
try {
  config = loadConfig(process.env);
} catch (e) {
  console.error(e instanceof Error ? e.message : 'Configuração inválida.');
  process.exit(1);
}

const model = createAnthropic({ apiKey: config.anthropicApiKey, model: config.model });
const googleCfg = googleConfigFromEnv(process.env);
const pool = new pg.Pool({ connectionString: config.databaseUrl });
const app = createApp(
  {
    store: createPgStore(pool),
    generator: model,
    classifier: model,
    tokenSecret: config.tokenSecret,
  },
  { store: createPairingStore(pool), tokenSecret: config.tokenSecret, google: googleCfg ? createGoogleAuth(googleCfg) : null },
  { corsOrigins: config.corsOrigins, hsts: config.production, log: jsonLogger },
);

startRetentionJob(pool);

const port = config.port;
serve({ fetch: app.fetch, port });
if (!googleCfg) console.log('Login com Google desligado: faltam GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_REDIRECT_URIS.');
console.log(`API ouvindo na porta ${port}`);
