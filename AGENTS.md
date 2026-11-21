# AGENTS.md — Tatá IA

- Responda e documente em português.
- Monorepo pnpm + Turborepo: `apps/mobile` (Expo), `apps/api` (Hono), `packages/shared`, `packages/safety`.
- `legacy/` é o código antigo. Não edite nem importe dele.
- Nunca escreva segredos em arquivos. O pre-commit (`.githooks/pre-commit`) bloqueia.
- Antes de abrir PR: `pnpm lint && pnpm typecheck && pnpm test`.
- Tarefas ficam no Linear (time TAT). Verifique duplicatas antes de criar issue.
