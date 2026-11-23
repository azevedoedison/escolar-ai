## Why
Decisão do Edison (23/11/2026): o chat e as buscas da aplicação usam o LLM via OpenRouter; a Anthropic fica só para desenvolvimento (agentes, suíte paga de avaliação). Hoje `apps/api/src/anthropic.ts` chama a Anthropic direto, com `ANTHROPIC_API_KEY`. Isso conflita com `docs/tata-ia/08-provedores-de-modelo.md` e com a change `provedor-de-ia-com-contrato`, que mantêm o Haiku 5.5 em produção e vetam dado real de criança com provedor sem contrato.

## What Changes
- Novo cliente OpenRouter na API, atrás da mesma interface `Generator` e `ModelClient`; troca por variável de ambiente.
- Chave `OPENROUTER_API_KEY`; modelo por `TATA_MODEL`, padrão `xiaomi/mimo-v2.6-flash`.
- Regra de dados: com dado sintético e de teste, qualquer rota; com dado real de criança, só com a trava de dados liberada (ver design).
- Atualização do doc 08 e da change `provedor-de-ia-com-contrato` para refletir a decisão.

## Capabilities
- Modified: `provedor-de-ia`

## Impact
`apps/api/src` (novo `openrouter.ts`, `server.ts`), docs. Não mexe em prompts, classificadores nem no app mobile. Relaciona-se ao defeito S6 da auditoria (`docs/tata-ia/05`).
