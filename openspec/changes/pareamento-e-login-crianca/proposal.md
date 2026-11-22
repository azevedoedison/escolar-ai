## Why
O responsável já cadastra filhos (M-03), mas a criança ainda não consegue usar o aparelho dela. Sem pareamento e login por PIN não existe chat para a criança, e sem proteção do modo Responsável a criança poderia abrir o painel.

## What Changes
- Pareamento do aparelho da criança por código de 6 dígitos ou QR (M-04).
- Login da criança por PIN, sem e-mail (M-04).
- Troca para o modo Responsável protegida pela senha do responsável (M-05).
- Lista de aparelhos pareados com botão "desconectar" (M-34).

## Capabilities
- Modified: `contas-e-acesso`

## Impact
`supabase/migrations` (tabela `device`, códigos de pareamento), `apps/api` (rotas de pareamento e login), `apps/mobile` (telas). Backlog: M-04, M-05, M-34. Arquitetura: seção 3.2.
