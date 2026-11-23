## 1. Banco e API
- [x] 1.1 Tabela `guardian_session` com RLS que recusa tudo, e funções `guardian_login`, `verify_guardian_session`, `guardian_logout`, `verify_guardian`
- [x] 1.2 Rotas `POST /guardian/login` e `POST /guardian/logout`
- [x] 1.3 Testes de banco e de API (bloqueio, e-mail desconhecido, sessão vencida, revogação)

## 2. App
- [x] 2.1 A entrada do responsável também faz o login na API

## 3. Painel dos pais
- [ ] 3.1 Painel passa a validar com `verify_guardian` (depende do PR 22)
