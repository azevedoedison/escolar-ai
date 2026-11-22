// Pacote reservado para os classificadores de segurança (Fase 1, itens M-20 a M-26).
// Aqui ficam só os tipos do contrato; a implementação vem na próxima fase.

export type SafetyDecision = 'allow' | 'redirect' | 'block' | 'crisis';

export interface SafetyResult {
  decision: SafetyDecision;
  category: string;
}

export type SafetyClassifier = (text: string) => Promise<SafetyResult>;

export { MAX_CHARS, createRateLimiter, preFilter } from './prefilter';
export type { PreFilterOutcome, RateLimitOptions } from './prefilter';
export { CVV, DISQUE_100, safeResponse } from './responses';
export type { SafeResponseInput } from './responses';
export type { ModelClient, ModelRequest } from './model';
export { MAX_ANSWER_CHARS, OUTPUT_CATEGORIES, classifyOutput, parseOutputVerdict } from './output-classifier';
export type { OutputCheckInput, OutputDecision, OutputVerdict } from './output-classifier';
export { INPUT_CATEGORIES, classifyInput, parseInputVerdict } from './input-classifier';
export type { InputCheckInput } from './input-classifier';
