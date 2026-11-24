## 1. Banco
- [x] 1.1 Tabela `guardian_email_token` (RLS que recusa tudo) e coluna `guardian.email_confirmed_at` (contas existentes confirmadas)
- [x] 1.2 Funções `guardian_confirm_request`, `guardian_confirm_email`, `guardian_password_reset_request`, `guardian_password_reset`
- [x] 1.3 `guardian_login` e `guardian_mode_enter` recusam e-mail não confirmado
- [x] 1.4 Testes de banco: uso único, expiração, token inválido, pedido novo invalida o anterior, limite de pedidos, senha curta, sessões encerradas, auditoria, isolamento

## 2. API
- [x] 2.1 Interface `Mailer` e versão simulada que imprime o link
- [x] 2.2 Rotas `POST /guardian/email/confirm`, `/guardian/email/resend`, `/guardian/password/forgot`, `/guardian/password/reset`
- [x] 2.3 Testes de API (resposta igual para conta existente ou não, limite, link usado, ponta a ponta com banco real)

## 3. App
- [x] 3.1 Validações no `packages/shared`
- [x] 3.2 Telas "Esqueci a senha", "Nova senha" e "Confirmar e-mail", link no login e envio da confirmação após o cadastro

## 4. Depois (fora desta change)
- [ ] 4.1 Provedor real de e-mail (Resend) implementando `Mailer`
- [ ] 4.2 Deep link do e-mail para o app
