// M-24 (TAT-26): respostas padrão da Tatá quando a pergunta é redirecionada,
// bloqueada ou indica crise. Tom acolhedor, sem alarme, sem punição, e sempre
// com um caminho para ajuda humana. Texto fixo: não passa por modelo.

import type { SafetyDecision } from './index';

export const CVV = 'CVV, pelo telefone 188 (ligação gratuita, 24 horas)';
export const DISQUE_100 = 'Disque 100 (gratuito, 24 horas)';

export interface SafeResponseInput {
  decision: Exclude<SafetyDecision, 'allow'>;
  category?: string;
}

// Crise com violência, abuso ou aliciamento acrescenta o Disque 100.
const VIOLENCE_CATEGORIES = new Set(['abuso', 'violencia', 'aliciamento', 'bullying']);

const CRISIS_BASE =
  'Obrigada por me contar isso. Eu me importo com você, e o que você está sentindo importa muito. ' +
  'Você não precisa passar por isso sozinho(a). Que tal conversar agora com um adulto de confiança, ' +
  'como sua mãe, seu pai, um familiar ou alguém da escola? ' +
  `Se quiser falar com alguém agora, o ${CVV} atende com carinho. `;

const REDIRECT_BY_CATEGORY: Record<string, string> = {
  dado_pessoal:
    'Para sua segurança, é melhor não compartilhar dados pessoais por aqui, como telefone, endereço ou documentos. ' +
    'Posso te ajudar com sua dúvida sem isso. Qual é a pergunta?',
};

const REDIRECT_DEFAULT =
  'Esse é um assunto que vale mais a pena conversar com seus pais ou com um professor, ' +
  'porque eles conhecem você e podem explicar melhor. Enquanto isso, posso te ajudar com outra dúvida, ' +
  'ou com a parte desse tema que aparece nas aulas. Quer tentar?';

const BLOCK_BY_CATEGORY: Record<string, string> = {
  vazio: 'Parece que a mensagem veio vazia. Pode escrever sua pergunta?',
  tamanho: 'Sua mensagem ficou bem grande. Pode me mandar a pergunta em um texto mais curto?',
  limite_uso:
    'Por hoje já conversamos bastante! Vamos continuar mais tarde? Se for urgente, fale com um adulto.',
  classificador_indisponivel:
    'Não consegui responder agora. Pode tentar de novo daqui a pouco? Se precisar de ajuda com urgência, fale com um adulto.',
};

const BLOCK_DEFAULT =
  'Eu não consigo ajudar com esse assunto, mas sem problema. Se tiver curiosidade, vale conversar com seus pais. ' +
  'Posso te ajudar com outra pergunta ou com a lição de casa?';

export function safeResponse({ decision, category }: SafeResponseInput): string {
  const cat = category ?? '';
  if (decision === 'crisis') {
    return VIOLENCE_CATEGORIES.has(cat)
      ? `${CRISIS_BASE}Se alguém estiver machucando você ou fazendo você se sentir mal, o ${DISQUE_100} também pode ajudar. ` +
          'Você não fez nada de errado.'
      : `${CRISIS_BASE}Estou aqui com você.`;
  }
  if (decision === 'redirect') return REDIRECT_BY_CATEGORY[cat] ?? REDIRECT_DEFAULT;
  return BLOCK_BY_CATEGORY[cat] ?? BLOCK_DEFAULT;
}
