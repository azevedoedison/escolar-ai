// M-21 (TAT-23): pré-filtro antes de qualquer chamada a modelo.
// Checa tamanho, injeção de instruções e dado pessoal. Não chama rede.

import type { SafetyResult } from './index';

export const MAX_CHARS = 500;

// Frases comuns de tentativa de burlar o assistente. Lista curta de propósito:
// o classificador de entrada (M-22) cobre o resto.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore (todas )?(as )?(suas |minhas )?(instru(ç|c)(õ|o)es|regras)/i,
  /esque(ç|c)a (todas )?(as )?(suas |minhas )?(instru(ç|c)(õ|o)es|regras)/i,
  /(mostre|revele|mostra|revela) (o )?(seu |teu )?(prompt|system prompt|instru(ç|c)(õ|o)es internas)/i,
  /voc(ê|e) agora (é|e) (um|uma|o|a)\b/i,
  /modo (desenvolvedor|dan|sem regras)/i,
];

// Dados pessoais: e-mail, telefone, CPF, CEP e endereço com número.
const PERSONAL_DATA_PATTERNS: RegExp[] = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/,
  /(\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/,
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/,
  /\b\d{5}-?\d{3}\b/,
  /\b(rua|avenida|av\.|alameda|travessa)\s+[^,\n]{2,},?\s*\d{1,5}\b/i,
];

export type PreFilterOutcome =
  | { decision: 'allow' }
  | { decision: 'block' | 'redirect'; category: string };

export function preFilter(text: string): PreFilterOutcome {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { decision: 'block', category: 'vazio' };
  if (trimmed.length > MAX_CHARS) return { decision: 'block', category: 'tamanho' };
  if (INJECTION_PATTERNS.some((p) => p.test(trimmed))) {
    return { decision: 'block', category: 'injecao' };
  }
  if (PERSONAL_DATA_PATTERNS.some((p) => p.test(trimmed))) {
    return { decision: 'redirect', category: 'dado_pessoal' };
  }
  return { decision: 'allow' };
}

export interface RateLimitOptions {
  perMinute: number;
  perDay: number;
  now?: () => number;
}

// Limite por usuário, em memória. Para produção o contador vai para o banco;
// aqui o contrato já fica pronto para ser testado.
export function createRateLimiter(opts: RateLimitOptions) {
  const now = opts.now ?? Date.now;
  const hits = new Map<string, number[]>();
  const MINUTE = 60_000;
  const DAY = 86_400_000;

  return {
    check(userId: string): SafetyResult | null {
      const t = now();
      const list = (hits.get(userId) ?? []).filter((ts) => t - ts < DAY);
      const lastMinute = list.filter((ts) => t - ts < MINUTE).length;
      if (lastMinute >= opts.perMinute || list.length >= opts.perDay) {
        hits.set(userId, list);
        return { decision: 'block', category: 'limite_uso' };
      }
      list.push(t);
      hits.set(userId, list);
      return null;
    },
  };
}
