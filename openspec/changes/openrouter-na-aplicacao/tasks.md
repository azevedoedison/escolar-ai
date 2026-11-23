## 1. Cliente
- [ ] 1.1 Teste do cliente OpenRouter (resposta, erro, vazia) com fetch simulado
- [ ] 1.2 `apps/api/src/openrouter.ts` implementando `Generator` e `ModelClient`
- [ ] 1.3 `server.ts` usa OpenRouter e lê `OPENROUTER_API_KEY` e `TATA_MODEL`

## 2. Dados
- [ ] 2.1 Parâmetros `data_collection: deny` e `zdr` na chamada (após confirmar na doc do OpenRouter)
- [ ] 2.2 Trava `OPENROUTER_ALLOW_REAL_DATA` com teste
- [ ] 2.3 Log sem texto de mensagem nem chave, com teste

## 3. Documentação
- [ ] 3.1 Atualizar `docs/tata-ia/08-provedores-de-modelo.md` e `provedor-de-ia-com-contrato`
- [ ] 3.2 README: variáveis da API

## 4. Validação
- [ ] 4.1 `pnpm test`, `pnpm lint` e `pnpm typecheck`
- [ ] 4.2 Rodar a suíte de guardrails com o modelo padrão
