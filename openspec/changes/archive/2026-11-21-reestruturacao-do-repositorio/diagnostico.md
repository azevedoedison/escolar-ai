# 01 · Diagnóstico do código atual (escolar-ai)

**Data:** 21/11/2026 · **Base analisada:** commit `d296e7f` (branch `main`, último commit em 26/04/2026)

## Resumo em uma frase

O repositório tem boas intenções e alguns pedaços aproveitáveis, mas é a soma de várias direções que nunca foram fechadas (bot de WhatsApp, web em Express, app Android via Capacitor, RAG na Cloudflare, Ollama local, OpenRouter) e o fluxo principal, a criança conversando com a IA, **não está protegido por autenticação nem ligado corretamente ao histórico dos pais**. A recomendação é **recomeçar a base de código** reaproveitando ideias, testes de guardrail e textos, e não tentar consertar a estrutura atual.

## O que existe hoje

| Área | Situação |
|---|---|
| Backend | Express (`src/web/server.js`), Prisma + PostgreSQL, JWT próprio, bcrypt |
| IA | `src/ai/client.js` chama **OpenRouter** com o modelo `xiaomi/mimo-v2-omni`; existe também `src/ai/ollama.js` (local) sem uso |
| Guardrails | Três implementações diferentes: `src/guardrails/index.js` (usada), `src/guardrails/index.ts` (TS não compilado) e `src/bot/guard-rails.js` (CommonJS, do bot) |
| Front | Um único `index.html` de 1.371 linhas com chat + login + painel dos pais, mais `history.html` |
| Mobile | Projeto Android do Capacitor commitado (`android/`), mas `@capacitor/*` não está no `package.json`; não há iOS |
| WhatsApp | `src/bot/` importa `whatsapp-web.js` e `qrcode-terminal`, que também não estão no `package.json` |
| Testes | 155 testes Jest passam (camadas de injection, formato, relatórios). O motor de guardrails que roda em produção (`src/guardrails/index.js`) **não é coberto** pelos testes unitários |
| Docs | Muitos specs (`specs/`, `openspec/`), plano de negócio, pitch deck, política de privacidade. Boa parte descreve um produto (WhatsApp + Fastify + Redis) que não é o que está no código |

## Problemas críticos (bloqueiam qualquer uso real)

1. **O chat não exige login.** `POST /api/chat` aceita qualquer requisição e recebe o `childId` no corpo. Qualquer pessoa pode conversar sem conta, e qualquer um pode gravar conversas no histórico de outra criança informando um `childId` alheio. O token da criança nunca é verificado nessa rota.
2. **O histórico dos pais está quebrado.** `authenticateParent` grava `req.parentId`, mas as rotas de conversas leem `req.parent.id` (que não existe). Na prática, ver histórico, estatísticas, bloqueios e detalhes devolve 404 ou erro 500.
3. **Exclusão em massa entre famílias.** `DELETE /api/conversations/cleanup` apaga conversas antigas de **todas** as famílias, não só as do pai logado.
4. **Segredos com valor padrão.** `JWT_SECRET` cai para `'dev-secret-change-in-production'` se a variável não existir. Se o servidor subir sem `.env`, qualquer um forja tokens.
5. **Dados de criança enviados a um provedor sem contrato.** Mensagens de menores vão para o OpenRouter e daí para um modelo de terceiros escolhido por ser gratuito. Isso é incompatível com LGPD (art. 14) e com o ECA Digital, que exigem cuidado reforçado com dados de crianças.
6. **CORS aberto (`cors()`)** e nenhum cabeçalho de segurança.

## Problemas de produto

- **Guardrail por palavra-chave bloqueia o que não deveria e deixa passar o que deveria bloquear.** Exemplos reais da lista atual: `'morrer'` e `'matar'` bloqueiam "como morreu Tiradentes?" ou "por que os dinossauros morreram?", que são perguntas escolares legítimas. `'child'` bloqueia qualquer frase em inglês com essa palavra. Ao mesmo tempo, variações simples ("s3x0", gírias, outra língua, erro de digitação) passam.
- **A resposta de bloqueio é sempre a mesma** ("fora do contexto escolar"), inclusive para sinais de sofrimento emocional, que precisam de acolhimento e de alerta aos pais.
- **Os pais não são avisados de nada.** Existe `src/reports/alert-detector.js`, mas nenhuma rota o usa.
- **Configurações em memória.** A retenção de dados (`settings.js`) some a cada reinício do servidor.
- **Contexto de conversa vem do cliente.** O histórico enviado ao modelo (`history`) é montado no navegador; um usuário pode injetar mensagens falsas de "assistente".
- **Front monolítico**, sem componentes nem build, difícil de evoluir para celular/tablet com boa experiência.

## Problemas de engenharia

- Mistura de ESM, CommonJS e TypeScript sem compilação; arquivos `.ts` e `.js` com o mesmo nome.
- `new PrismaClient()` criado em 8 lugares, inclusive dentro de handlers (vaza conexões).
- Pasta `coverage/` e `test-results/` commitadas; `qrcode.png` na raiz.
- `README.md` aponta para outro repositório (`robertclaw-ia/robert-edison-projects`).
- `AGENTS.md` e specs prometem Fastify, Redis, TypeScript e 80% de cobertura; nada disso é o estado real.

## O que vale reaproveitar

- **Ideias e regras de negócio** dos specs (`specs/01-guard-rails-spec.md`, `openspec/changes/parent-child-auth`), que viram requisitos no novo plano.
- **Casos de teste de guardrail** (`tests/guard-rails.test.js`, `tests/guardrails/injection.test.js`, `tests/e2e/chat-guardrails.spec.js`) como semente do conjunto de avaliação de segurança.
- **Padrões de prompt injection** (`src/guardrails/layers/injection/patterns.js`) como camada barata de pré-filtro.
- **Modelo de dados Pai → Filho → Conversa** do Prisma, como ponto de partida.
- **Política de privacidade** (`docs/politica-de-privacidade.md`) como rascunho a revisar.
- **Pesquisa de mercado** (`docs/pesquisa-profunda-escolar-ai.md`).

## Recomendação

Começar um novo app "Tatá IA" no mesmo repositório (o código antigo vai para `legacy/` para consulta e depois é removido), seguindo a arquitetura de [arquitetura.md](../../../project/arquitetura.md). O esforço para corrigir os seis problemas críticos e ainda trocar a base de front e mobile é maior do que reconstruir com uma base pensada para celular, tablet e web desde o início.
