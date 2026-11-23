# Roteiro e2e (fluxos de usuário, em ordem)

Cada passo é um fluxo completo no navegador, com captura de tela. Estados: **pronto** (pode rodar agora), **API** (precisa da API no ar com `OPENROUTER_API_KEY`, `DATABASE_URL`, `CHILD_TOKEN_SECRET`), **DB** (precisa de conta de teste confirmada no Supabase), **falta recurso** (a tela ou rota ainda não existe).

| # | Fluxo | Estado | Motivo / observação |
|---|---|---|---|
| 1 | Cadastro do pai | DB | Cria conta de teste no Supabase; exige confirmação do Edison e, com confirmação de e-mail ligada, clicar no link |
| 2 | Cadastro do filho vinculado ao pai | DB | Precisa do passo 1 e do RPC no Supabase |
| 3 | Login do filho (PIN) | API + DB | Depende do pareamento (passo 9) e da API |
| 4 | Pesquisa de biologia no chat | API | `OPENROUTER_API_KEY` |
| 5 | Pesquisa de matemática com várias interações | API | Mantém o histórico entre mensagens |
| 6 | Mensagem de áudio | falta decisão | Spec `audio-na-pergunta` escrita; depende da aprovação do Edison (voz de criança, dependência) |
| 7 | Pai vê no histórico as buscas e respostas do filho | falta recurso | O painel dos pais é o PR 22, ainda não mesclado |
| 8 | Busca indevida (drogas, machucar alguém) | API | Deve bloquear ou tratar como crise conforme a política em `packages/safety` |
| 9 | Pareamento com código de 6 dígitos (10 min, uso único) | API + DB | Código gerado em `/pairing/new?childId=...`, digitado em `/pair` |
| 10 | Código inválido, expirado ou já usado | API + DB | Mensagens de erro na tela `/pair` |
| 11 | Pai exclui o filho (só o filho some) | DB | Tela `/children` pronta (confirmação `EXCLUIR`); precisa de login e filho de teste |
| 12 | Pai tenta excluir a própria conta com filho ativo (recusado) | DB | Tela `/account` pronta; o banco devolve `children_linked` |
| 13 | Sair e revogar a sessão do aparelho | API + DB | Revogação existe em `/devices` ("Desconectar"); falta botão de sair da conta |
| 14 | Senha errada 5 vezes bloqueia por 15 minutos | API + DB | Regra existe no banco (`guardian_login`); precisa da API para exercitar |
| 15 | Pedido de recuperação de senha aparece como pendente (TAT-57) | parcial | Tela `/forgot` pronta; e-mail inválido testado. Envio real só com e-mail de teste combinado |
| 16 | Fumaça: navegação, rótulos, validação, erro de login falso | pronto | `smoke.spec.ts` e rodada manual com Playwright |
