# Roteiro e2e (fluxos de usuário, em ordem)

Cada passo é um fluxo completo no navegador, com captura de tela. Estados: **pronto** (pode rodar agora), **API** (precisa da API no ar com `OPENROUTER_API_KEY`, `DATABASE_URL`, `CHILD_TOKEN_SECRET`), **DB** (precisa de conta de teste confirmada no Supabase), **falta recurso** (a tela ou rota ainda não existe).

| # | Fluxo | Estado | Motivo / observação |
|---|---|---|---|
| 1 | Cadastro do pai | DB | Cria conta de teste no Supabase; exige confirmação do Edison e, com confirmação de e-mail ligada, clicar no link |
| 2 | Cadastro do filho vinculado ao pai | DB | Precisa do passo 1 e do RPC no Supabase |
| 3 | Login do filho (PIN) | API + DB | Depende do pareamento (passo 9) e da API |
| 4 | Pesquisa de biologia no chat | modelo simulado | Roda no CI com `TATA_MODEL_MOCK=1` (sem chave). Com a chave real, `E2E_FULL=1` |
| 5 | Pesquisa de matemática com várias interações | modelo simulado | Idem; confere as 6 mensagens guardadas na mesma conversa |
| 6 | Mensagem de áudio | falta decisão | Spec `audio-na-pergunta` escrita; depende da aprovação do Edison (voz de criança, dependência) |
| 7 | Pai vê no histórico as buscas e respostas do filho | falta recurso | O painel dos pais é o PR 22, ainda não mesclado |
| 8 | Busca indevida (drogas, machucar alguém) | modelo simulado | Idem; confere o bloqueio na camada de entrada em `safety_event` |
| 9 | Pareamento com código de 6 dígitos (10 min, uso único) | API + DB | Código gerado em `/pairing/new?childId=...`, digitado em `/pair` |
| 10 | Código inválido, expirado ou já usado | API + DB | Mensagens de erro na tela `/pair` |
| 11 | Pai exclui o filho (só o filho some) | DB | Tela `/children` pronta (confirmação `EXCLUIR`); precisa de login e filho de teste |
| 12 | Pai tenta excluir a própria conta com filho ativo (recusado) | DB | Tela `/account` pronta; o banco devolve `children_linked` |
| 13 | Sair e revogar a sessão do aparelho | API + DB | Revogação existe em `/devices` ("Desconectar"); falta botão de sair da conta |
| 14 | Senha errada 5 vezes bloqueia por 15 minutos | API + DB | Regra existe no banco (`guardian_login`); precisa da API para exercitar |
| 15 | Pedido de recuperação de senha aparece como pendente (TAT-57) | parcial | Tela `/forgot` pronta; e-mail inválido testado. Envio real só com e-mail de teste combinado |
| 16 | Fumaça: navegação, rótulos, validação, erro de login falso | pronto | `smoke.spec.ts` e rodada manual com Playwright |

## Modelo simulado (sem chave)

`pnpm --filter @tata/mobile e2e:build && pnpm --filter @tata/mobile e2e` cria o banco `tata_e2e` (Postgres local, `E2E_ADMIN_DATABASE_URL`, padrão `postgres://postgres@localhost:5432/postgres`), sobe a API com `TATA_MODEL_MOCK=1` e serve o app exportado em `localhost:8081`. Os casos 4, 5 e 8 pareiam uma criança sintética pela interface (código de 6 números e PIN) e conversam com o modelo simulado (`apps/api/src/mock-model.ts`). Só o provedor de IA é trocado; API, banco, pareamento, classificadores e registro de segurança são os reais. O CI roda isto no job `e2e`.

Seguem pulados, com motivo: 1 a 3 (conta real do responsável no Supabase e confirmação do Edison), 6 (spec de áudio aguarda decisão) e 7 (painel dos pais, PR 22).
