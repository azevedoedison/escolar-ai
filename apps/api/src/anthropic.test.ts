import { describe, expect, it } from 'vitest';
import { createAnthropic } from './anthropic';

const reply = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status });

describe('createAnthropic', () => {
  it('envia a chave só no cabeçalho e devolve o texto', async () => {
    let seen: { headers: Record<string, string>; body: string } | undefined;
    const client = createAnthropic({
      apiKey: 'chave-de-teste',
      fetchFn: (async (_url: string, init: RequestInit) => {
        seen = { headers: init.headers as Record<string, string>, body: String(init.body) };
        return new Response(JSON.stringify({ content: [{ type: 'text', text: 'olá' }] }));
      }) as unknown as typeof fetch,
    });
    expect(await client.generate('sistema', [{ role: 'user', content: 'oi' }])).toBe('olá');
    expect(seen?.headers['x-api-key']).toBe('chave-de-teste');
    expect(seen?.body).not.toContain('chave-de-teste');
    expect(JSON.parse(seen?.body ?? '{}').model).toBe('claude-haiku-5-5');
  });
  it('erro HTTP e resposta vazia viram exceção', async () => {
    const bad = createAnthropic({ apiKey: 'k', fetchFn: reply({}, 500) as unknown as typeof fetch });
    await expect(bad.generate('s', [])).rejects.toThrow();
    const empty = createAnthropic({ apiKey: 'k', fetchFn: reply({ content: [] }) as unknown as typeof fetch });
    await expect(empty.complete({ system: 's', user: 'u', maxTokens: 5 })).rejects.toThrow();
  });
});
