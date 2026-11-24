// Modelos da suíte. A parte que chama o modelo fica atrás de `ModelClient`:
// - `simulado`: roda sem chave, de forma determinística. Devolve o veredito que a política manda
//   para cada caso. Ele valida o encanamento (prompt, parser, mapeamento, pré-filtro, metas),
//   NÃO mede a qualidade de nenhum modelo.
// - `anthropic`: chama a API de verdade. Exige ANTHROPIC_API_KEY no ambiente.

import { INPUT_DECISIONS } from '../src';
import type { ModelClient, ModelRequest } from '../src';
import type { Caso, Esperado } from './types';

export interface ModeloDeAvaliacao {
  nome: string;
  /** Cliente a usar para o caso. O real é o mesmo para todos; o simulado depende do caso. */
  para(caso: Caso): ModelClient;
}

const DECISAO: Record<Esperado, (typeof INPUT_DECISIONS)[number]> = {
  responder: 'responder',
  com_cuidado: 'responder_com_cuidado',
  redirecionar: 'redirecionar',
  bloquear: 'bloquear',
  crise: 'crise',
};

const INTENCAO: Record<Esperado, string> = {
  responder: 'escolar',
  com_cuidado: 'curiosidade',
  redirecionar: 'curiosidade',
  bloquear: 'busca_de_dano',
  crise: 'pessoal',
};

const RISCO: Record<Esperado, string> = {
  responder: 'nenhum',
  com_cuidado: 'baixo',
  redirecionar: 'baixo',
  bloquear: 'alto',
  crise: 'crise',
};

/** JSON de veredito no formato que o classificador de entrada exige. */
export function veredito(esperado: Esperado, categoria: string): string {
  return JSON.stringify({
    decisao: DECISAO[esperado],
    categoria,
    intencao: INTENCAO[esperado],
    sinal_de_risco: RISCO[esperado],
  });
}

const fixo = (out: string): ModelClient => ({ model: 'simulado', complete: async () => out });

/** Segue a política: responde exatamente o que o caso espera. */
export const simulado: ModeloDeAvaliacao = {
  nome: 'simulado',
  para: (c) => fixo(veredito(c.resultado_esperado, c.categoria)),
};

/** Modelo quebrado que libera tudo: a suíte precisa reprovar. */
export const simuladoPermissivo: ModeloDeAvaliacao = {
  nome: 'simulado-permissivo',
  para: () => fixo(veredito('responder', 'nenhuma')),
};

/** Modelo que nunca percebe crise (trata como bloqueio): a suíte precisa reprovar. */
export const simuladoSemCrise: ModeloDeAvaliacao = {
  nome: 'simulado-sem-crise',
  para: (c) => fixo(veredito(c.resultado_esperado === 'crise' ? 'bloquear' : c.resultado_esperado, c.categoria)),
};

/** Modelo fora do ar: tudo falha fechado (bloqueio). */
export const simuladoForaDoAr: ModeloDeAvaliacao = {
  nome: 'simulado-fora-do-ar',
  para: () => ({
    model: 'simulado',
    complete: async () => {
      throw new Error('indisponível');
    },
  }),
};

export const DEFAULT_REAL_MODEL = 'claude-haiku-5-5';

/** Cliente da API de mensagens da Anthropic. A chave vem só do ambiente, nunca de arquivo. */
export function anthropic(opts: { apiKey: string; model?: string; fetchFn?: typeof fetch }): ModeloDeAvaliacao {
  const model = opts.model ?? DEFAULT_REAL_MODEL;
  const doFetch = opts.fetchFn ?? fetch;
  const client: ModelClient = {
    model,
    async complete(req: ModelRequest) {
      const res = await doFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': opts.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: req.maxTokens,
          system: req.system,
          messages: [{ role: 'user', content: req.user }],
        }),
      });
      if (!res.ok) throw new Error(`modelo respondeu ${res.status}`);
      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      const text = (data.content ?? []).map((b) => (b.type === 'text' ? (b.text ?? '') : '')).join('');
      if (!text.trim()) throw new Error('modelo devolveu resposta vazia');
      return text;
    },
  };
  return { nome: model, para: () => client };
}
