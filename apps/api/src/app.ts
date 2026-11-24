import { Hono, type Context } from 'hono';
import { isPairingCode, parseChildLogin, PLATFORMS, type Platform } from '@tata/shared';
import { signToken } from './auth';
import { createChatRoutes, type ChatDeps } from './chat';
import type { GoogleAuth } from './google';
import { buildEmail, createConsoleMailer, type EmailKind, type Mailer } from './mailer';
import type { AuthStore, Status } from './pairing-store';

/** Pareamento e login. `tokenSecret` é o mesmo do chat (CHILD_TOKEN_SECRET). */
export interface AuthDeps {
  store: AuthStore;
  tokenSecret: string;
  /** Login com Google. Ausente: o botão fica desligado e a rota responde 404. */
  google?: GoogleAuth | null;
  /** Envio de e-mail (confirmação e recuperação de senha). Ausente: versão simulada, que imprime o link no console. */
  mailer?: Mailer;
  /** Endereço onde o link do e-mail abre (APP_BASE_URL). */
  appBaseUrl?: string;
  now?: () => number;
}

/** Token de criança usado no /chat: curto de propósito, a sessão opaca é renovável e revogável. */
export const CHILD_TOKEN_TTL_S = 15 * 60;

const MESSAGES = {
  invalid: 'Dados incorretos. Confira e tente de novo.',
  locked: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  unauthorized: 'Sessão inválida. Entre de novo.',
  unconfirmed: 'Confirme seu e-mail para entrar. Veja a mensagem que enviamos para você.',
  revoked: 'Este aparelho foi desconectado. Peça um novo código ao responsável.',
  bad_request: 'Pedido inválido.',
} as const;

function fail(c: Context, status: Exclude<Status, 'ok'> | 'bad_request') {
  const http = status === 'bad_request' ? 400 : status === 'locked' ? 429 : status === 'unconfirmed' ? 403 : 401;
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

const LINK_MESSAGES = {
  invalid: 'Este link não vale mais. Peça um novo.',
  locked: MESSAGES.locked,
  weak: 'A senha precisa ter ao menos 8 caracteres.',
} as const;

/** Resposta única dos pedidos de link: igual exista a conta ou não, para não revelar quais e-mails têm conta. */
const REQUESTED = { message: 'Se o e-mail tiver uma conta, enviamos as instruções para ele.' };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL = 254;

export function createAuthRoutes({ store, tokenSecret, google = null, mailer = createConsoleMailer(), appBaseUrl = 'http://localhost:8081', now = Date.now }: AuthDeps) {
  const app = new Hono();

  /** Envia o link. Falha de envio vai para o log (sem o link) e não muda a resposta ao cliente. */
  async function deliver(kind: EmailKind, email: string, issued: { token: string; name: string } | null) {
    if (!issued) return;
    try {
      await mailer.send({ to: email.trim(), ...buildEmail(kind, appBaseUrl, issued.token, issued.name) });
    } catch (e) {
      console.error(`Falha ao enviar e-mail de ${kind}:`, e instanceof Error ? e.message : 'erro desconhecido');
    }
  }

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

  // Confirmação de cadastro: o link do e-mail traz o token. Link usado, vencido ou inventado dá a mesma resposta.
  app.post('/guardian/email/confirm', async (c) => {
    const b = (await json(c)) as { token?: unknown } | null;
    if (!b || typeof b.token !== 'string' || b.token.length === 0 || b.token.length > 200) return fail(c, 'bad_request');
    const r = await store.confirmEmail(b.token, origin(c));
    if (r !== 'ok') return c.json({ error: r, message: LINK_MESSAGES[r] }, r === 'locked' ? 429 : 400);
    return c.json({ confirmed: true });
  });

  app.post('/guardian/email/resend', async (c) => {
    const b = (await json(c)) as { email?: unknown } | null;
    if (!b || typeof b.email !== 'string' || b.email.length > MAX_EMAIL || !EMAIL.test(b.email.trim())) return fail(c, 'bad_request');
    // O envio não é esperado: o tempo da resposta não deve revelar se a conta existe.
    void deliver('confirm', b.email, await store.requestEmailConfirmation(b.email, origin(c)));
    return c.json(REQUESTED, 202);
  });

  // "Esqueci a senha": resposta sempre igual, com ou sem conta, com ou sem limite estourado.
  app.post('/guardian/password/forgot', async (c) => {
    const b = (await json(c)) as { email?: unknown } | null;
    if (!b || typeof b.email !== 'string' || b.email.length > MAX_EMAIL || !EMAIL.test(b.email.trim())) return fail(c, 'bad_request');
    void deliver('reset', b.email, await store.requestPasswordReset(b.email, origin(c)));
    return c.json(REQUESTED, 202);
  });

  app.post('/guardian/password/reset', async (c) => {
    const b = (await json(c)) as { token?: unknown; password?: unknown } | null;
    if (!b || typeof b.token !== 'string' || typeof b.password !== 'string' || b.token.length === 0 || b.token.length > 200 || b.password.length > 200) {
      return fail(c, 'bad_request');
    }
    const r = await store.resetPassword(b.token, b.password, origin(c));
    if (r !== 'ok') return c.json({ error: r, message: LINK_MESSAGES[r] }, r === 'locked' ? 429 : 400);
    return c.json({ reset: true });
  });

  app.post('/guardian-mode/exit', async (c) => {
    const token = bearer(c);
    if (token) await store.guardianModeExit(token);
    return c.body(null, 204);
  });

  return app;
}

export function createApp(chat?: ChatDeps, auth?: AuthDeps) {
  const app = new Hono();
  app.get('/health', (c) => c.json({ status: 'ok' }));
  if (chat) app.route('/', createChatRoutes(chat));
  if (auth) app.route('/', createAuthRoutes(auth));
  return app;
}

export const app = createApp();
