## Why
O pré-filtro (M-21) e o classificador de saída (M-23) existem, mas ainda falta a decisão principal: classificar a pergunta da criança por categoria, intenção e risco, com a política revisada pelo Edison, e registrar cada decisão. Sem isso a Tatá não decide nada sobre o conteúdo da pergunta.

## What Changes
- Documento de política por categoria, revisado pelo Edison (M-20).
- Classificador de entrada com saída estruturada (M-22).
- Registro de `safety_event` para toda decisão de toda camada (M-26).
- Limite de uso persistido no banco (pendência do M-21).

## Capabilities
- New: `guardrails-entrada`
- Modified: `guardrails-pre-filtro`

## Impact
`packages/safety`, `apps/api`, `supabase/migrations` (`safety_event`, contador de uso). Backlog: M-20, M-22, M-26. Arquitetura: seção 3.3.
