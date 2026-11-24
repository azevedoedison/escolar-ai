## Why
O isolamento entre famílias já tinha testes no banco (RLS), mas a API e as funções que o responsável chama por RPC não tinham prova de que recusam dados de outra família. M-06 pede essa prova antes do beta com famílias de fora.

## What Changes
- Testes de isolamento da API contra Postgres de verdade: criança de uma família não lê, não continua e não grava na conversa de outra (ISO-01, 02, 04, 05, 06, 07, 09).
- Testes das funções RPC do responsável com ids de outra família: recusam e não deixam rastro.
- Testes de catálogo: a lista de funções executáveis por usuários finais é fixa e revisada; anon não executa nenhuma; nenhuma coluna de hash ou token é legível.
- Nenhuma mudança de comportamento do produto.

## Capabilities
- Modified: `isolamento-familias`

## Impact
`apps/api/src/isolation.test.ts`, `packages/db/test/rpc-isolation.test.ts`. Backlog: M-06. Plano de testes: ISO-01 a ISO-07 e ISO-09. As rotas de responsável do plano (ISO-01 a ISO-04 como `/api/conversations`) não existem na API nova: o painel lê pelo banco com RLS, coberto por `isolation.test.ts` do banco.
