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
    childLoginGoogle: vi.fn(async () => ({ status: 'ok' as const, sessionToken: 'st', expiresAt: '2026-01-01T00:00:00.000Z' })),
    childLogout: vi.fn(async () => {}),
    guardianModeEnter: vi.fn(async () => ({ status: 'ok' as const, modeToken: 'mt', expiresAt: '2026-01-01T00:15:00.000Z' })),
    verifyGuardianMode: vi.fn(async () => null),
    guardianModeExit: vi.fn(async () => {}),
    guardianLogin: vi.fn(async () => ({ status: 'ok' as const, token: 'gt', expiresAt: '2026-01-08T00:00:00.000Z' })),
    verifyGuardian: vi.fn(async () => null),
    guardianLogout: vi.fn(async () => {}),
    requestEmailConfirmation: vi.fn(async () => ({ token: 'tk-confirm', name: 'Maria Souza' })),
    confirmEmail: vi.fn(async () => 'ok' as const),
    requestPasswordReset: vi.fn(async () => ({ token: 'tk-reset', name: 'Maria Souza' })),
    resetPassword: vi.fn(async () => 'ok' as const),
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

describe('login direto do responsável', () => {
  it('e-mail e senha devolvem o token do painel', async () => {
    const store = fakeStore();
    const res = await post(mk(store), '/guardian/login', { email: 'pai@exemplo.com', password: 'senha' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ token: 'gt', expiresAt: '2026-01-08T00:00:00.000Z' });
    expect(store.guardianLogin).toHaveBeenCalledWith('pai@exemplo.com', 'senha');
  });
  it('corpo ruim → 400 sem consultar o banco', async () => {
    const store = fakeStore();
    for (const b of [{}, { email: 'a@b.com' }, { email: 1, password: 'x' }]) {
      expect((await post(mk(store), '/guardian/login', b)).status).toBe(400);
    }
    expect(store.guardianLogin).not.toHaveBeenCalled();
  });
  it('dados errados → 401 com a mesma mensagem, bloqueio → 429', async () => {
    const bad = await post(mk(fakeStore({ guardianLogin: async () => ({ status: 'invalid' }) })), '/guardian/login', { email: 'x@y.com', password: 'z' });
    expect(bad.status).toBe(401);
    expect((await bad.json()).error).toBe('invalid');
    const locked = await post(mk(fakeStore({ guardianLogin: async () => ({ status: 'locked' }) })), '/guardian/login', { email: 'x@y.com', password: 'z' });
    expect(locked.status).toBe(429);
  });
  it('sair revoga a sessão e responde 204', async () => {
    const store = fakeStore();
    const res = await post(mk(store), '/guardian/logout', {}, { authorization: 'Bearer gt' });
    expect(res.status).toBe(204);
    expect(store.guardianLogout).toHaveBeenCalledWith('gt');
  });
});

