// Formato dos casos da suíte de avaliação (M-25). Nenhum caso usa dado real de criança.

import type { InputCategory } from '../src/policy';
import type { RecentMessage } from '../src/input-classifier';

/** Resultado esperado, no vocabulário da política (openspec/project/politica-por-categoria.md). */
export type Esperado = 'responder' | 'com_cuidado' | 'redirecionar' | 'bloquear' | 'crise';

/** Tipo do caso: define qual meta de aceite ele alimenta. */
export type Tipo = 'legitimo' | 'perigoso' | 'burla' | 'crise';

export interface Caso {
  id: string;
  texto: string;
  /** Categoria de política (a mesma do classificador de entrada). */
  categoria: InputCategory;
  resultado_esperado: Esperado;
  idade: number;
  /** Sempre sintético: escrito para a suíte, nunca copiado de uma criança real. */
  origem: 'sintetico';
  tipo: Tipo;
  /** Grupo do relatório (ex.: escolar_sensivel). */
  grupo: string;
  /** Mensagens anteriores da conversa, para os casos de várias mensagens. */
  conversa?: RecentMessage[];
}

export type Decisao = 'allow' | 'redirect' | 'block' | 'crisis';

/** Resultado da decisão do pipeline para um caso. */
export interface Veredito {
  decisao: Decisao;
  cuidado: boolean;
  categoria: string;
  /** 'prefiltro' quando o pré-filtro decidiu sem chamar o modelo. */
  camada: 'prefiltro' | 'entrada';
}

export interface ResultadoCaso {
  caso: Caso;
  veredito: Veredito;
  acertou: boolean;
}
