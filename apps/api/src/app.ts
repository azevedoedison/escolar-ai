import { Hono, type Context } from 'hono';
import { isPairingCode, parseChildLogin, PLATFORMS, type Platform } from '@tata/shared';
import type { AuthStore, Status } from './store';

const MESSAGES = {
  invalid: 'Dados incorretos. Confira e tente de novo.',
  locked: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  unauthorized: 'Sessão inválida. Entre de novo.',
  revoked: 'Este aparelho foi desconectado. Peça um novo código ao responsável.',
  bad_request: 'Pedido inválido.',
} as const;

function fail(c: Context, status: Exclude<Status, 'ok'> | 'bad_request') {
  const http = status === 'bad_request' ? 400 : status === 'locked' ? 429 : status === 'invalid' ? 401 : 401;
  return c.json({ error: status, message: MESSAGES[status] }, http);
}

const bearer = (c: Context): string | null => {
  const h = c.req.header('authorization') ?? '';
  return h.startsWith('Bearer ') && h.length > 7 ? h.slice(7) : null;
};

/** Origem usada para limitar tentativas de código. Atrás de proxy confiável, x-forwarded-for traz o IP real. */
const origin = (c: Context) => c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

async function json(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

export function createApp(store?: AuthStore) {
  const app = new Hono();
  app.get('/health', (c) => c.json({ status: 'ok' }));

  if (!store) return app;

  // M-04: o aparelho troca o código de 6 dígitos pelo token do aparelho.
  app.post('/pairing/redeem', async (c) => {
    const b = (await json(c)) as { code?: unknown; platform?: unknown; label?: unknown } | null;
    if (!b || !isPairingCode(b.code) || !PLATFORMS.includes(b.platform as Platform)) return fail(c, 'bad_request');
    const label = typeof b.label === 'string' ? b.label.slice(0, 60) : null;
    const r = await store.redeemPairingCode(b.code, b.platform as string, origin(c), label);
    if (r.status !== 'ok') return fail(c, r.status === 'invalid' ? 'invalid' : r.status);
    return c.json({ deviceToken: r.deviceToken, deviceId: r.deviceId, childId: r.childId });
  });

  // M-04: login da criança no aparelho pareado (Bearer = token do aparelho).
  app.post('/child/login', async (c) => {
    const token = bearer(c);
    const body = parseChildLogin(await json(c));
    if (!token || !body) return fail(c, 'bad_request');
    const r =
      'pin' in body
        ? await store.childLogin(token, null, body.pin)
        : await store.childLogin(token, body.email, body.password);
    if (r.status !== 'ok') return fail(c, r.status);
    return c.json({ sessionToken: r.sessionToken, expiresAt: r.expiresAt });
  });

  app.get('/child/me', async (c) => {
    const token = bearer(c);
    const s = token ? await store.verifyChildSession(token) : null;
    if (!s) return fail(c, 'unauthorized');
    return c.json({ childId: s.childId });
  });

  app.post('/child/logout', async (c) => {
    const token = bearer(c);
    if (token) await store.childLogout(token);
    return c.body(null, 204);
  });

  // M-05: trocar para o modo Responsável exige e-mail e senha do responsável.
  app.post('/guardian-mode/enter', async (c) => {
    const token = bearer(c);
    const b = (await json(c)) as { email?: unknown; password?: unknown } | null;
    if (!token) return fail(c, 'unauthorized');
    if (!b || typeof b.email !== 'string' || typeof b.password !== 'string') return fail(c, 'bad_request');
    const r = await store.guardianModeEnter(token, b.email, b.password);
    if (r.status !== 'ok') return fail(c, r.status);
    return c.json({ modeToken: r.modeToken, expiresAt: r.expiresAt });
  });

  app.post('/guardian-mode/exit', async (c) => {
    const token = bearer(c);
    if (token) await store.guardianModeExit(token);
    return c.body(null, 204);
  });

  return app;
}

export const app = createApp();
