// Cliente da API de mensagens da Anthropic. A chave vem só do ambiente.

import type { ModelClient, ModelRequest } from '@tata/safety';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface Generator {
  generate(system: string, turns: ChatTurn[]): Promise<string>;
}

export const DEFAULT_MODEL = 'claude-haiku-5-5';

export function createAnthropic(
  opts: { apiKey: string; model?: string; fetchFn?: typeof fetch },
): Generator & ModelClient {
  const model = opts.model ?? DEFAULT_MODEL;
  const doFetch = opts.fetchFn ?? fetch;

  async function call(system: string, messages: ChatTurn[], maxTokens: number): Promise<string> {
    const res = await doFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': opts.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
    });
    if (!res.ok) throw new Error(`modelo respondeu ${res.status}`);
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? []).map((b) => (b.type === 'text' ? (b.text ?? '') : '')).join('');
    if (!text.trim()) throw new Error('modelo devolveu resposta vazia');
    return text;
  }

  return {
    generate: (system, turns) => call(system, turns, 1024),
    complete: (req: ModelRequest) => call(req.system, [{ role: 'user', content: req.user }], req.maxTokens),
  };
}
