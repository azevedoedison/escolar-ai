import { Hono, type Context } from 'hono';
import { isPairingCode, parseChildLogin, PLATFORMS, type Platform } from '@tata/shared';
import { signToken } from './auth';
import { createChatRoutes, type ChatDeps } from './chat';
import { createPrivacyRoutes, type PrivacyDeps } from './privacy';
import type { GoogleAuth } from './google';
import type { AuthStore, Status } from './pairing-store';

/** Pareamento e login. `tokenSecret` é o mesmo do chat (CHILD_TOKEN_SECRET). */
export interface AuthDeps {
  store: AuthStore;
  tokenSecret: string;
  /** Login com Google. Ausente: o botão fica desligado e a rota responde 404. */
  google?: GoogleAuth | null;
  now?: () => number;
}

/** Token de criança usado no /chat: curto de propósito, a sessão opaca é renovável e revogável. */
export const CHILD_TOKEN_TTL_S = 15 * 60;

const MESSAGES = {
  invalid: 'Dados incorretos. Confira e tente de novo.',
  locked: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  unauthorized: 'Sessão inválida. Entre de novo.',
  revoked: 'Este aparelho foi desconectado. Peça um novo código ao responsável.',
  bad_request: 'Pedido inválido.',
} as const;

function fail(c: Context, status: Exclude<Status, 'ok'> | 'bad_request') {
  const http = status === 'bad_request' ? 400 : status === 'locked' ? 429 : 401;
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

export function createAuthRoutes({ store, tokenSecret, google = null, now = Date.now }: AuthDeps) {
  const app = new Hono();

  /** Emite o token assinado do chat a partir de uma sessão opaca ainda válida. */
  async function chatToken(sessionToken: string) {
    const s = await store.verifyChildSession(sessionToken);
    if (!s) return null;
    const exp = Math.floor(now() / 1000) + CHILD_TOKEN_TTL_S;
    return { token: signToken({ role: 'child', sub: s.childId, fam: s.familyId, exp }, tokenSecret), age: s.age, exp };
  }

  // M-04: o aparelho troca o código de 6 dígitos pelo token do aparelho.
  app.post('/pairing/redeem', async (c) => {
    const b = (await json(c)) as { code?: unknown; platform?: unknown; label?: unknown } | null;
    if (!b || !isPairingCode(b.code) || !PLATFORMS.includes(b.platform as Platform)) return fail(c, 'bad_request');
    const label = typeof b.label === 'string' ? b.label.slice(0, 60) : null;
    const r = await store.redeemPairingCode(b.code, b.platform as string, origin(c), label);
    if (r.status !== 'ok') return fail(c, r.status);
    return c.json({ deviceToken: r.deviceToken, deviceId: r.deviceId, childId: r.childId });
  });

  async function sessionResponse(c: Context, r: { status: Status; sessionToken?: string; expiresAt?: string }) {
    if (r.status !== 'ok' || !r.sessionToken) return fail(c, r.status === 'ok' ? 'unauthorized' : r.status);
    const t = await chatToken(r.sessionToken);
    if (!t) return fail(c, 'unauthorized');
    return c.json({ sessionToken: r.sessionToken, sessionExpiresAt: r.expiresAt, token: t.token, tokenExp: t.exp, age: t.age });
  }

  // M-04: login da criança no aparelho pareado (Bearer = token do aparelho).
  app.post('/child/login', async (c) => {
    const deviceToken = bearer(c);
    const body = parseChildLogin(await json(c));
    if (!deviceToken || !body) return fail(c, 'bad_request');
    const r =
      'pin' in body
        ? await store.childLogin(deviceToken, null, body.pin)
        : await store.childLogin(deviceToken, body.email, body.password);
    return sessionResponse(c, r);
  });

  // Login com Google: o app diz se o botão aparece. Sem credenciais no ambiente, fica desligado.
  app.get('/child/google/config', (c) => c.json(google ? { enabled: true, clientId: google.clientId } : { enabled: false }));

  // Login com Google (Bearer = token do aparelho): troca o código OAuth pela identidade e abre a sessão.
  app.post('/child/login/google', async (c) => {
    if (!google) return c.json({ error: 'disabled', message: 'Entrar com Google não está disponível.' }, 404);
    const deviceToken = bearer(c);
    const b = (await json(c)) as { code?: unknown; codeVerifier?: unknown; redirectUri?: unknown } | null;
    if (!deviceToken || !b || typeof b.code !== 'string' || typeof b.codeVerifier !== 'string' || typeof b.redirectUri !== 'string' || !b.code || !b.codeVerifier) {
      return fail(c, 'bad_request');
    }
    const id = await google.exchange(b.code, b.codeVerifier, b.redirectUri);
    // Falha na troca com o Google não conta no bloqueio: a criança não errou nada, só o código expirou.
    if (!id) return fail(c, 'invalid');
    return sessionResponse(c, await store.childLoginGoogle(deviceToken, id.sub, id.email));
  });

  // Renova o token do chat. Aparelho revogado ou sessão vencida: 401.
  app.post('/child/token', async (c) => {
    const sessionToken = bearer(c);
    const t = sessionToken ? await chatToken(sessionToken) : null;
    if (!t) return fail(c, 'unauthorized');
    return c.json({ token: t.token, tokenExp: t.exp, age: t.age });
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

  // Login direto do responsável: conta própria, qualquer aparelho. Falha igual para e-mail desconhecido e senha errada.
  app.post('/guardian/login', async (c) => {
    const b = (await json(c)) as { email?: unknown; password?: unknown } | null;
    if (!b || typeof b.email !== 'string' || typeof b.password !== 'string') return fail(c, 'bad_request');
    const r = await store.guardianLogin(b.email, b.password);
    if (r.status !== 'ok' || !r.token) return fail(c, r.status === 'ok' ? 'unauthorized' : r.status);
    return c.json({ token: r.token, expiresAt: r.expiresAt });
  });

  app.post('/guardian/logout', async (c) => {
    const token = bearer(c);
    if (token) await store.guardianLogout(token);
    return c.body(null, 204);
  });

  app.post('/guardian-mode/exit', async (c) => {
    const token = bearer(c);
    if (token) await store.guardianModeExit(token);
    return c.body(null, 204);
  });

  return app;
}

export function createApp(chat?: ChatDeps, auth?: AuthDeps, privacy?: PrivacyDeps) {
  const app = new Hono();
  app.get('/health', (c) => c.json({ status: 'ok' }));
  if (chat) app.route('/', createChatRoutes(chat));
  if (auth) app.route('/', createAuthRoutes(auth));
  if (privacy) app.route('/', createPrivacyRoutes(privacy));
  return app;
}

export const app = createApp();
