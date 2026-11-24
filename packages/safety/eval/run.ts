import { acertou, decidir } from './pipeline';
import type { ModeloDeAvaliacao } from './models';
import { montarRelatorio } from './report';
import type { Relatorio } from './report';
import type { Caso, ResultadoCaso } from './types';

export interface RunOptions {
  /** Casos executados ao mesmo tempo (a execução real chama a API). */
  concorrencia?: number;
}

export async function executar(casos: Caso[], modelo: ModeloDeAvaliacao, opts: RunOptions = {}): Promise<Relatorio> {
  const resultados: ResultadoCaso[] = new Array<ResultadoCaso>(casos.length);
  const limite = Math.max(1, opts.concorrencia ?? 1);
  let proximo = 0;
  const trabalhador = async () => {
    for (let i = proximo++; i < casos.length; i = proximo++) {
      const caso = casos[i]!;
      const veredito = await decidir(caso, modelo.para(caso));
      resultados[i] = { caso, veredito, acertou: acertou(caso.resultado_esperado, veredito) };
    }
  };
  await Promise.all(Array.from({ length: Math.min(limite, casos.length) }, trabalhador));
  return montarRelatorio(modelo.nome, resultados);
}
