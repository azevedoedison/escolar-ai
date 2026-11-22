## Why
O valor para os pais é ver tudo o que a criança perguntou e receber alerta de verdade em situação de risco. No código antigo o histórico estava quebrado e nenhum alerta era enviado (S2, F4).

## What Changes
- Linha do tempo por filho, com categoria e decisão (M-30).
- Filtros por data, só bloqueadas, só alertas, e busca por texto (M-31).
- Alertas de crise por push e e-mail (M-32).
- Configurações: rigor, modo Lição de Casa, limite diário (M-33).
- Fase 2: botão "isso era para a escola" (B-05) e resumo semanal por e-mail (B-06).

## Capabilities
- New: `painel-pais`

## Impact
`apps/mobile` (modo Responsável), `apps/api`, `supabase` (`alert`, `family_settings`), Expo Push e Resend. Backlog: M-30 a M-33, B-05, B-06. Arquitetura: seção 3.6.
