import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import type { GuardianStore } from './guardian-store';
import type { TimelinePage } from '@tata/shared';

const FAM = '11111111-1111-4111-8111-111111111111';
const CHILD = '22222222-2222-4222-8222-222222222222';
const XSS = '<img src=x onerror=alert(1)>';

const page: TimelinePage = {
  items: [
    { id: 'm1', conversationId: 'c1', conversationTitle: XSS, question: XSS, answer: 'Não posso ajudar.', createdAt: '2026-11-22T12:00:00.000Z', decision: 'block', category: 'drogas', alert: null },
  ],
  nextCursor: null,
};

function setup(over: Partial<GuardianStore> = {}) {
  const store: GuardianStore = {
    listChildren: vi.fn(async () => [{ id: CHILD, nickname: 'Ana', grade: '6º ano', avatar: null }]),
    timeline: vi.fn(async (fam, id) => (fam === FAM && id === CHILD ? page : null)),
    ...over,
  };
  const verifyGuardianMode = vi.fn(async (t: string) => (t === 'mt' ? { guardianId: 'g1', familyId: FAM } : null));
  const app = createApp(undefined, undefined, { store, auth: { verifyGuardianMode } });
  return { app, store };
}
const get = (app: ReturnType<typeof setup>['app'], path: string, token: string | null = 'mt') =>
  app.request(path, { headers: token ? { authorization: `Bearer ${token}` } : {} });

describe('autenticação do painel', () => {
  it('sem token ou com token inválido → 401, sem tocar no banco', async () => {
    const { app, store } = setup();
    expect((await get(app, '/guardian/children', null)).status).toBe(401);
    expect((await get(app, '/guardian/children', 'x')).status).toBe(401);
    expect((await get(app, `/guardian/children/${CHILD}/timeline`, 'x')).status).toBe(401);
    expect(store.listChildren).not.toHaveBeenCalled();
    expect(store.timeline).not.toHaveBeenCalled();
  });
  it('token de criança não abre o painel', async () => {
    const { app } = setup();
    // o token de chat da criança é assinado e não é uma sessão de modo Responsável
    expect((await get(app, '/guardian/children', 'a.b')).status).toBe(401);
  });
});

describe('GET /guardian/children', () => {
  it('lista só os filhos da família da sessão', async () => {
    const { app, store } = setup();
    const res = await get(app, '/guardian/children');
    expect(res.status).toBe(200);
    expect((await res.json()).children).toHaveLength(1);
    expect(store.listChildren).toHaveBeenCalledWith(FAM);
  });
});

describe('GET /guardian/children/:id/timeline', () => {
  it('devolve a página e passa a família da sessão ao banco', async () => {
    const { app, store } = setup();
    const res = await get(app, `/guardian/children/${CHILD}/timeline?blocked=1&q=bala&from=2026-11-01`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(page);
    expect(store.timeline).toHaveBeenCalledWith(FAM, CHILD, {
      filters: { from: '2026-11-01', to: undefined, blocked: true, alerts: false, q: 'bala' },
      limit: 30,
      cursor: null,
    });
  });
  it('filho de outra família ou inexistente → 404 igual', async () => {
    const { app } = setup();
    const other = await get(app, '/guardian/children/33333333-3333-4333-8333-333333333333/timeline');
    const bad = await get(app, '/guardian/children/nao-e-uuid/timeline');
    expect(other.status).toBe(404);
    expect(bad.status).toBe(404);
    expect(await other.json()).toEqual(await bad.json());
  });
  it('filtro inválido → 400 sem consultar o banco', async () => {
    const { app, store } = setup();
    for (const qs of ['from=ontem', 'limit=999', 'from=2026-11-22&to=2026-11-01']) {
      expect((await get(app, `/guardian/children/${CHILD}/timeline?${qs}`)).status).toBe(400);
    }
    expect(store.timeline).not.toHaveBeenCalled();
  });

  // Defeito S4 do código antigo: conteúdo da criança virava HTML no painel.
  it('HTML da criança sai como texto literal, em JSON, sem cache e sem sniffing', async () => {
    const { app } = setup();
    const res = await get(app, `/guardian/children/${CHILD}/timeline`);
    expect(res.headers.get('content-type')).toMatch(/^application\/json/);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as TimelinePage;
    expect(body.items[0]!.question).toBe(XSS);
    expect(body.items[0]!.conversationTitle).toBe(XSS);
  });
});
