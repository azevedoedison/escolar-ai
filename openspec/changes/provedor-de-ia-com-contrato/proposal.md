## Why
O código antigo mandava mensagens de crianças ao OpenRouter com um modelo gratuito de terceiro (S6), o que é incompatível com LGPD art. 14 e ECA Digital. A comparação de provedores está em `openspec/project/provedores-de-modelo.md`: nenhum preço de provedor alternativo foi verificado.

## What Changes
- Todas as chamadas de IA com dado real de criança passam por um provedor com contrato de dados e sem treino com as mensagens (Anthropic, Claude Haiku 5.5).
- Camada de IA isolada em `packages/safety`, com interface própria, para trocar de provedor sem mexer no resto.
- Suíte de avaliação e desenvolvimento usam apenas dado sintético, e podem usar outros provedores.
- Limite de gasto mensal na conta da API (sugestão: US$ 20 para a suíte).

## Capabilities
- New: `provedor-de-ia`

## Impact
`packages/safety` (cliente de modelo), configuração da conta de API. Backlog: F0-05 (conta Anthropic e limite), B-07. Arquitetura: seções 3.1 e 3.4.
