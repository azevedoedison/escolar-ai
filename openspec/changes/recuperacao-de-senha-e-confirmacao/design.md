## Decisões
- **Token**: 32 bytes aleatórios (`_new_token`), enviado só no link. No banco fica só o hash SHA-256, como nas outras sessões. Uso único (`used_at`) e com expiração: 1 hora para redefinir senha, 24 horas para confirmar e-mail. Um pedido novo do mesmo tipo invalida os anteriores.
- **Resposta sempre igual**: "esqueci a senha" e "reenviar confirmação" respondem `202` com o mesmo texto exista a conta ou não, para não revelar quais e-mails têm conta. Falha de envio é registrada em log e não muda a resposta.
- **Limite de pedidos**: 3 pedidos por e-mail por hora e 20 por origem por hora (`attempt_counter`). Passou do limite, o pedido é ignorado em silêncio (mesma resposta). Link inválido ou vencido conta como erro por origem: 10 em 10 minutos bloqueiam por 15.
- **E-mail confirmado**: coluna `guardian.email_confirmed_at`. Contas existentes são marcadas como confirmadas na migração (não trancar quem já usa). `guardian_login` e `guardian_mode_enter` respondem `unconfirmed` quando está vazio. A resposta de `unconfirmed` só é dada depois de a senha conferir, então não revela se o e-mail existe.
- **Redefinição também confirma**: quem recebe o link de redefinição provou que controla o e-mail, então `email_confirmed_at` é preenchido se ainda estiver vazio.
- **Troca de senha**: grava `bcrypt` em `auth.users.encrypted_password` (a mesma senha que `guardian_login` confere), apaga `guardian_session`, `guardian_mode_session` e, se existir, `auth.sessions` do usuário. Zera o contador de bloqueio do login. Sessões de criança não mudam: o PIN delas é independente.
- **Senha nova**: mínimo de 8 caracteres, igual ao cadastro (`validateNewPassword` no `packages/shared`, e a função SQL também confere).
- **Segurança**: tabela com RLS que recusa tudo e funções `security definer` com `revoke ... from public`, como `guardian_session`. Só a API (service role) chama. O token nunca vai para `audit_log` nem para log da API; só o endereço do destinatário aparece no log do `Mailer` simulado.
- **Mailer**: `interface Mailer { send({ to, subject, text }) }`. `createConsoleMailer()` imprime o link. Em produção o servidor avisa na inicialização que o envio está simulado. O link usa `APP_BASE_URL` (padrão `http://localhost:8081`).
- **Cadastro e Supabase**: o cadastro continua em `supabase.auth.signUp`. Esta change assume que "Confirm email" do Supabase fica desligado, para o app receber a sessão e chamar `register_guardian`. A confirmação é a nossa, na tabela `guardian`. Quem tem sessão do Supabase mas ainda não confirmou não abre o painel (a API recusa) e o app o desconecta ao receber `unconfirmed`.
- **Custo de IA**: nenhum.

## Pendente de decisão do Edison
- Provedor real de e-mail e remetente (Resend está no plano). Quando decidir, basta implementar `Mailer`.
- Domínio do link (`APP_BASE_URL`) e se o link abre o app (deep link) ou uma página web.
- Textos finais dos e-mails.
- Os prazos (1 h e 24 h) e os limites de pedido são padrões razoáveis, fáceis de mudar.
