import { serve } from '@hono/node-server';
import pg from 'pg';
import { createApp } from './app';
import { createPgStore } from './store';

const port = Number(process.env.PORT ?? 3000);
const url = process.env.DATABASE_URL;
const app = createApp(url ? createPgStore(new pg.Pool({ connectionString: url })) : undefined);
if (!url) console.warn('DATABASE_URL ausente: rotas de pareamento e login desligadas.');
serve({ fetch: app.fetch, port });
console.log(`API ouvindo na porta ${port}`);
