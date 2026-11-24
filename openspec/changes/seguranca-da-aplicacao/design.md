## Decisões
- Variáveis de ambiente validadas com Zod no boot; faltou uma, o processo encerra com erro claro.
- Um arquivo `.env.test` com valores falsos serve só aos testes. Produção nunca lê esse arquivo.
- Logs registram ids, decisão, categoria e latência. Nunca o texto da pergunta ou da resposta.
- Pre-commit (`.githooks/pre-commit`) já bloqueia segredo literal no diff.
- O segredo dos tokens se chama `CHILD_TOKEN_SECRET` (o plano de testes citava `JWT_SECRET`, nome do código antigo). Exige 32 caracteres ou mais.
- `CORS_ORIGINS` é uma lista separada por vírgulas. Sem ela, nenhuma origem de navegador é aceita. Apps nativos não enviam `Origin`.
- Cada requisição gera uma linha de log com método, rota (o padrão, como `/conversations/:id`), status e latência. Erro inesperado registra só o tipo do erro: a mensagem pode carregar texto da conversa.
