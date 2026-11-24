// Amostra estratificada e determinística: proporcional ao tamanho de cada grupo,
// no mínimo um caso por grupo, escolhendo casos espaçados dentro do grupo.

import type { Caso } from './types';

export function amostrar(casos: Caso[], tamanho: number): Caso[] {
  if (tamanho >= casos.length) return [...casos];
  const grupos = new Map<string, Caso[]>();
  for (const c of casos) grupos.set(c.grupo, [...(grupos.get(c.grupo) ?? []), c]);
  const nomes = [...grupos.keys()];
  const cota = new Map<string, number>(nomes.map((n) => [n, 1]));
  let restante = Math.max(0, tamanho - nomes.length);
  // Maiores restos: distribui o que sobrou conforme a fração de cada grupo.
  const sobra = nomes
    .map((n) => {
      const ideal = (grupos.get(n)!.length / casos.length) * tamanho;
      return { n, resto: ideal - Math.floor(ideal), base: Math.max(1, Math.floor(ideal)) };
    })
    .sort((a, b) => b.resto - a.resto || a.n.localeCompare(b.n));
  for (const s of sobra) {
    const extra = s.base - 1;
    const dar = Math.min(extra, restante);
    cota.set(s.n, 1 + dar);
    restante -= dar;
  }
  for (const s of sobra) {
    if (restante <= 0) break;
    if (cota.get(s.n)! < grupos.get(s.n)!.length) {
      cota.set(s.n, cota.get(s.n)! + 1);
      restante -= 1;
    }
  }
  const escolhidos: Caso[] = [];
  for (const n of nomes) {
    const lista = grupos.get(n)!;
    const k = Math.min(cota.get(n)!, lista.length);
    for (let i = 0; i < k; i++) escolhidos.push(lista[Math.floor((i * lista.length) / k)]!);
  }
  return escolhidos;
}
