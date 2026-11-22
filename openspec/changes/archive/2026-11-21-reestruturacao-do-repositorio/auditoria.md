# 05 · Auditoria do código atual e plano de reestruturação

**Data:** 21/11/2026 · **Base:** `main` @ `d296e7f` · **Caminho escolhido pelo Edison:** reestruturar o repositório atual (em vez de começar do zero).

Este documento lista o que está com defeito (com arquivo e linha), o que está fora das boas práticas, o que muda se seguirmos reestruturando, e compara com a opção de base nova. O plano de testes está em [plano-de-testes.md](../../../project/plano-de-testes.md).

Nenhum código foi alterado ainda. Os testes atuais (155, Jest) passam, mas não cobrem as rotas que têm os defeitos mais graves.

---

## 1. Defeitos graves (segurança e privacidade)

| # | Defeito | Onde | Impacto |
|---|---|---|---|
| S1 | **Chat sem autenticação.** `/api/chat` não verifica token. O `childId` vem do corpo da requisição. | `src/web/server.js` (rota `POST /api/chat`) | Qualquer pessoa conversa sem login e grava conversas em nome de qualquer criança. |
| S2 | **Histórico dos pais quebrado e com acesso indevido.** `authenticateParent` grava `req.parentId`, mas as rotas leem `req.parent.id`. Como `req.parent` não existe, o handler lança erro. | `src/auth/parent-auth.js:287` × `src/api/routes/conversations.js` (search, detail, `/:childId/stats`, `/:childId/blocked`, delete) | Pais não conseguem ver o histórico; ao corrigir de forma ingênua, o filtro de dono precisa ser refeito em cada rota. |
| S3 | **Limpeza global.** `DELETE /api/conversations/cleanup` remove conversas antigas de **todas** as famílias. Qualquer pai autenticado dispara a limpeza. | `src/api/routes/conversations.js` (rota `cleanup`) + `src/db/repositories/conversation.js:138` (`deleteOlderThan` sem filtro de família) | Perda de dados de outras famílias. |
| S4 | **XSS armazenado no painel dos pais.** Na tela de conversa, `msg.content` é inserido sem escape. Como a pergunta da criança é guardada como texto bruto, qualquer HTML enviado pela criança é executado no navegador do pai. | `src/web/public/index.html:1310-1316` (`showConversation`) | Execução de script na sessão do pai (roubo de token, ações em nome dele). |
| S5 | **Segredos com valor padrão.** `JWT_SECRET` e `JWT_REFRESH_SECRET` caem para strings fixas se a variável faltar. | `src/auth/child-auth.js:11-12`; `src/auth/parent-auth.js:11` | Quem lê o código forja tokens de pai ou filho se o servidor subir sem `.env`. |
| S6 | **Dados de crianças sem contrato adequado.** Mensagens vão para o OpenRouter e daí para um modelo gratuito de terceiro. | `src/ai/client.js` (`xiaomi/mimo-v2-omni`) | Incompatível com LGPD art. 14 e ECA Digital; sem controle de retenção do provedor. |
| S7 | **CORS aberto e sem cabeçalhos de segurança.** | `src/web/server.js` (`app.use(cors())`) | Qualquer site consome a API com o token do usuário; sem `helmet`, sem CSP. |
| S8 | **Limite de tentativas em memória.** Rate limit de login por IP em `Map`, zerado a cada reinício, e por IP (atrás de proxy, todos caem no mesmo IP). | `src/auth/child-auth.js:20-40` | Brute force do PIN/senha da criança é viável com reinícios ou com proxy. |
| S9 | **Histórico vindo do cliente.** O app manda o `history` inteiro; a API confia nele. | `src/web/server.js` (`...(history || []).slice(-10)`) | Um cliente pode injetar mensagens "do assistente" e contornar regras no prompt. |

## 2. Defeitos funcionais

