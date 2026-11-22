## Decisões
- Fluxo: o app abre a tela do Google (`expo-auth-session`, código + PKCE) e entrega `code`, `codeVerifier` e `redirectUri` à API. A API troca o código no endpoint do Google com o segredo do cliente e confere as declarações do ID token (emissor, audiência, validade, `email_verified`). O segredo nunca vai para o app.
- A assinatura do ID token não é reconferida porque ele vem direto do endpoint do Google por TLS, como a documentação do Google permite.
- O `redirectUri` precisa estar na lista `GOOGLE_REDIRECT_URIS`; qualquer outro é recusado sem chamar o Google.
- Quem pode entrar: o responsável informa o e-mail Google do filho (`set_child_google`). No primeiro login o `sub` (id estável da conta) fica gravado e passa a valer no lugar do e-mail, porque e-mail pode mudar de dono. Trocar o e-mail zera o `sub`; e-mail nulo desvincula. O mesmo e-mail não vincula dois filhos.
- Sem vínculo, nenhuma conta Google entra: criança de outra família ou conta qualquer não abre sessão.
- Só em aparelho pareado, com a mesma sessão (12 h), mesmo token do chat e mesmo contador de tentativas do PIN (6 erros em 5 min, bloqueio de 15 min). Falha na troca com o Google (código expirado) não conta no contador.
- O `sub` não é legível pelo papel `authenticated`; o responsável lê só `google_email`.

## Configuração (variáveis de ambiente da API)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URIS` (lista separada por vírgula).
- Faltando qualquer uma, o botão fica desligado (`GET /child/google/config` devolve `enabled: false`) e a rota de login responde 404.
- No app, `EXPO_PUBLIC_GOOGLE_REDIRECT_URI` sobrescreve o redirecionamento padrão (`tataia://google`).
- No Google Cloud: tela de consentimento com escopos `openid` e `email`, cliente OAuth do tipo Web com o(s) redirecionamento(s) acima.

## Limite conhecido
Contas Google de menores são geridas pelo Family Link; o login funciona com o e-mail dessa conta, mas a gestão da conta continua com o Google.
