import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import { verifyToken } from './auth';
import { createGoogleAuth, googleConfigFromEnv, identityFromIdToken, type GoogleAuth } from './google';
import type { AuthStore } from './pairing-store';

const CID = 'cid.apps.googleusercontent.com';
const NOW = 1_800_000_000_000;
const jwt = (c: object) => `h.${Buffer.from(JSON.stringify(c)).toString('base64url')}.s`;
const good = { iss: 'https://accounts.google.com', aud: CID, exp: NOW / 1000 + 60, sub: '123', email: 'a@gmail.com', email_verified: true };

describe('googleConfigFromEnv', () => {
  it('liga só com id, segredo e redirecionamentos', () => {
    expect(googleConfigFromEnv({})).toBeNull();
    expect(googleConfigFromEnv({ GOOGLE_CLIENT_ID: 'a', GOOGLE_CLIENT_SECRET: 'b' })).toBeNull();
    expect(googleConfigFromEnv({ GOOGLE_CLIENT_ID: 'a', GOOGLE_CLIENT_SECRET: ' ', GOOGLE_REDIRECT_URIS: 'x' })).toBeNull();
    expect(googleConfigFromEnv({ GOOGLE_CLIENT_ID: 'a', GOOGLE_CLIENT_SECRET: 'b', GOOGLE_REDIRECT_URIS: 'x://a, https://b/c ' })).toEqual({
      clientId: 'a',
      clientSecret: 'b',
      redirectUris: ['x://a', 'https://b/c'],
    });
  });
});

describe('identityFromIdToken', () => {
  it('aceita o token válido', () => {
    expect(identityFromIdToken(jwt(good), CID, NOW)).toEqual({ sub: '123', email: 'a@gmail.com' });
    expect(identityFromIdToken(jwt({ ...good, iss: 'accounts.google.com', email_verified: 'true' }), CID, NOW)).not.toBeNull();
  });
  it.each([
    ['audiência de outro app', { ...good, aud: 'outro' }],
    ['emissor falso', { ...good, iss: 'https://evil.example' }],
    ['expirado', { ...good, exp: NOW / 1000 - 1 }],
    ['e-mail não verificado', { ...good, email_verified: false }],
    ['sem sub', { ...good, sub: undefined }],
    ['sem e-mail', { ...good, email: undefined }],
  ])('recusa %s', (_n, claims) => {
    expect(identityFromIdToken(jwt(claims), CID, NOW)).toBeNull();
  });
  it('recusa lixo', () => {
    for (const v of [undefined, 42, '', 'abc', 'a.!!!.c']) expect(identityFromIdToken(v, CID, NOW)).toBeNull();
  });
});

describe('createGoogleAuth', () => {
  const cfg = { clientId: CID, clientSecret: 'segredo', redirectUris: ['tata://auth'] };
  it('troca o código no endpoint do Google com PKCE e segredo', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ id_token: jwt(good) })));
    const g = createGoogleAuth(cfg, f as unknown as typeof fetch, () => NOW);
    expect(await g.exchange('cod', 'ver', 'tata://auth')).toEqual({ sub: '123', email: 'a@gmail.com' });
    const [url, init] = f.mock.calls[0] as unknown as [string, { body: URLSearchParams }];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    expect(Object.fromEntries(init.body)).toMatchObject({
      grant_type: 'authorization_code', code: 'cod', code_verifier: 'ver', redirect_uri: 'tata://auth', client_id: CID, client_secret: 'segredo',
    });
  });
  it('recusa redirecionamento fora da lista sem chamar o Google', async () => {
    const f = vi.fn();
    expect(await createGoogleAuth(cfg, f as unknown as typeof fetch).exchange('c', 'v', 'https://evil.example')).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
  it('erro do Google ou da rede vira null', async () => {
    expect(await createGoogleAuth(cfg, (async () => new Response('{}', { status: 400 })) as unknown as typeof fetch).exchange('c', 'v', 'tata://auth')).toBeNull();
    expect(await createGoogleAuth(cfg, (async () => { throw new Error('rede'); }) as unknown as typeof fetch).exchange('c', 'v', 'tata://auth')).toBeNull();
  });
});

describe('rotas do login com Google', () => {
  const SECRET = 'segredo-de-teste';
  const store = (): AuthStore => ({
    redeemPairingCode: vi.fn(),
    childLogin: vi.fn(),
    childLoginGoogle: vi.fn(async () => ({ status: 'ok' as const, sessionToken: 'st', expiresAt: '2026-01-01T00:00:00.000Z' })),
    verifyChildSession: vi.fn(async () => ({ sessionId: 's', childId: 'c1', familyId: 'f1', deviceId: 'd1', age: 11 })),
    childLogout: vi.fn(),
    guardianModeEnter: vi.fn(),
    verifyGuardianMode: vi.fn(),
    guardianModeExit: vi.fn(),
  } as unknown as AuthStore);
  const google = (id: { sub: string; email: string } | null): GoogleAuth => ({ clientId: CID, exchange: vi.fn(async () => id) });
  const post = (app: ReturnType<typeof createApp>, body: unknown, token?: string) =>
    app.request('/child/login/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  const body = { code: 'c', codeVerifier: 'v', redirectUri: 'tata://auth' };

  it('sem credenciais: botão desligado e rota 404', async () => {
    const app = createApp(undefined, { store: store(), tokenSecret: SECRET });
    expect(await (await app.request('/child/google/config')).json()).toEqual({ enabled: false });
    expect((await post(app, body, 'dt')).status).toBe(404);
  });

  it('com credenciais: config traz o clientId e o login devolve a sessão e o token do chat', async () => {
    const s = store();
    const app = createApp(undefined, { store: s, tokenSecret: SECRET, google: google({ sub: '123', email: 'a@gmail.com' }) });
    expect(await (await app.request('/child/google/config')).json()).toEqual({ enabled: true, clientId: CID });
    const res = await post(app, body, 'dt');
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j).toMatchObject({ sessionToken: 'st', age: 11 });
    expect(verifyToken(j.token, SECRET)).toMatchObject({ role: 'child', sub: 'c1', fam: 'f1' });
    expect(s.childLoginGoogle).toHaveBeenCalledWith('dt', '123', 'a@gmail.com');
  });

  it('falha no Google → 401 sem tocar no contador; bloqueio → 429; corpo ruim → 400', async () => {
    const s = store();
    expect((await post(createApp(undefined, { store: s, tokenSecret: SECRET, google: google(null) }), body, 'dt')).status).toBe(401);
    expect(s.childLoginGoogle).not.toHaveBeenCalled();
    const locked = store();
    (locked.childLoginGoogle as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'locked' });
    expect((await post(createApp(undefined, { store: locked, tokenSecret: SECRET, google: google({ sub: '1', email: 'a@b.co' }) }), body, 'dt')).status).toBe(429);
    const app = createApp(undefined, { store: store(), tokenSecret: SECRET, google: google({ sub: '1', email: 'a@b.co' }) });
    expect((await post(app, { code: 'c' }, 'dt')).status).toBe(400);
    expect((await post(app, body)).status).toBe(400);
  });
});
