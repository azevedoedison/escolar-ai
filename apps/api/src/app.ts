import { Hono } from 'hono';
import { createChatRoutes, type ChatDeps } from './chat';

export function createApp(deps?: ChatDeps) {
  const app = new Hono();
  app.get('/health', (c) => c.json({ status: 'ok' }));
  if (deps) app.route('/', createChatRoutes(deps));
  return app;
}

export const app = createApp();
