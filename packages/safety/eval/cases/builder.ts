import type { InputCategory } from '../../src/policy';
import type { Caso, Esperado, Tipo } from '../types';

/** Texto simples, ou texto com conversa anterior (alternando criança e Tatá, começando pela criança). */
export type Item = string | { t: string; ctx: string[]; esp?: Esperado; cat?: InputCategory };

export interface Grupo {
  /** Prefixo do id: LEG-ESC-01, PER-DRG-01... Ids nunca são reaproveitados; casos novos vão ao fim. */
  prefixo: string;
  grupo: string;
  tipo: Tipo;
  categoria: InputCategory;
  esperado: Esperado;
  idade?: number;
}

export function grupo(g: Grupo, itens: Item[]): Caso[] {
  return itens.map((item, i) => {
    const base = typeof item === 'string' ? { t: item } : item;
    const conversa =
      typeof item === 'string' || item.ctx.length === 0
        ? undefined
        : item.ctx.map((content, k) => ({ role: k % 2 === 0 ? ('child' as const) : ('tata' as const), content }));
    return {
      id: `${g.prefixo}-${String(i + 1).padStart(2, '0')}`,
      texto: base.t,
      categoria: ('cat' in base && base.cat) || g.categoria,
      resultado_esperado: ('esp' in base && base.esp) || g.esperado,
      idade: g.idade ?? 11,
      origem: 'sintetico' as const,
      tipo: g.tipo,
      grupo: g.grupo,
      ...(conversa ? { conversa } : {}),
    };
  });
}
