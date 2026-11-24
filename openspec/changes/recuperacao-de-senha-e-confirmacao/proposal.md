## Why
O cadastro do responsável (M-02) e o login (M-05) existem, mas faltam dois fluxos básicos: confirmar que o e-mail é do dono da conta e recuperar a senha esquecida. Sem o primeiro, qualquer pessoa cria conta com o e-mail de outra. Sem o segundo, quem esquece a senha perde o acesso ao painel. Linear TAT-57.

## What Changes
- Confirmação de cadastro: depois de criar a conta, o responsável recebe um e-mail com link de uso único. Enquanto não confirmar, o login é recusado.
- "Esqueci a senha": o responsável informa o e-mail e recebe, se a conta existir, um link de uso único que vale por 1 hora. A resposta é sempre a mesma.
- A troca de senha encerra todas as sessões do responsável (login direto, modo Responsável e sessões do Supabase Auth).
- Confirmações, pedidos e trocas de senha entram em `audit_log`.
- Envio de e-mail por uma interface `Mailer`. Nesta change só existe a versão simulada, que imprime o link no console. O provedor real (Resend, previsto no plano) fica para outra change.

## Capabilities
- Modified: `contas-e-acesso`

## Impact
`supabase/migrations` (tabela `guardian_email_token`, coluna `guardian.email_confirmed_at`, funções de confirmação e redefinição, `guardian_login` e `guardian_mode_enter` passam a exigir e-mail confirmado), `apps/api` (`Mailer`, quatro rotas em `/guardian`), `packages/shared` (validações), `apps/mobile` (telas "Esqueci a senha", "Nova senha" e "Confirmar e-mail"). Fecha o TAT-57.
