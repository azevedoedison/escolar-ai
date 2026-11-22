// Contrato e regras de apresentação do chat da criança (M-10 a M-12).

export const SUPERVISION_NOTICE = 'Seus pais podem ver as suas conversas com a Tatá.';

export interface ChatMessage {
  id: string;
  role: 'child' | 'tata';
  content: string;
}

export interface ChatReply {
  conversationId: string;
  message: ChatMessage;
  decision: 'allow' | 'redirect' | 'block' | 'crisis';
}

export interface ConversationItem {
  id: string;
  title: string | null;
  startedAt: string;
}

const SUGGESTIONS_YOUNG = [
  'Por que o céu é azul?',
  'Como as plantas fazem comida?',
  'Quem foi Santos Dumont?',
];
const SUGGESTIONS_OLDER = [
  'Me explica a diferença entre célula animal e vegetal.',
  'Como funciona a fotossíntese?',
  'Me ajuda a entender frações?',
];

/** Sugestões de primeira pergunta, por idade. */
export function suggestedQuestions(age: number): string[] {
  return age <= 9 ? SUGGESTIONS_YOUNG : SUGGESTIONS_OLDER;
}

/** Quantos caracteres mostrar no passo `step` do efeito de digitação (nunca corta no meio de uma palavra se possível). */
export function revealLength(text: string, step: number, charsPerStep = 3): number {
  const n = Math.min(text.length, Math.max(0, step) * charsPerStep);
  return n;
}

export function isTypingDone(text: string, step: number, charsPerStep = 3): boolean {
  return revealLength(text, step, charsPerStep) >= text.length;
}

/** Título curto para mostrar na lista "minhas perguntas". */
export function conversationLabel(c: ConversationItem): string {
  return c.title?.trim() || 'Conversa sem título';
}