| # | Defeito | Onde |
|---|---|---|
| F1 | Tela de histórico chama `/api/parent/children/all/conversations`, rota que não existe. A rota real é `/api/conversations/:childId`. | `src/web/public/index.html:1220` |
| F2 | `ASSISTANT` / `USER` (maiúsculas, formato do painel) não batem com o modelo de dados, que guarda `input` e `output` na mesma linha. Não há contrato de resposta definido. | `src/web/public/index.html:1310-1320` × `prisma/schema.prisma` (`Conversation`) |
| F3 | Filtros de guardrail por palavra-chave: `morrer`/`matar` bloqueiam "como morreu Tiradentes?"; `child` bloqueia qualquer frase em inglês. Ao mesmo tempo, grafias alternativas passam. | `src/guardrails/index.js` (listas `BLOCKED_KEYWORDS`, `SENSITIVE_KEYWORDS`) |
| F4 | Resposta de bloqueio é sempre a mesma; sinais de sofrimento não geram alerta aos pais. | `src/guardrails/index.js`; `src/reports/alert-detector.js` não é chamado por nenhuma rota |
| F5 | Retenção configurada pelos pais some a cada reinício. | `src/api/routes/settings.js` (`Map` em memória) |
| F6 | Painel de pais `dashboard.html` é servido por rota, mas o arquivo não existe em `src/web/public/`. | `src/web/server.js` (`/dashboard`) |
| F7 | `/api/chat` ignora `mode` vindo de fora do conjunto (cai no padrão), sem erro. Aceitável, mas sem validação. | `src/web/server.js` |
| F8 | Limite de 500 caracteres de mensagem não é aplicado de forma consistente: `guard-rails.js` (bot) usa 500; `guardrails/index.js` usa 500; o front não avisa. | vários |
| F9 | Resposta de falha da IA é "Ops! Tente novamente", sem distinguir erro de bloqueio. | `src/ai/client.js` (`success: false`) |

## 3. Problemas de estrutura e boas práticas

| # | Problema | Onde | Ação |
|---|---|---|---|
| E1 | **Três implementações de guardrail** (`.js`, `.ts` não compilado, e `bot/guard-rails.js` em CommonJS dentro de projeto ESM). | `src/guardrails/index.js`, `src/guardrails/index.ts`, `src/bot/guard-rails.js` | Manter uma, em TypeScript; remover as outras. |
| E2 | **Mistura de módulos.** `package.json` é `"type": "module"`, mas há `module.exports` e `require` em `src/bot/`. Dependências `whatsapp-web.js`, `qrcode-terminal`, `@capacitor/*` não estão no `package.json`. | `src/bot/*`, `package.json` | Remover o bot (fora do escopo, ver seção 5). |
| E3 | **`new PrismaClient()` em 8 lugares**, inclusive dentro de handlers. Cada requisição abre conexão nova. | `src/api/routes/conversations.js` (3 vezes), `src/db/repositories/*.js` | Um único cliente em `src/db/client.ts`. |
| E4 | **Sem tipagem e sem lint.** `AGENTS.md` pede `npm run lint`, mas o script não existe. | `package.json`, `AGENTS.md` | Adicionar TypeScript estrito, ESLint, Prettier. |
| E5 | **Arquivos gerados commitados**: `coverage/`, `test-results/`, `qrcode.png`, pitch deck binário. | raiz | Remover; `.gitignore` já lista `coverage/`, mas os arquivos continuam no histórico. |
| E6 | **README e AGENTS.md desatualizados.** README aponta para outro repositório (`robertclaw-ia/robert-edison-projects`) e para Fastify/WhatsApp; AGENTS.md cita `src/database/` e `tests/integration/`, que não existem. | `README.md`, `AGENTS.md` | Reescrever. |
| E7 | **Duas fontes de verdade para especificação.** `specs/` e `openspec/changes/` descrevem versões diferentes do produto. | `specs/`, `openspec/` | Escolher uma (sugestão: `openspec/`) e arquivar a outra. |
| E8 | **Front monolítico.** `index.html` tem 1.371 linhas, com CSS, JS e HTML juntos; `innerHTML` com template string em vários lugares. | `src/web/public/index.html` | Substituir pelo app Expo (ver seção 4). |
| E9 | **Sem validação de entrada.** Rotas leem `req.body` direto (ex.: `children.js` valida só presença). | `src/api/routes/*.js` | Zod em cada rota. |
| E10 | **Erros engolidos e logs com conteúdo.** `logger.error('Erro no chat:', error)` e logs com `message.substring(0, 50)` podem registrar trechos de conversa. | `src/web/server.js`, `src/guardrails/index.js` | Log sem conteúdo de mensagem. |
| E11 | **Testes não cobrem o que está em produção.** Os 155 testes cobrem `injection`, `format` e `reports`. Não há teste de rota, de autenticação de pai ou de isolamento entre famílias. | `tests/` | Ver plano de testes. |
| E12 | **Pastas `android/` e `capacitor.config.ts`** de um app que não está instalado. | raiz | Remover; será refeito com Expo. |

