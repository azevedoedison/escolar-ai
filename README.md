# Tatá IA

IA para crianças e adolescentes, com filtros de segurança, histórico e controle dos pais.
App para celular, tablet e web (Expo), API em Hono e dados no Supabase.

> Em construção. O plano completo está em `docs/tata-ia/` (quando mesclado) e as tarefas ficam no Linear (time TAT).

## Estrutura

| Pasta | O quê |
|---|---|
| `apps/mobile` | App Expo (celular, tablet e web) |
| `apps/api` | API Hono |
| `packages/shared` | Tipos e utilitários compartilhados |
| `packages/safety` | Classificadores e política de segurança |
| `legacy/` | Código antigo do Escolar AI, mantido só para consulta |

## Desenvolvimento

Requer Node 22 e pnpm 10.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

Ative o hook que bloqueia segredo literal: `git config core.hooksPath .githooks`.
Nunca coloque chaves em arquivos; use variáveis de ambiente.

## Banco de dados

Migrações em `supabase/migrations/` (Postgres + RLS). Os testes de `packages/db` criam um banco temporário
e precisam de um Postgres acessível em `DATABASE_URL` (padrão `postgres://postgres@localhost:5432/postgres`, usuário com permissão de criar bancos).

## Variáveis do app

`apps/mobile` lê `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` (valores públicos do projeto Supabase) do ambiente. Não escreva valores em arquivos versionados.

## Login da criança com Google (opcional)

O botão "Entrar com Google" só aparece quando a API tem as três variáveis abaixo. Sem elas, ele fica desligado
(`GET /child/google/config` devolve `enabled: false`) e o PIN e o e-mail e senha seguem funcionando.

| Variável | Onde | Valor |
|---|---|---|
| `GOOGLE_CLIENT_ID` | API | ID do cliente OAuth |
| `GOOGLE_CLIENT_SECRET` | API | Segredo do cliente OAuth (nunca vai para o app nem para arquivos) |
| `GOOGLE_REDIRECT_URIS` | API | Redirecionamentos permitidos, separados por vírgula. Para o app: `tataia://google` |
| `EXPO_PUBLIC_GOOGLE_REDIRECT_URI` | app | Opcional. Sobrescreve o redirecionamento padrão `tataia://google` (esquema `tataia` em `apps/mobile/app.json`). Precisa estar em `GOOGLE_REDIRECT_URIS` |

Passo a passo no Google Cloud:

1. Em [console.cloud.google.com](https://console.cloud.google.com), crie ou escolha um projeto.
2. **APIs e serviços › Tela de consentimento OAuth**: configure o app (nome Tatá IA) e adicione os escopos `openid` e `email`. Em teste, inclua as contas Google de teste.
3. **APIs e serviços › Credenciais › Criar credenciais › ID do cliente OAuth**, tipo **Aplicativo da Web**.
4. Em **URIs de redirecionamento autorizados**, informe o mesmo valor de `GOOGLE_REDIRECT_URIS`. Se o Google recusar o esquema `tataia://`, use um endereço `https` seu que redirecione para o app e coloque-o nas duas variáveis.
5. Copie o ID e o segredo para o ambiente da API (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
6. No app, o responsável informa o e-mail Google do filho; só essa conta entra, e só em aparelho já pareado.

Detalhes e decisões em `openspec/changes/login-google-crianca/design.md`.
