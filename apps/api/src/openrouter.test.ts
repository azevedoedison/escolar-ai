import { describe, expect, it } from 'vitest';
import { createOpenRouter, DEFAULT_MODEL } from './openrouter';

const reply = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status });

describe('createOpenRouter', () => {
  it('envia a chave só no cabeçalho, usa o modelo padrão e devolve o texto', async () => {
    let seen: { url: string; headers: Record<string, string>; body: string } | undefined;
    const client = createOpenRouter({
      apiKey: 'chave-de-teste',
      fetchFn: (async (url: string, init: RequestInit) => {
        seen = { url, headers: init.headers as Record<string, string>, body: String(init.body) };
        return new Response(JSON.stringify({ choices: [{ message: { content: 'olá' } }] }));
      }) as unknown as typeof fetch,
    });
    expect(await client.generate('sistema', [{ role: 'user', content: 'oi' }])).toBe('olá');
    expect(seen?.url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(seen?.headers.authorization).toBe('Bearer chave-de-teste');
    expect(seen?.body).not.toContain('chave-de-teste');
    const body = JSON.parse(seen?.body ?? '{}');
    expect(body.model).toBe(DEFAULT_MODEL);
    expect(body.messages[0]).toEqual({ role: 'system', content: 'sistema' });
  });
  it('usa o modelo informado', async () => {
    let model = '';
    const client = createOpenRouter({
      apiKey: 'k',
      model: 'outro/modelo',
      fetchFn: (async (_u: string, init: RequestInit) => {
        model = JSON.parse(String(init.body)).model;
        return new Response(JSON.stringify({ choices: [{ message: { content: 'x' } }] }));
      }) as unknown as typeof fetch,
    });
    await client.complete({ system: 's', user: 'u', maxTokens: 5 });
    expect(model).toBe('outro/modelo');
  });
  it('erro HTTP e resposta vazia viram exceção', async () => {
    const bad = createOpenRouter({ apiKey: 'k', fetchFn: reply({}, 500) as unknown as typeof fetch });
    await expect(bad.generate('s', [])).rejects.toThrow();
    const empty = createOpenRouter({ apiKey: 'k', fetchFn: reply({ choices: [] }) as unknown as typeof fetch });
    await expect(empty.complete({ system: 's', user: 'u', maxTokens: 5 })).rejects.toThrow();
  });
});
