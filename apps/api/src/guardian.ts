// Rotas do painel dos pais (M-30, M-31). Só o responsável autenticado (login direto ou modo Responsável) abre estas rotas, e a família
// vem sempre da sessão: um childId de outra família responde 404, igual a um que não existe.

import { Hono, type Context } from 'hono';
import { parseTimelineQuery } from '@tata/shared';
import type { AuthStore } from './pairing-store';
import { isUuid, type GuardianStore } from './guardian-store';

export interface GuardianDeps {
  store: GuardianStore;
  auth: Pick<AuthStore, 'verifyGuardian'>;
}

export function createGuardianRoutes({ store, auth }: GuardianDeps) {
  const app = new Hono();

  // Dados de crianças: nunca em cache e nunca reinterpretados como outro tipo de conteúdo.
  app.use('/guardian/*', async (c, next) => {
    await next();
    c.header('cache-control', 'no-store');
    c.header('x-content-type-options', 'nosniff');
  });

  async function guardian(c: Context) {
    const h = c.req.header('authorization') ?? '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    return token ? auth.verifyGuardian(token) : null;
  }

  app.get('/guardian/children', async (c) => {
    const g = await guardian(c);
    if (!g) return c.json({ error: 'nao_autorizado' }, 401);
    return c.json({ children: await store.listChildren(g.familyId) });
  });

  app.get('/guardian/children/:childId/timeline', async (c) => {
    const g = await guardian(c);
    if (!g) return c.json({ error: 'nao_autorizado' }, 401);
    const childId = c.req.param('childId');
    if (!isUuid(childId)) return c.json({ error: 'filho_nao_encontrado' }, 404);
    const query = parseTimelineQuery((k) => c.req.query(k));
    if (!query) return c.json({ error: 'filtro_invalido' }, 400);
    const page = await store.timeline(g.familyId, childId, query);
    if (!page) return c.json({ error: 'filho_nao_encontrado' }, 404);
    return c.json(page);
  });

  return app;
}
