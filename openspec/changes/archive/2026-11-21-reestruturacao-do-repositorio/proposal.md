## Why
O código antigo (Escolar AI) tinha o chat sem autenticação, histórico dos pais quebrado, exclusão em massa entre famílias, segredos com valor padrão e dados de crianças enviados a um provedor sem contrato (S1 a S9). O Edison decidiu reestruturar o repositório em vez de manter o legado. Esta change registra a decisão. Ela já foi executada nas fases 0 e 1 inicial e fica arquivada como histórico.

## What Changed
- Código antigo movido para `legacy/`, sem edição nem importação a partir dele (F0-02).
- Monorepo pnpm + Turborepo com `apps/mobile`, `apps/api`, `packages/shared`, `packages/safety` (F0-03) e CI (F0-04).
- Novo produto Tatá IA, com a arquitetura em `openspec/project/arquitetura.md`.
- Specs em OpenSpec (esta migração). A pasta `specs/` antiga e `legacy/openspec/` ficam só como referência.

## Documentos de origem
- `diagnostico.md`: avaliação do código atual (21/11/2026).
- `auditoria.md`: defeitos S1 a S9, F1 a F9, E1 a E12 e plano R0 a R5.
- `openspec/project/escolar-ai-rodando-localmente.md`: teste do app antigo rodando em localhost.

## Capabilities
Nenhuma delta aqui; os requisitos vivem em `openspec/specs/` e nas changes ativas.

## Impact
Todo o repositório. Decisões do Edison: reestruturar (em vez de base nova), remover bot de WhatsApp e Capacitor da v1, Supabase com RLS, Claude Haiku 5.5 com esforço `medium`.
