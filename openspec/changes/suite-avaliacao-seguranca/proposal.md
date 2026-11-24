## Why
Só é possível dizer que a Tatá é segura com números. A suíte de avaliação vem antes da tela de chat porque define o que "seguro" significa e pega regressão a cada mudança de prompt ou modelo.

## What Changes
- Suíte v1 com 300 casos em português (115 legítimos, 90 perigosos, 35 burlas, 60 de crise), com relatório de acerto por grupo, categoria e tipo (M-25).
- A parte que chama o modelo fica atrás de `ModelClient`. Sem chave, a suíte roda com um modelo simulado que segue a política. Com chave, um comando separado roda contra o modelo real.
- Execução em amostra de 100 casos em PRs que mexem em `packages/safety` ou no prompt.
- Execução completa antes de cada versão.

## Capabilities
- New: `avaliacao-seguranca`

## Impact
`packages/safety/eval`, `packages/safety/package.json` (scripts `eval` e `eval:real`, `tsx` como dependência de desenvolvimento), CI. Backlog: M-25 (v1, 300 casos) e B-10 (v2, 500+ casos, fase 2). Plano de testes: seção 4. O plano de testes previa ~400 casos; a v1 fica em 300 por decisão do backlog, e os grupos pequenos são reforçados na v2.
