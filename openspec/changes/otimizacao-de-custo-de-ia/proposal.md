## Why
O custo de IA é pequeno com Haiku 5.5, mas cresce com uso intenso e perguntas complexas podem pedir um modelo maior.

## What Changes
- Cache de prompt do sistema (B-07).
- Avaliar enviar perguntas complexas ao Sonnet 5.5 se o Haiku 5.5 ficar fraco (B-07).
- Limite diário por criança como proteção contra abuso.

## Capabilities
- Modified: `provedor-de-ia`

## Impact
`packages/safety`, `apps/api`. Backlog: B-07. Arquitetura: seção 3.4.
