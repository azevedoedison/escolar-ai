// Linha de comando da suíte.
//   pnpm --filter @tata/safety eval                  → simulado, suíte completa, sem chave
//   pnpm --filter @tata/safety eval --amostra=100    → amostra estratificada de 100 casos
//   ANTHROPIC_API_KEY=... pnpm --filter @tata/safety eval:real   → modelo real (custa dinheiro)
// Sai com código 1 se alguma meta de aceite falhar.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CASOS } from './cases';
import { DEFAULT_REAL_MODEL, anthropic, simulado } from './models';
import type { ModeloDeAvaliacao } from './models';
import { emMarkdown } from './report';
import { executar } from './run';
import { amostrar } from './sample';

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k!, v ?? 'true'] as const;
  }),
);

async function main(): Promise<number> {
  const real = args.get('modelo') === 'real';
  let modelo: ModeloDeAvaliacao = simulado;
  if (real) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('Execução real exige ANTHROPIC_API_KEY no ambiente. A chave nunca é lida de arquivo.');
      return 2;
    }
    modelo = anthropic({ apiKey, model: args.get('modelo-id') ?? process.env.EVAL_MODEL ?? DEFAULT_REAL_MODEL });
  }
  const n = Number(args.get('amostra') ?? 0);
  const casos = n > 0 ? amostrar(CASOS, n) : CASOS;
  const relatorio = await executar(casos, modelo, { concorrencia: real ? 4 : 1 });

  const md = emMarkdown(relatorio);
  const saida = args.get('saida');
  if (saida) {
    mkdirSync(saida, { recursive: true });
    writeFileSync(join(saida, 'relatorio.md'), md);
    writeFileSync(join(saida, 'relatorio.json'), JSON.stringify(relatorio, null, 2));
    console.log(`Relatório gravado em ${saida}`);
  } else {
    console.log(md);
  }
  if (!real) {
    console.log('Aviso: modelo simulado. Valida o encanamento e a política, não mede a qualidade de um modelo.');
  }
  return relatorio.aprovado ? 0 : 1;
}

process.exit(await main());
