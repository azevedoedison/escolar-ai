## Why
São dois atores com duas entradas: o responsável (pai ou mãe) e a criança. Hoje o responsável só chega ao painel pelo "modo Responsável" dentro do aparelho da criança. O responsável precisa de login próprio, com e-mail e senha, em qualquer aparelho.

## What Changes
- Login direto do responsável por e-mail e senha, com sessão revogável (sair).
- O painel dos pais aceita essa sessão e também a do modo Responsável (que vira um atalho).
- A criança continua como está: primeiro login no aparelho pareado, depois entra direto.

## Capabilities
- Modified: `contas-e-acesso`

## Impact
`supabase/migrations` (`guardian_session`, `guardian_login`, `verify_guardian`), `apps/api` (`POST /guardian/login`, `POST /guardian/logout`), `apps/mobile` (tela de entrada do responsável). Depende do painel dos pais (PR 22) para passar a usar `verify_guardian`.
