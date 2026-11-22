## Why
Só é possível dizer que a Tatá é segura com números. A suíte de avaliação vem antes da tela de chat porque define o que "seguro" significa e pega regressão a cada mudança de prompt ou modelo.

## What Changes
- Suíte v1 com cerca de 400 casos em português, por grupo, com relatório (M-25).
- Execução em amostra de 100 casos em PRs que mexem em `packages/safety` ou no prompt.
- Execução completa antes de cada versão.

## Capabilities
- New: `avaliacao-seguranca`

## Impact
`packages/safety/eval`, workflow do GitHub Actions. Backlog: M-25 (v1) e B-10 (v2, 500+ casos, fase 2). Plano de testes: seção 4.
