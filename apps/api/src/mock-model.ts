// Modelo simulado para testes e2e: responde sem rede e sem chave. NUNCA para uso real.
// Faz o papel de gerador (respostas da Tatá) e dos dois classificadores (entrada e saída), com regras fixas e previsíveis.

import type { ModelClient, ModelRequest } from '@tata/safety';
import type { ChatTurn, Generator } from './anthropic';

export const MOCK_MODEL_NAME = 'mock/tata-simulado';

const INPUT_HINT = 'Você classifica a mensagem';
const OUTPUT_HINT = 'Você revisa respostas';

const DRUGS = /\b(drogas?|maconha|cocaína|cocaina|crack)\b/i;

function question(user: string): string {
  return /<pergunta>([\s\S]*?)<\/pergunta>/.exec(user)?.[1]?.trim() ?? '';
}

function classifyInputMock(user: string): string {
  if (DRUGS.test(question(user))) {
    return JSON.stringify({ decisao: 'bloquear', categoria: 'drogas', intencao: 'busca_de_dano', sinal_de_risco: 'alto' });
  }
  return JSON.stringify({ decisao: 'responder', categoria: 'nenhuma', intencao: 'escolar', sinal_de_risco: 'nenhum' });
}

const classifyOutputMock = () => JSON.stringify({ decisao: 'allow', categoria: 'nenhuma', motivo: 'resposta simulada' });

/** Respostas por assunto. A última pergunta manda; o histórico só entra para mostrar que a conversa continua. */
export function mockAnswer(turns: ChatTurn[]): string {
  const last = turns.at(-1)?.content ?? '';
  const n = turns.filter((t) => t.role === 'user').length;
  const text = last.toLowerCase();
  if (/fotoss[ií]ntese/.test(text)) {
    return 'As plantas usam a luz do sol, a água e o gás carbônico para fazer o próprio alimento. A clorofila, que dá a cor verde às folhas, capta a luz. No final, a planta produz açúcar e solta oxigênio.';
  }
  if (/1\/2\s*\+\s*1\/4/.test(text)) return 'Para somar 1/2 + 1/4, deixe os dois com denominador 4: 2/4 + 1/4 = 3/4.';
  if (/3\/4\s*(menos|-)\s*1\/2/.test(text)) return 'Para fazer 3/4 − 1/2, escreva 1/2 como 2/4: 3/4 − 2/4 = 1/4.';
  if (/fra[cç][õo]es/.test(text)) {
    return 'Uma fração mostra partes de um todo. Em 1/2, o todo foi dividido em 2 partes iguais e pegamos 1. Quer treinar com uma conta?';
  }
  return `Boa pergunta! (resposta simulada ${n})`;
}

export function createMockModel(): Generator & ModelClient {
  return {
    model: MOCK_MODEL_NAME,
    generate: async (_system, turns) => mockAnswer(turns),
    complete: async ({ system, user }: ModelRequest) => {
      if (system.startsWith(INPUT_HINT)) return classifyInputMock(user);
      if (system.startsWith(OUTPUT_HINT)) return classifyOutputMock();
      throw new Error('modelo simulado: tipo de pedido desconhecido');
    },
  };
}
