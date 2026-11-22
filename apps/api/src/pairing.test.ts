import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import { verifyToken } from './auth';
import type { AuthStore } from './pairing-store';

const SECRET = 'segredo-de-teste';
const mk = (store: AuthStore, now?: () => number) => createApp(undefined, { store, tokenSecret: SECRET, now });

function fakeStore(over: Partial<AuthStore> = {}): AuthStore {
  return {
    redeemPairingCode: vi.fn(async () => ({ status: 'ok' as const, deviceId: 'd1', childId: 'c1', deviceToken: 'dt' })),
    childLogin: vi.fn(async () => ({ status: 'ok' as const, sessionToken: 'st', expiresAt: '2026-01-01T00:00:00.000Z' })),
    verifyChildSession: vi.fn(async (t) => (t === 'st' ? { sessionId: 's', childId: 'c1', familyId: 'f1', deviceId: 'd1', age: 11 } : null)),
    childLogout: vi.fn(async () => {}),
    guardianModeEnter: vi.fn(async () => ({ status: 'ok' as const, modeToken: 'mt', expiresAt: '2026-01-01T00:15:00.000Z' })),
    verifyGuardianMode: vi.fn(async () => null),
    guardianModeExit: vi.fn(async () => {}),
    ...over,
  };
}
const post = (app: ReturnType<typeof mk>, path: string, body: unknown, headers: Record<string, string> = {}) =>
  app.request(path, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } });

describe('POST /pairing/redeem', () => {
  it('devolve o token do aparelho', async () => {
    const store = fakeStore();
    const res = await post(mk(store), '/pairing/redeem', { code: '123456', platform: 'ios' }, { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deviceToken: 'dt', deviceId: 'd1', childId: 'c1' });
    expect(store.redeemPairingCode).toHaveBeenCalledWith('123456', 'ios', '1.2.3.4', null);
  });
  it('recusa corpo inválido sem chamar o banco', async () => {
    const store = fakeStore();
    for (const b of [{ code: '12', platform: 'ios' }, { code: '123456', platform: 'tv' }, {}]) {
      expect((await post(mk(store), '/pairing/redeem', b)).status).toBe(400);
    }
    expect(store.redeemPairingCode).not.toHaveBeenCalled();
  });
  it('código inválido → 401 e bloqueio → 429', async () => {
    const a = mk(fakeStore({ redeemPairingCode: async () => ({ status: 'invalid' }) }));
    expect((await post(a, '/pairing/redeem', { code: '123456', platform: 'web' })).status).toBe(401);
    const b = mk(fakeStore({ redeemPairingCode: async () => ({ status: 'locked' }) }));
    expect((await post(b, '/pairing/redeem', { code: '123456', platform: 'web' })).status).toBe(429);
  });
});

describe('POST /child/login', () => {
  it('PIN e e-mail+senha chegam ao banco do jeito certo', async () => {
    const store = fakeStore();
    const app = mk(store);
    const h = { authorization: 'Bearer dt' };
    const ok = await post(app, '/child/login', { pin: '1234' }, h);
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body).toMatchObject({ sessionToken: 'st', age: 11 });
    // o token emitido é o do chat: role child, criança e família da sessão, vida curta
    const claims = verifyToken(body.token, SECRET);
    expect(claims).toMatchObject({ role: 'child', sub: 'c1', fam: 'f1' });
    expect(claims!.exp * 1000 - Date.now()).toBeLessThanOrEqual(15 * 60 * 1000);
    expect(store.childLogin).toHaveBeenCalledWith('dt', null, '1234');
    expect((await post(app, '/child/login', { email: 'a@b.com', password: 'x' }, h)).status).toBe(200);
    expect(store.childLogin).toHaveBeenLastCalledWith('dt', 'a@b.com', 'x');
  });
  it('sem token do aparelho ou com corpo ruim → 400', async () => {
    const app = mk(fakeStore());
    expect((await post(app, '/child/login', { pin: '1234' })).status).toBe(400);
    expect((await post(app, '/child/login', { pin: 'ab' }, { authorization: 'Bearer dt' })).status).toBe(400);
  });
  it('aparelho revogado → 401, bloqueio → 429', async () => {
    const h = { authorization: 'Bearer dt' };
    const r = mk(fakeStore({ childLogin: async () => ({ status: 'revoked' }) }));
    const res = await post(r, '/child/login', { pin: '1234' }, h);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('revoked');
    const l = mk(fakeStore({ childLogin: async () => ({ status: 'locked' }) }));
    expect((await post(l, '/child/login', { pin: '1234' }, h)).status).toBe(429);
  });
});

describe('POST /child/token', () => {
  it('renova o token do chat com a sessão; sessão revogada ou vencida → 401', async () => {
    const app = mk(fakeStore());
    const ok = await post(app, '/child/token', {}, { authorization: 'Bearer st' });
    expect(ok.status).toBe(200);
    expect(verifyToken((await ok.json()).token, SECRET)).toMatchObject({ role: 'child', sub: 'c1', fam: 'f1' });
    expect((await post(app, '/child/token', {}, { authorization: 'Bearer ruim' })).status).toBe(401);
    expect((await post(app, '/child/token', {})).status).toBe(401);
  });
  it('token expira depois de 15 minutos', async () => {
    const t0 = Date.now();
    const app = mk(fakeStore(), () => t0);
    const { token } = await (await post(app, '/child/token', {}, { authorization: 'Bearer st' })).json();
    expect(verifyToken(token, SECRET, t0 + 14 * 60_000)).not.toBeNull();
    expect(verifyToken(token, SECRET, t0 + 16 * 60_000)).toBeNull();
  });
});

describe('sessão da criança e modo Responsável', () => {
  it('modo Responsável: senha errada → 401 sem token; certa → token', async () => {
    const bad = mk(fakeStore({ guardianModeEnter: async () => ({ status: 'invalid' }) }));
    const r = await post(bad, '/guardian-mode/enter', { email: 'a@b.com', password: 'x' }, { authorization: 'Bearer st' });
    expect(r.status).toBe(401);
    expect(await r.json()).not.toHaveProperty('modeToken');
    const ok = await post(mk(fakeStore()), '/guardian-mode/enter', { email: 'a@b.com', password: 'x' }, { authorization: 'Bearer st' });
    expect((await ok.json()).modeToken).toBe('mt');
    expect((await post(mk(fakeStore()), '/guardian-mode/enter', {}, {})).status).toBe(401);
  });
  it('logout e saída do modo respondem 204', async () => {
    const store = fakeStore();
    const app = mk(store);
    expect((await post(app, '/child/logout', {}, { authorization: 'Bearer st' })).status).toBe(204);
    expect(store.childLogout).toHaveBeenCalledWith('st');
    expect((await post(app, '/guardian-mode/exit', {}, { authorization: 'Bearer mt' })).status).toBe(204);
    expect(store.guardianModeExit).toHaveBeenCalledWith('mt');
  });
  it('sem banco configurado, as rotas não existem', async () => {
    expect((await createApp().request('/child/token', { method: 'POST' })).status).toBe(404);
  });
});
