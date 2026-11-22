# Revisão automática de PRs

Cada PR aberto ou atualizado recebe um comentário de revisão feito por IA
(workflow `.github/workflows/claude-review.yml`).

- Usa o OpenRouter; segredo `OPENROUTER_API_KEY` em Settings > Secrets and variables > Actions.
- Modelo padrão: `deepseek/deepseek-chat`. Para trocar, crie a variável de Actions `REVIEW_MODEL`.
- O comentário é atualizado a cada push, não duplicado.
- PRs de forks e rascunhos são ignorados.
- As sugestões são automáticas: confirme antes de agir.
