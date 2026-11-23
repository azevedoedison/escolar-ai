## Why
O responsável que esquece a senha não tem como entrar de novo. Falta o pedido de recuperação (roteiro e2e, passo 15; TAT-57).

## What Changes
- Tela `/forgot` com campo de e-mail e botão "Enviar link de recuperação".
- Chamada ao recurso de recuperação de senha do Supabase Auth.
- Link "Esqueci minha senha" no login.
- O app mostra sempre a mesma mensagem ("Se o e-mail existir, enviamos o link"), sem revelar quais e-mails têm conta.

## Capabilities
- New: `recuperacao-de-senha`

## Impact
`apps/mobile` (tela e `lib/auth.ts`). Exige que o e-mail de recuperação esteja ligado no projeto Supabase; a tela de nova senha (link do e-mail) fica fora desta change.
