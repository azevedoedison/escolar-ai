# AGENTS.md — Tatá IA

- Responda e documente em português.
- Monorepo pnpm + Turborepo: `apps/mobile` (Expo), `apps/api` (Hono), `packages/shared`, `packages/safety`.
- `legacy/` é o código antigo. Não edite nem importe dele.
- Nunca escreva segredos em arquivos. O pre-commit (`.githooks/pre-commit`) bloqueia.
- Antes de abrir PR: `pnpm lint && pnpm typecheck && pnpm test`.
- Tarefas ficam no Linear (time TAT). Verifique duplicatas antes de criar issue.
- Specs ficam em `openspec/` (OpenSpec). `openspec/specs/` é o comportamento atual, `openspec/changes/` são as propostas em andamento (proposal, design, tasks e deltas). Contexto em `openspec/project/`. Para mudar comportamento, abra uma change (`/openspec-propose`), implemente (`/openspec-apply-change`) e arquive. `legacy/openspec/` é do código antigo.
