import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import type { AuthStore } from './store';

function fakeStore(over: Partial<AuthStore> = {}): AuthStore {
  return {
    redeemPairingCode: vi.fn(async () => ({ status: 'ok' as const, deviceId: 'd1', childId: 'c1', deviceToken: 'dt' })),
    childLogin: vi.fn(async () => ({ status: 'ok' as const, sessionToken: 'st', expiresAt: '2026-01-01T00:00:00.000Z' })),
    verifyChildSession: vi.fn(async (t) => (t === 'st' ? { sessionId: 's', childId: 'c1', familyId: 'f1', deviceId: 'd1' } : null)),
    childLogout: vi.fn(async () => {}),
    guardianModeEnter: vi.fn(async () => ({ status: 'ok' as const, modeToken: 'mt', expiresAt: '2026-01-01T00:15:00.000Z' })),
    verifyGuardianMode: vi.fn(async () => null),
    guardianModeExit: vi.fn(async () => {}),
    ...over,
  };
}
const post = (app: ReturnType<typeof createApp>, path: string, body: unknown, headers: Record<string, string> = {}) =>
  app.request(path, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } });

describe('POST /pairing/redeem', () => {
  it('devolve o token do aparelho', async () => {
    const store = fakeStore();
    const res = await post(createApp(store), '/pairing/redeem', { code: '123456', platform: 'ios' }, { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deviceToken: 'dt', deviceId: 'd1', childId: 'c1' });
    expect(store.redeemPairingCode).toHaveBeenCalledWith('123456', 'ios', '1.2.3.4', null);
  });
  it('recusa corpo inválido sem chamar o banco', async () => {
    const store = fakeStore();
    for (const b of [{ code: '12', platform: 'ios' }, { code: '123456', platform: 'tv' }, {}]) {
      expect((await post(createApp(store), '/pairing/redeem', b)).status).toBe(400);
    }
    expect(store.redeemPairingCode).not.toHaveBeenCalled();
  });
  it('código inválido → 401 e bloqueio → 429', async () => {
    const a = createApp(fakeStore({ redeemPairingCode: async () => ({ status: 'invalid' }) }));
    expect((await post(a, '/pairing/redeem', { code: '123456', platform: 'web' })).status).toBe(401);
    const b = createApp(fakeStore({ redeemPairingCode: async () => ({ status: 'locked' }) }));
    expect((await post(b, '/pairing/redeem', { code: '123456', platform: 'web' })).status).toBe(429);
  });
});

describe('POST /child/login', () => {
  it('PIN e e-mail+senha chegam ao banco do jeito certo', async () => {
    const store = fakeStore();
    const app = createApp(store);
    const h = { authorization: 'Bearer dt' };
    expect((await post(app, '/child/login', { pin: '1234' }, h)).status).toBe(200);
    expect(store.childLogin).toHaveBeenCalledWith('dt', null, '1234');
    expect((await post(app, '/child/login', { email: 'a@b.com', password: 'x' }, h)).status).toBe(200);
    expect(store.childLogin).toHaveBeenLastCalledWith('dt', 'a@b.com', 'x');
  });
  it('sem token do aparelho ou com corpo ruim → 400', async () => {
    const app = createApp(fakeStore());
    expect((await post(app, '/child/login', { pin: '1234' })).status).toBe(400);
    expect((await post(app, '/child/login', { pin: 'ab' }, { authorization: 'Bearer dt' })).status).toBe(400);
  });
  it('aparelho revogado → 401, bloqueio → 429', async () => {
    const h = { authorization: 'Bearer dt' };
    const r = createApp(fakeStore({ childLogin: async () => ({ status: 'revoked' }) }));
    const res = await post(r, '/child/login', { pin: '1234' }, h);
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('revoked');
    const l = createApp(fakeStore({ childLogin: async () => ({ status: 'locked' }) }));
    expect((await post(l, '/child/login', { pin: '1234' }, h)).status).toBe(429);
  });
});

describe('sessão da criança e modo Responsável', () => {
  it('GET /child/me exige sessão válida', async () => {
    const app = createApp(fakeStore());
    expect((await app.request('/child/me')).status).toBe(401);
    expect((await app.request('/child/me', { headers: { authorization: 'Bearer ruim' } })).status).toBe(401);
    const ok = await app.request('/child/me', { headers: { authorization: 'Bearer st' } });
    expect(await ok.json()).toEqual({ childId: 'c1' });
  });
  it('modo Responsável: senha errada → 401 sem token; certa → token', async () => {
    const bad = createApp(fakeStore({ guardianModeEnter: async () => ({ status: 'invalid' }) }));
    const r = await post(bad, '/guardian-mode/enter', { email: 'a@b.com', password: 'x' }, { authorization: 'Bearer st' });
    expect(r.status).toBe(401);
    expect(await r.json()).not.toHaveProperty('modeToken');
    const ok = await post(createApp(fakeStore()), '/guardian-mode/enter', { email: 'a@b.com', password: 'x' }, { authorization: 'Bearer st' });
    expect((await ok.json()).modeToken).toBe('mt');
    expect((await post(createApp(fakeStore()), '/guardian-mode/enter', {}, {})).status).toBe(401);
  });
  it('logout e saída do modo respondem 204', async () => {
    const store = fakeStore();
    const app = createApp(store);
    expect((await post(app, '/child/logout', {}, { authorization: 'Bearer st' })).status).toBe(204);
    expect(store.childLogout).toHaveBeenCalledWith('st');
    expect((await post(app, '/guardian-mode/exit', {}, { authorization: 'Bearer mt' })).status).toBe(204);
    expect(store.guardianModeExit).toHaveBeenCalledWith('mt');
  });
  it('sem banco configurado, as rotas não existem', async () => {
    expect((await createApp().request('/child/me')).status).toBe(404);
  });
});
