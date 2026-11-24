## Why
A change `privacidade-e-retencao` deixou pronta a regra no banco (retenção por família, limpeza, exportação, exclusão, auditoria), mas só por RPC com o JWT do Supabase. O painel autentica o responsável por sessão própria da API (login direto ou modo Responsável), então a regra ainda não chega ao responsável. Sem a rota e a tela, o direito do titular (LGPD) existe só no banco.

## What Changes
- Rotas da API para o responsável: ler e mudar a retenção, exportar os dados da família, apagar uma conversa, apagar as conversas de um filho e excluir um filho.
- Funções `api_*` no banco que recebem o responsável autenticado e tiram a família dele; as funções por RPC viram invólucros da mesma regra.
- Tela de privacidade no app: escolha da retenção, exportação e exclusão com segundo toque de confirmação.
- Limites e validação compartilhados (`@tata/shared`).

## Fora do escopo
- Excluir a conta do responsável pela API. O banco já recusa com filhos (`children_linked`), mas o caso sem filhos também apaga o login do segundo responsável. Isso espera decisão do Edison (PR 27). Não há rota.
- Segundo responsável (B-03) e revisão jurídica (B-01).

## Capabilities
- Modified: `privacidade-e-retencao` (ainda em change; os requisitos novos entram como ADDED)

## Impact
`supabase/migrations` (`api_*`, funções internas), `apps/api` (`privacy.ts`, `privacy-store.ts`), `apps/mobile` (`privacy.tsx`, `lib/privacy.ts`), `packages/shared`. Backlog: B-02.
