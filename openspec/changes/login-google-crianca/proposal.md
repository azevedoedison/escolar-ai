## Why
A criança que já tem conta Google pode preferir entrar com ela em vez de digitar PIN ou e-mail e senha. O Edison pediu a opção na tela de entrada, ao lado do e-mail e senha. O PIN e o e-mail e senha continuam como caminho principal; o Google é opcional.

## What Changes
- Botão "Entrar com Google" na tela de entrada da criança, só quando a API tem as credenciais do Google.
- Fluxo OAuth 2.0 (código + PKCE) com troca do código na API.
- O responsável vincula o e-mail Google do filho; o login só vale em aparelho já pareado.
- Mesmo contador de tentativas do PIN.

## Capabilities
- Modified: `contas-e-acesso`

## Impact
`supabase/migrations` (colunas `google_email` e `google_sub` em `child`, funções `set_child_google` e `child_login_google`), `apps/api` (`/child/google/config`, `/child/login/google`), `apps/mobile` (botão e `setChildGoogle`). A tela do responsável para vincular o e-mail fica com a change `painel-pais`.
