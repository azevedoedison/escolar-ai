## Why
O código antigo tinha segredos com valor padrão, CORS aberto, sem cabeçalhos de segurança e logs com trechos de conversa (S5, S7, E10). A fundação nova precisa nascer sem isso.

## What Changes
- Segredos obrigatórios, sem valor padrão; a API não sobe sem eles (M-43).
- CORS restrito às origens do produto (M-43).
- Cabeçalhos de segurança (M-43).
- Logs sem conteúdo de mensagem (M-43).
- Validação de entrada com Zod em toda rota.

## Capabilities
- New: `seguranca-da-aplicacao`

## Impact
`apps/api`, `packages/shared`. Backlog: M-43. Plano de testes: ISO-08 e ISO-09.