describe('confirmação de e-mail e recuperação de senha do responsável', () => {
  const sent: Array<{ to: string; subject: string; text: string }> = [];
  const mailer = { send: vi.fn(async (m: { to: string; subject: string; text: string }) => void sent.push(m)) };
  const mkMail = (store: AuthStore) => createApp(undefined, { store, tokenSecret: SECRET, mailer, appBaseUrl: 'https://tata.exemplo/' });
  const flush = () => new Promise((r) => setTimeout(r, 0));

  it('login de e-mail não confirmado responde 403 com orientação', async () => {
    const store = fakeStore({ guardianLogin: async () => ({ status: 'unconfirmed' }) });
    const res = await post(mk(store), '/guardian/login', { email: 'a@b.com', password: 'x' });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: 'unconfirmed' });
  });

  it('esqueci a senha: manda o e-mail com o link e responde 202', async () => {
    sent.length = 0;
    const store = fakeStore();
    const res = await post(mkMail(store), '/guardian/password/forgot', { email: ' maria@exemplo.com ' }, { 'x-forwarded-for': '9.9.9.9' });
    await flush();
    expect(res.status).toBe(202);
    expect(store.requestPasswordReset).toHaveBeenCalledWith(' maria@exemplo.com ', '9.9.9.9');
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe('maria@exemplo.com');
    expect(sent[0]!.text).toContain('https://tata.exemplo/reset-password?token=tk-reset');
    expect(sent[0]!.text).toContain('Olá, Maria!');
  });

  it('esqueci a senha: a resposta é idêntica com ou sem conta, e sem conta nada é enviado', async () => {
    sent.length = 0;
    const withAccount = await post(mkMail(fakeStore()), '/guardian/password/forgot', { email: 'maria@exemplo.com' });
    const noAccount = await post(mkMail(fakeStore({ requestPasswordReset: async () => null })), '/guardian/password/forgot', { email: 'ninguem@exemplo.com' });
    await flush();
    expect(noAccount.status).toBe(withAccount.status);
    expect(await noAccount.text()).toBe(await withAccount.text());
    expect(sent).toHaveLength(1);
  });

  it('falha no envio não muda a resposta nem vaza o link', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const broken = createApp(undefined, { store: fakeStore(), tokenSecret: SECRET, mailer: { send: async () => { throw new Error('provedor fora'); } } });
    const res = await post(broken, '/guardian/password/forgot', { email: 'maria@exemplo.com' });
    await flush();
    expect(res.status).toBe(202);
    expect(JSON.stringify(err.mock.calls)).not.toContain('tk-reset');
    err.mockRestore();
  });

  it('pedidos com e-mail inválido são recusados sem chamar o banco', async () => {
    const store = fakeStore();
    for (const path of ['/guardian/password/forgot', '/guardian/email/resend']) {
      for (const b of [{}, { email: 'sem-arroba' }, { email: 42 }, { email: `${'a'.repeat(300)}@b.com` }]) {
        expect((await post(mkMail(store), path, b)).status).toBe(400);
      }
    }
    expect(store.requestPasswordReset).not.toHaveBeenCalled();
    expect(store.requestEmailConfirmation).not.toHaveBeenCalled();
  });

  it('reenviar confirmação: manda o link de confirmação', async () => {
    sent.length = 0;
    const res = await post(mkMail(fakeStore()), '/guardian/email/resend', { email: 'maria@exemplo.com' });
    await flush();
    expect(res.status).toBe(202);
    expect(sent[0]!.text).toContain('/confirm-email?token=tk-confirm');
    expect(sent[0]!.subject).toMatch(/Confirme/);
  });

  it('confirmar e-mail: link bom, usado/vencido e bloqueado', async () => {
    const ok = await post(mk(fakeStore()), '/guardian/email/confirm', { token: 'abc' });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ confirmed: true });
    const used = await post(mk(fakeStore({ confirmEmail: async () => 'invalid' })), '/guardian/email/confirm', { token: 'abc' });
    expect(used.status).toBe(400);
    expect(await used.json()).toMatchObject({ error: 'invalid' });
    expect((await post(mk(fakeStore({ confirmEmail: async () => 'locked' })), '/guardian/email/confirm', { token: 'abc' })).status).toBe(429);
    expect((await post(mk(fakeStore()), '/guardian/email/confirm', {})).status).toBe(400);
  });

  it('redefinir senha: sucesso, link ruim, senha curta e corpo inválido', async () => {
    const store = fakeStore();
    const ok = await post(mk(store), '/guardian/password/reset', { token: 'abc', password: 'senhaNova123' }, { 'x-forwarded-for': '1.1.1.1' });
    expect(ok.status).toBe(200);
    expect(store.resetPassword).toHaveBeenCalledWith('abc', 'senhaNova123', '1.1.1.1');
    const bad = await post(mk(fakeStore({ resetPassword: async () => 'invalid' })), '/guardian/password/reset', { token: 'x', password: 'senhaNova123' });
    expect(bad.status).toBe(400);
    const weak = await post(mk(fakeStore({ resetPassword: async () => 'weak' })), '/guardian/password/reset', { token: 'x', password: 'curta' });
    expect(await weak.json()).toMatchObject({ error: 'weak' });
    expect((await post(mk(fakeStore({ resetPassword: async () => 'locked' })), '/guardian/password/reset', { token: 'x', password: 'senhaNova123' })).status).toBe(429);
    for (const b of [{}, { token: 'x' }, { password: 'senhaNova123' }, { token: '', password: 'senhaNova123' }, { token: 'x', password: 'a'.repeat(500) }]) {
      expect((await post(mk(store), '/guardian/password/reset', b)).status).toBe(400);
    }
  });
});
