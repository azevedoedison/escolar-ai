// Contrato e regras de apresentação da linha do tempo do painel dos pais (M-30, M-31).

export type TimelineDecision = 'allow' | 'redirect' | 'block' | 'crisis';
export type AlertStatus = 'new' | 'seen' | 'resolved';

/** Uma pergunta da criança com a resposta da Tatá e a decisão de segurança mais grave do par. */
export interface TimelineItem {
  id: string;
  conversationId: string;
  conversationTitle: string | null;
  question: string;
  answer: string | null;
  /** ISO 8601 da pergunta. */
  createdAt: string;
  decision: TimelineDecision;
  category: string;
  /** Estado do alerta gerado por este item, se houver. */
  alert: AlertStatus | null;
}

export interface TimelinePage {
  items: TimelineItem[];
  /** Passe em `cursor` para a página seguinte; null no fim. */
  nextCursor: string | null;
}

export interface TimelineFilters {
  /** AAAA-MM-DD, inclusive, no fuso de São Paulo. */
  from?: string;
  to?: string;
  /** Só perguntas que não foram respondidas normalmente (redirect, block ou crisis). */
  blocked?: boolean;
  alerts?: boolean;
  q?: string;
}

export const TIMELINE_PAGE_SIZE = 30;
export const TIMELINE_MAX_PAGE_SIZE = 100;
export const SEARCH_MAX_LENGTH = 100;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
export function isIsoDate(v: unknown): v is string {
  if (typeof v !== 'string' || !DATE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
}

/** Lê filtros da query string. Valor inválido vira `null` (a rota responde 400). */
export function parseTimelineQuery(get: (k: string) => string | undefined): { filters: TimelineFilters; limit: number; cursor: string | null } | null {
  const from = get('from');
  const to = get('to');
  if ((from !== undefined && !isIsoDate(from)) || (to !== undefined && !isIsoDate(to))) return null;
  if (from && to && from > to) return null;
  const flag = (k: string) => get(k) === '1' || get(k) === 'true';
  const q = get('q')?.trim();
  if (q && q.length > SEARCH_MAX_LENGTH) return null;
  const rawLimit = get('limit');
  let limit = TIMELINE_PAGE_SIZE;
  if (rawLimit !== undefined) {
    limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > TIMELINE_MAX_PAGE_SIZE) return null;
  }
  return {
    filters: { from, to, blocked: flag('blocked'), alerts: flag('alerts'), q: q || undefined },
    limit,
    cursor: get('cursor') || null,
  };
}

/**
 * Texto de uma conversa pronto para mostrar. O painel NUNCA interpreta HTML (defeito S4): o conteúdo é
 * sempre exibido como texto literal. Aqui só tiramos caracteres de controle e os que invertem a direção
 * do texto, que poderiam embaralhar a tela dos pais.
 */
export function plainText(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g, '');
}

const CATEGORY_LABELS: Record<string, string> = {
  nenhuma: 'Pergunta comum',
  morte_doenca_guerra: 'Morte, doença ou guerra',
  suicidio_autolesao: 'Suicídio ou autolesão',
  abuso: 'Abuso',
  sexualidade: 'Sexualidade',
  drogas: 'Drogas',
  violencia_armas: 'Violência ou armas',
  desafio_perigoso_transtorno_alimentar: 'Desafio perigoso ou transtorno alimentar',
  apostas_golpes_hacking: 'Apostas, golpes ou hacking',
  contato_estranhos: 'Contato com estranhos',
  odio_discriminacao: 'Ódio ou discriminação',
  dado_pessoal: 'Dado pessoal',
  fora_do_papel: 'Fora do papel da Tatá',
  vazamento_de_instrucoes: 'Tentativa de ver as instruções',
  injecao: 'Tentativa de burlar o filtro',
  vazio: 'Mensagem vazia',
  tamanho: 'Mensagem longa demais',
  limite_uso: 'Limite de uso',
  classificador_indisponivel: 'Filtro indisponível',
};

/** Nome amigável da categoria; categoria desconhecida aparece como veio (texto, nunca HTML). */
export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? plainText(category);
}

export const DECISION_LABELS: Record<TimelineDecision, string> = {
  allow: 'Respondida',
  redirect: 'Redirecionada',
  block: 'Bloqueada',
  crisis: 'Sinal de crise',
};

/** Itens que pedem atenção dos pais ficam destacados. */
export const isHighlighted = (d: TimelineDecision) => d !== 'allow';
