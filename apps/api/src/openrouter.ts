// Cliente do OpenRouter (API compatível com chat completions). A chave vem só do ambiente.

import type { ModelClient, ModelRequest } from '@tata/safety';
import type { ChatTurn, Generator } from './anthropic';

export const DEFAULT_MODEL = 'z-ai/glm-5.3-flash';

export function createOpenRouter(
  opts: { apiKey: string; model?: string; fetchFn?: typeof fetch },
): Generator & ModelClient {
  const model = opts.model ?? DEFAULT_MODEL;
  const doFetch = opts.fetchFn ?? fetch;

  async function call(system: string, messages: ChatTurn[], maxTokens: number): Promise<string> {
    const res = await doFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.apiKey}` },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, ...messages] }),
    });
    if (!res.ok) throw new Error(`modelo respondeu ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? '';
    if (!text.trim()) throw new Error('modelo devolveu resposta vazia');
    return text;
  }

  return {
    generate: (system, turns) => call(system, turns, 1024),
    complete: (req: ModelRequest) => call(req.system, [{ role: 'user', content: req.user }], req.maxTokens),
  };
}
