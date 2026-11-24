import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { signToken } from './auth';
import { createMemoryStore } from './memory-store';
import type { LogEvent } from './http';

const secret = 'segredo-de-teste-com-mais-de-32-caracteres';
const exp = Math.floor(Date.now() / 1000) + 600;
const ana = { id: 'child-ana', familyId: 'fam-1', age: 11, grade: '6º ano', homeworkMode: true };
const token = signToken({ role: 'child', sub: ana.id, fam: ana.familyId, exp }, secret);
const PERGUNTA = 'segredo-da-pergunta-xyzzy-9137';

function setup(opts: { generate?: () => Promise<string>; hsts?: boolean; corsOrigins?: string[]; store?: ReturnType<typeof createMemoryStore>['store'] } = {}) {
  const logs: LogEvent[] = [];
  const mem = createMemoryStore([ana]);
  const app = createApp(
    {
      store: opts.store ?? mem.store,
      tokenSecret: secret,
      generator: { generate: opts.generate ?? (async () => `Resposta sobre ${PERGUNTA}`) },
      classifier: {
        model: 'c',
        async complete({ system }) {
          return system.includes('classifica a mensagem')
            ? '{"decisao":"responder","categoria":"nenhuma","intencao":"escolar","sinal_de_risco":"nenhum"}'
            : '{"decisao":"allow","categoria":"nenhuma","motivo":"ok"}';
        },
      },
    },
    undefined,
    { corsOrigins: opts.corsOrigins ?? ['https://app.exemplo.com'], hsts: opts.hsts, log: (e) => logs.push(e) },
  );
  const chat = (message: string) =>
    app.request('/chat', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ message }) });
  return { app, logs, chat, mem };
}

describe('cabeçalhos de segurança', () => {
  it('toda resposta traz os cabeçalhos, inclusive erro e rota inexistente', async () => {
    const { app } = setup();
    for (const r of [await app.request('/health'), await app.request('/nao-existe'), await app.request('/chat', { method: 'POST', body: '{}' })]) {
      expect(r.headers.get('x-content-type-options')).toBe('nosniff');
      expect(r.headers.get('x-frame-options')).toBe('DENY');
      expect(r.headers.get('referrer-policy')).toBe('no-referrer');
      expect(r.headers.get('content-security-policy')).toContain("default-src 'none'");
      expect(r.headers.get('cache-control')).toBe('no-store');
    }
  });

  it('HSTS só em produção', async () => {
    expect((await setup({ hsts: false }).app.request('/health')).headers.get('strict-transport-security')).toBeNull();
    expect((await setup({ hsts: true }).app.request('/health')).headers.get('strict-transport-security')).toContain('max-age=');
  });
});

describe('CORS restrito', () => {
  const pre = (app: ReturnType<typeof setup>['app'], origin: string) =>
    app.request('/chat', { method: 'OPTIONS', headers: { origin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'authorization' } });

  it('origem configurada recebe permissão', async () => {
    const r = await pre(setup().app, 'https://app.exemplo.com');
    expect(r.headers.get('access-control-allow-origin')).toBe('https://app.exemplo.com');
  });

  it('origem desconhecida não recebe nenhum cabeçalho de permissão, nem no preflight nem na resposta', async () => {
    const { app } = setup();
    const r = await pre(app, 'https://malicioso.example');
    expect(r.headers.get('access-control-allow-origin')).toBeNull();
    const g = await app.request('/health', { headers: { origin: 'https://malicioso.example' } });
    expect(g.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('sem origens configuradas, nenhuma é aceita; nunca "*"', async () => {
    const { app } = setup({ corsOrigins: [] });
    const r = await app.request('/health', { headers: { origin: 'https://app.exemplo.com' } });
    expect(r.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('limite de corpo', () => {
  it('corpo grande demais dá 413 e nada é gravado', async () => {
    const { chat, mem } = setup();
    const r = await chat('a'.repeat(70 * 1024));
    expect(r.status).toBe(413);
    expect(JSON.stringify(mem)).not.toContain('aaaaaaaaaa');
  });
});

describe('logs sem conteúdo', () => {
  it('chat normal: o log traz rota, status e latência, nunca a pergunta nem a resposta', async () => {
    const { chat, logs } = setup();
    const r = await chat(`Me explica ${PERGUNTA}`);
    expect(r.status).toBe(200);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ evento: 'requisicao', metodo: 'POST', rota: '/chat', status: 200 });
    expect(JSON.stringify(logs)).not.toContain(PERGUNTA);
  });

  it('o log de uma consulta traz o padrão da rota, não o id da conversa nem o token', async () => {
    const { app, logs } = setup();
    await app.request('/conversations/00000000-0000-4000-8000-000000000000', { headers: { authorization: `Bearer ${token}` } });
    expect(logs[0]?.rota).toBe('/conversations/:id');
    expect(JSON.stringify(logs)).not.toContain(token);
  });

  it('erro interno com texto da conversa na mensagem: 500 genérico e log só com o tipo do erro', async () => {
    const mem = createMemoryStore([ana]);
    const store = { ...mem.store, addMessage: async () => { throw new Error(`falha ao gravar: ${PERGUNTA}`); } };
    const { chat, logs } = setup({ store });
    const r = await chat(`Me explica ${PERGUNTA}`);
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: 'erro_interno' });
    expect(logs.find((l) => l.evento === 'erro')).toMatchObject({ rota: '/chat', tipo: 'Error' });
    expect(JSON.stringify(logs)).not.toContain(PERGUNTA);
  });

  it('falha do modelo com texto na mensagem: nada vaza para o log', async () => {
    const { chat, logs } = setup({ generate: async () => { throw new Error(`modelo caiu em ${PERGUNTA}`); } });
    const r = await chat(`Me explica ${PERGUNTA}`);
    expect(r.status).toBe(200);
    expect(JSON.stringify(logs)).not.toContain(PERGUNTA);
  });
});
