import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import type { PrivacyStore } from './privacy-store';

const ID = '00000000-0000-0000-0000-0000000000c1';
const OTHER = '00000000-0000-0000-0000-0000000000c2';
const auth = { verifyGuardian: vi.fn(async (t: string) => (t === 'gt' ? { guardianId: 'g1', familyId: 'f1' } : null)) };

function fakeStore(over: Partial<PrivacyStore> = {}): PrivacyStore {
  return {
    getRetention: vi.fn(async () => 90),
    setRetention: vi.fn(async () => {}),
    exportFamily: vi.fn(async () => ({ children: [{ nickname: 'Ana' }] })),
    deleteConversation: vi.fn(async (_g, id) => (id === ID ? ('ok' as const) : ('not_found' as const))),
    deleteChildConversations: vi.fn(async (_g, id) => (id === ID ? 3 : null)),
    deleteChild: vi.fn(async (_g, id) => (id === ID ? ('ok' as const) : ('not_found' as const))),
    ...over,
  };
}
const mk = (store: PrivacyStore) => createApp(undefined, undefined, { store, auth, now: () => new Date('2026-11-24T12:00:00Z') });
const call = (app: ReturnType<typeof mk>, method: string, path: string, body?: unknown, token: string | null = 'gt') =>
  app.request(path, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe('autenticação', () => {
  it('toda rota recusa sem token ou com token inválido, sem tocar no banco', async () => {
    const store = fakeStore();
    const app = mk(store);
    const routes: [string, string, unknown?][] = [
      ['GET', '/guardian/privacy/retention'],
      ['PUT', '/guardian/privacy/retention', { days: 60 }],
      ['GET', '/guardian/privacy/export'],
      ['DELETE', `/guardian/privacy/conversations/${ID}`],
      ['DELETE', `/guardian/privacy/children/${ID}/conversations`],
      ['DELETE', `/guardian/privacy/children/${ID}`, { confirm: true }],
    ];
    for (const [m, p, b] of routes) {
      expect((await call(app, m, p, b, null)).status, `${m} ${p}`).toBe(401);
      expect((await call(app, m, p, b, 'errado')).status, `${m} ${p}`).toBe(401);
    }
    for (const fn of Object.values(store)) expect(fn).not.toHaveBeenCalled();
  });
});

describe('retenção', () => {
  it('lê e muda a retenção da família do responsável', async () => {
    const store = fakeStore();
    const app = mk(store);
    expect(await (await call(app, 'GET', '/guardian/privacy/retention')).json()).toEqual({ days: 90, min: 30, max: 365 });
    const res = await call(app, 'PUT', '/guardian/privacy/retention', { days: 60 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ days: 60 });
    expect(store.setRetention).toHaveBeenCalledWith('g1', 60);
  });

  it('recusa valores inválidos com 400', async () => {
    const store = fakeStore();
    const app = mk(store);
    for (const b of [{ days: 29 }, { days: 366 }, { days: '90' }, { days: 45.5 }, {}, [], null]) {
      expect((await call(app, 'PUT', '/guardian/privacy/retention', b)).status, JSON.stringify(b)).toBe(400);
    }
    expect((await app.request('/guardian/privacy/retention', { method: 'PUT', headers: { authorization: 'Bearer gt' }, body: '{quebrado' })).status).toBe(400);
    expect(store.setRetention).not.toHaveBeenCalled();
  });
});

describe('exportar', () => {
  it('entrega o arquivo como download, sem cache', async () => {
    const res = await call(mk(fakeStore()), 'GET', '/guardian/privacy/export');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="tata-ia-dados-2026-11-24.json"');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await res.json()).toEqual({ children: [{ nickname: 'Ana' }] });
  });
});

describe('apagar', () => {
  it('apaga uma conversa; de outra família ou id inválido responde 404 igual', async () => {
    const app = mk(fakeStore());
    expect((await call(app, 'DELETE', `/guardian/privacy/conversations/${ID}`)).status).toBe(204);
    expect((await call(app, 'DELETE', `/guardian/privacy/conversations/${OTHER}`)).status).toBe(404);
    expect((await call(app, 'DELETE', '/guardian/privacy/conversations/nao-e-uuid')).status).toBe(404);
  });

  it('apaga as conversas de um filho e devolve quantas', async () => {
    const app = mk(fakeStore());
    const ok = await call(app, 'DELETE', `/guardian/privacy/children/${ID}/conversations`);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ deleted: 3 });
    expect((await call(app, 'DELETE', `/guardian/privacy/children/${OTHER}/conversations`)).status).toBe(404);
  });

  it('excluir filho exige confirmação explícita', async () => {
    const store = fakeStore();
    const app = mk(store);
    for (const b of [undefined, {}, { confirm: 'true' }, { confirm: false }]) {
      expect((await call(app, 'DELETE', `/guardian/privacy/children/${ID}`, b)).status, JSON.stringify(b)).toBe(400);
    }
    expect(store.deleteChild).not.toHaveBeenCalled();
    expect((await call(app, 'DELETE', `/guardian/privacy/children/${ID}`, { confirm: true })).status).toBe(204);
    expect((await call(app, 'DELETE', `/guardian/privacy/children/${OTHER}`, { confirm: true })).status).toBe(404);
  });

  it('não existe rota para excluir a conta do responsável (decisão em aberto)', async () => {
    const app = mk(fakeStore());
    for (const p of ['/guardian/privacy/account', '/guardian/account']) {
      expect((await call(app, 'DELETE', p, { confirm: true })).status).toBe(404);
    }
  });
});
