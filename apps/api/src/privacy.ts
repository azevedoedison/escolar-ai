// Rotas de privacidade do painel (B-02): retenção, exportação e exclusão de dados dos filhos.
// Só o responsável autenticado (login direto ou modo Responsável) abre estas rotas. A família vem sempre da sessão:
// um id de outra família responde 404, igual a um que não existe.
//
// Fora daqui, de propósito: excluir a conta do responsável. A regra "com filhos é recusado" já está no banco, mas o caso
// sem filhos também apaga o login do segundo responsável, e isso espera decisão do Edison (PR 27).

import { Hono, type Context } from 'hono';
import { isUuid, parseRetentionDays, RETENTION_MAX_DAYS, RETENTION_MIN_DAYS } from '@tata/shared';
import type { AuthStore } from './pairing-store';
import type { PrivacyStore } from './privacy-store';

export interface PrivacyDeps {
  store: PrivacyStore;
  auth: Pick<AuthStore, 'verifyGuardian'>;
  now?: () => Date;
}

export function createPrivacyRoutes({ store, auth, now = () => new Date() }: PrivacyDeps) {
  const app = new Hono();

  // Dados de crianças: nunca em cache e nunca reinterpretados como outro tipo de conteúdo.
  app.use('/guardian/privacy/*', async (c, next) => {
    await next();
    c.header('cache-control', 'no-store');
    c.header('x-content-type-options', 'nosniff');
  });

  async function guardian(c: Context) {
    const h = c.req.header('authorization') ?? '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    return token ? auth.verifyGuardian(token) : null;
  }
  const unauthorized = (c: Context) => c.json({ error: 'nao_autorizado' }, 401);
  const notFound = (c: Context) => c.json({ error: 'nao_encontrado' }, 404);
  async function body(c: Context): Promise<Record<string, unknown> | null> {
    try {
      const b = await c.req.json();
      return b && typeof b === 'object' && !Array.isArray(b) ? (b as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  app.get('/guardian/privacy/retention', async (c) => {
    const g = await guardian(c);
    if (!g) return unauthorized(c);
    return c.json({ days: await store.getRetention(g.guardianId), min: RETENTION_MIN_DAYS, max: RETENTION_MAX_DAYS });
  });

  app.put('/guardian/privacy/retention', async (c) => {
    const g = await guardian(c);
    if (!g) return unauthorized(c);
    const days = parseRetentionDays((await body(c))?.days);
    if (days === null) return c.json({ error: 'retencao_invalida', min: RETENTION_MIN_DAYS, max: RETENTION_MAX_DAYS }, 400);
    await store.setRetention(g.guardianId, days);
    return c.json({ days });
  });

  // O arquivo sai como download e a exportação fica na auditoria.
  app.get('/guardian/privacy/export', async (c) => {
    const g = await guardian(c);
    if (!g) return unauthorized(c);
    const data = await store.exportFamily(g.guardianId);
    c.header('content-disposition', `attachment; filename="tata-ia-dados-${now().toISOString().slice(0, 10)}.json"`);
    return c.json(data as object);
  });

  app.delete('/guardian/privacy/conversations/:id', async (c) => {
    const g = await guardian(c);
    if (!g) return unauthorized(c);
    const id = c.req.param('id');
    if (!isUuid(id) || (await store.deleteConversation(g.guardianId, id)) !== 'ok') return notFound(c);
    return c.body(null, 204);
  });

  app.delete('/guardian/privacy/children/:childId/conversations', async (c) => {
    const g = await guardian(c);
    if (!g) return unauthorized(c);
    const childId = c.req.param('childId');
    const n = isUuid(childId) ? await store.deleteChildConversations(g.guardianId, childId) : null;
    return n === null ? notFound(c) : c.json({ deleted: n });
  });

  // Exclui o filho e só os dados dele. A confirmação precisa vir explícita no corpo.
  app.delete('/guardian/privacy/children/:childId', async (c) => {
    const g = await guardian(c);
    if (!g) return unauthorized(c);
    const childId = c.req.param('childId');
    if (!isUuid(childId)) return notFound(c);
    if ((await body(c))?.confirm !== true) return c.json({ error: 'confirmacao_necessaria' }, 400);
    return (await store.deleteChild(g.guardianId, childId)) === 'ok' ? c.body(null, 204) : notFound(c);
  });

  return app;
}