---

## 4. O que muda se seguirmos reestruturando (caminho do Edison) × base nova

| Tema | Reestruturar o repo atual | Base nova (recomendação original) |
|---|---|---|
| Tempo até o MVP | Mais longo: cada peça antiga precisa ser entendida, testada e trocada. Estimativa +30% a +50% na fase 1. | Mais curto, porque não há legado para segurar. |
| Risco | Mais risco de herdar defeitos (S1 a S9 estão espalhados). Mitigação: reescrever as rotas de segurança do zero e manter só a camada de dados e os testes de guardrail. | Risco menor de defeito herdado; risco maior de retrabalho de decisões já tomadas. |
| Aproveitamento | Mantém: modelo Prisma (pai, filho, conversa), testes de injection e format, histórico de testes E2E, documentos de política. | Mesmo aproveitamento, mas como referência, não como código. |
| Mobile | Sai o Capacitor e entra o Expo; o front antigo não é aproveitado. | Idem. |
| Dados e banco | Prisma + PostgreSQL pode continuar, mas sem RLS. Supabase exigiria migrar. | Supabase com RLS desde o início. |
| Testes | Precisa cobrir as rotas antes de mudar; é mais trabalho de teste no começo. | Testes escritos junto com cada feature. |

**Recomendação com o caminho escolhido:** seguir reestruturando **sim**, mas com um corte claro:

1. **Manter** `prisma/schema.prisma` (ajustado com o `family_id` e os campos da seção 3.5 da arquitetura), as migrações e os testes de injection/format.
2. **Reescrever** toda a camada de rotas e autenticação, com Zod, RLS por família (ou filtro de dono em cada query), sem valores padrão de segredo.
3. **Trocar** o front por Expo. O HTML antigo vai para `legacy/` e some depois do MVP.
4. **Remover** bot WhatsApp, Android/Capacitor, RAG, Ollama e o código de OpenRouter.
5. **Reescrever** guardrail como camada de classificação (Haiku 5.5), mantendo as palavras-chave só como pré-filtro, com a suíte de avaliação como referência.

Assim o caminho do Edison fica uma reforma guiada, não um conserto. Se preferir base nova, o resultado final é o mesmo; a diferença é o tempo a mais para entender o legado.

## 5. Ordem de trabalho (se aprovado)

| Etapa | Entrega | Critério de pronto |
|---|---|---|
| R0 | Limpeza: remover `coverage/`, `test-results/`, `qrcode.png`, código de bot, Android e Capacitor; corrigir README e AGENTS.md | `npm test` continua verde |
| R1 | TypeScript, ESLint, Prettier, um `PrismaClient`, Zod, `.env` validado no boot | Build e lint passam; app não sobe sem segredos |
| R2 | Autenticação de pai e filho reescrita; `req.parent` unificado; rate limit persistido | Testes de isolamento passam (plano de testes, seção 2) |
| R3 | Rotas de chat e histórico com dono verificado; cleanup por família; escape de conteúdo | Testes S1 a S4 passam |
| R4 | Guardrail em camada de classificação, suíte de avaliação v1 | Métricas de segurança da arquitetura (seção 3.3) |
| R5 | Painel e app Expo | Fluxos E2E passam em web e Android |

Cada etapa tem PR próprio. Nenhuma começa antes da aprovação do plano.

## 6. Perguntas que precisam de resposta do Edison

1. Você aceita remover o bot de WhatsApp e o app Capacitor do repositório? (Recomendo, mas eles saem do escopo da v1.)
2. A base de dados segue no Prisma com PostgreSQL, ou migramos para Supabase já na R2?
