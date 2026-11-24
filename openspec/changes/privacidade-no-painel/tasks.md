## 1. Banco
- [x] 1.1 Funções internas com família e ator; RPC antigo vira invólucro
- [x] 1.2 Funções `api_*` que recebem o responsável, sem grant para `authenticated`

## 2. API
- [x] 2.1 `GET` e `PUT /guardian/privacy/retention`
- [x] 2.2 `GET /guardian/privacy/export` (download JSON, auditado)
- [x] 2.3 `DELETE` de conversa, das conversas de um filho e de um filho (com confirmação)
- [x] 2.4 Testes de rota (401, 400, 404 igual) e de banco real com duas famílias

## 3. App
- [x] 3.1 Tela de privacidade: retenção, exportar, apagar conversas, excluir filho com segundo toque
- [ ] 3.2 Link para a tela a partir da home/painel (depende das telas do PR 22 e do PR 29)

## 4. Em aberto (decisão do Edison)
- [ ] 4.1 Rota de exclusão da conta do responsável sem filhos, que hoje apagaria também o login do segundo responsável (PR 27)
