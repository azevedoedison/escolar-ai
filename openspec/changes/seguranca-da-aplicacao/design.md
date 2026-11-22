## Decisões
- Variáveis de ambiente validadas com Zod no boot; faltou uma, o processo encerra com erro claro.
- Um arquivo `.env.test` com valores falsos serve só aos testes. Produção nunca lê esse arquivo.
- Logs registram ids, decisão, categoria e latência. Nunca o texto da pergunta ou da resposta.
- Pre-commit (`.githooks/pre-commit`) já bloqueia segredo literal no diff.
