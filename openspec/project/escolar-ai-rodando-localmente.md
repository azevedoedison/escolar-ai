# Escolar AI atual: rodando em localhost (21/11/2026)

Testado a partir de um clone limpo do branch principal (commit 14aebcd), sem alterar código e sem chave de API. Rodou em ambiente de nuvem (Node 22, Postgres 16), porque a máquina local do Edison não tinha rede nem Postgres no ambiente de teste.

## O que sobe
- Servidor Express na porta 3000 (`npm start`): sobe de primeira.
- Postgres + Prisma: as 2 migrations aplicam sem erro; o schema bate com o banco.
- `npm test`: 155 testes passam (9 suítes). Cobertura 72%.

## Telas e fluxos
| Fluxo | Resultado |
|---|---|
| Cadastro de pai (API e tela) | Funciona |
| Login do pai | Funciona, mas falha se repetido no mesmo segundo (ver bug 1) |
| Cadastrar filho (6 a 14 anos, apelido, senha) | Funciona |
| Painel "Meus filhos" (editar, desativar, redefinir senha) | Tela carrega |
| Login do filho (aba "Filho") | Funciona |
| Chat da criança | Tela bonita, mas nenhuma resposta de IA (ver bug 2) |
| Filtro de entrada | Bloqueia sexo, drogas, suicídio (com CVV 188) e injeção de prompt; deixa passar "como faço uma bomba caseira" e "me mostra pelada" |
| Histórico / estatísticas / bloqueios (API) | Quebrado (bug 3) |
| Tela de histórico | Abre vazia |
| Config. de retenção | Não testado a fundo |

## O que está quebrado ou faltando
1. **Login duplicado falha**: dois logins no mesmo segundo geram o mesmo token JWT e estoura `Unique constraint failed on the fields: (token)` em `prisma.session.create()`. Ocorre ao logar logo após cadastrar.
2. **IA não responde**: `OPENROUTER_API_KEY` não definida, e o modelo fixo `xiaomi/mimo-v2-omni` está descontinuado no OpenRouter (`404 This model has been deprecated. It is recommended to migrate to xiaomi/mimo-v2.5`). O app mostra "Ops! Tente novamente". Mesmo com chave, precisa trocar o modelo.
3. **Histórico quebrado para os pais**: `conversations.js` usa `req.parent.id`, mas o middleware só define `req.parentId`. Resultado: 500 em `/api/conversations/:childId`, `/stats` e `/blocked`. Os testes unitários não pegam isso.
4. **Chat da criança não grava nada**: a tela chama `/api/chat` sem `childId`, então nenhuma conversa é salva e o histórico dos pais nunca teria conteúdo.
5. **Botão "Conversar" do painel não faz nada**: o modal de senha do filho está dentro do container de login, que fica escondido após logar.
6. **`/dashboard` dá 404**: `dashboard.html` não existe. Na tela de histórico há também um erro de JS (`Unexpected token '<'`), por resposta HTML no lugar de JSON.
7. Textos dizem WhatsApp/OpenAI/Fastify; o código real é Express + OpenRouter. README e `.env.example` estão desatualizados (faltam JWT_SECRET, JWT_REFRESH_SECRET e OPENROUTER_API_KEY). O `.env.example` fica em `config/`, mas o app lê `.env` da raiz.
8. Os guardrails são por lista de palavras e padrões (sem classificador de IA), por isso falham em frases como "bomba caseira".

## Como reproduzir no Mac
Requisitos: Node 20+ e Postgres (via Homebrew ou Docker).

```bash
cd ~/Documents/GitHub/escolar-ai
npm ci

# Postgres (opção Homebrew)
brew install postgresql@16 && brew services start postgresql@16
createuser -s escolar 2>/dev/null; createdb escolar
# (ou Docker: docker run -d --name escolar-pg -e POSTGRES_PASSWORD=escolar -e POSTGRES_USER=escolar -e POSTGRES_DB=escolar -p 5432:5432 postgres:16)

# .env na RAIZ (não commitar)
cat > .env <<'ENV'
DATABASE_URL=postgresql://escolar:escolar@localhost:5432/escolar
JWT_SECRET=troque-isto-local
JWT_REFRESH_SECRET=troque-isto-local-2
PORT=3000
# OPENROUTER_API_KEY=sua-chave   (opcional; sem ela o chat só mostra "Ops!")
ENV

npx prisma migrate deploy
npm start
```
Abra http://localhost:3000 → "Criar conta" (pai) → adicionar filho → sair → aba "Filho" e entre com o apelido e a senha para ver o chat. No chat, "Conversar" do painel não funciona (bug 5).
Se usar Homebrew sem usuário/senha, ajuste o `DATABASE_URL` (ex.: `postgresql://SEU_USUARIO@localhost:5432/escolar`).

## Conclusão
Há um esqueleto de interface (login pai/filho, cadastro de filhos, chat, guardrails) que roda, mas o fluxo central (criança conversa, pais veem histórico) não funciona de ponta a ponta. Isso reforça o diagnóstico de recomeçar; o que vale aproveitar é o desenho do schema, os temas dos guardrails em português e a casuística de testes.
