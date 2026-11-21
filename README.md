# Tatá IA

IA para crianças e adolescentes, com filtros de segurança, histórico e controle dos pais.
App para celular, tablet e web (Expo), API em Hono e dados no Supabase.

> Em construção. O plano completo está em `docs/tata-ia/` (quando mesclado) e as tarefas ficam no Linear (time TAT).

## Estrutura

| Pasta | O quê |
|---|---|
| `apps/mobile` | App Expo (celular, tablet e web) |
| `apps/api` | API Hono |
| `packages/shared` | Tipos e utilitários compartilhados |
| `packages/safety` | Classificadores e política de segurança |
| `legacy/` | Código antigo do Escolar AI, mantido só para consulta |

## Desenvolvimento

Requer Node 22 e pnpm 10.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

Ative o hook que bloqueia segredo literal: `git config core.hooksPath .githooks`.
Nunca coloque chaves em arquivos; use variáveis de ambiente.

## Banco de dados

Migrações em `supabase/migrations/` (Postgres + RLS). Os testes de `packages/db` criam um banco temporário
e precisam de um Postgres acessível em `DATABASE_URL` (padrão `postgres://postgres@localhost:5432/postgres`, usuário com permissão de criar bancos).
