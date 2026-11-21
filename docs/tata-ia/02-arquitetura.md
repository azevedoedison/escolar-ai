# 02 · Plano de projeto e arquitetura proposta — Tatá IA

**Data:** 21/11/2026 · **Status:** proposta para aprovação do Edison

## 1. Visão

**Tatá IA** é um assistente de IA para crianças e pré-adolescentes (foco inicial: 9 a 13 anos; primeira usuária com 11 anos) para **pesquisa escolar e curiosidades do dia a dia**, com:

- **Guardrails amplos e inteligentes**: em vez de bloquear palavras, entende o contexto. "Como morreu Tiradentes?" é história e é respondido; "qual o jeito de morrer sem dor" é tratado como possível sofrimento, com acolhimento e alerta aos pais.
- **Login separado para responsáveis e filhos.** A criança usa o app no celular e no tablet; os pais usam o mesmo app (ou o navegador) com a conta deles.
- **Painel dos pais** com tudo o que a criança perguntou e recebeu, o que foi bloqueado e por quê, alertas e resumo semanal.
- **Celular, tablet e web** a partir de uma única base de código.

### O que fica fora da v1

WhatsApp, RAG de apostilas, integração com escolas, gamificação, voz e imagens (enviar foto do exercício fica para a fase 3).

## 2. Princípios de projeto

1. **Segurança da criança vem antes da utilidade**, mas bloqueio burro também é falha: se a Tatá recusar dever de casa de história, a criança volta para o ChatGPT sem filtro.
2. **Tudo que importa acontece no servidor.** O app é só interface; chave da IA, histórico, regras e decisões ficam no backend.
3. **Transparência com a criança.** Ela sabe que os pais podem ver as conversas (texto fixo no app). Isso é exigência ética e está alinhado ao ECA Digital.
4. **Privacidade por padrão.** Coletar o mínimo (apelido, ano de nascimento, série opcional), dados no Brasil, sem anúncios, sem perfilamento, sem uso dos dados para treinar modelos.
5. **Simples de operar.** Uma pessoa precisa conseguir manter o sistema: serviços gerenciados, uma linguagem (TypeScript) em tudo.

## 3. Arquitetura

```
┌──────────────────────────── App Tatá IA (Expo / React Native) ────────────────────────────┐
│  Android · iOS · Web (mesmo código)                                                       │
│  ├─ Modo Criança: chat, "minhas perguntas", modo Lição de Casa                            │
│  └─ Modo Responsável: painel, alertas, histórico, configurações (protegido por senha/PIN) │
└──────────────┬────────────────────────────────────────────────────────────────────────────┘
               │ HTTPS (token de sessão; criança nunca vê chaves)
┌──────────────▼──────────────────── API Tatá (TypeScript + Hono, Node 22) ─────────────────┐
│  /auth  /children  /devices  /chat (streaming)  /history  /alerts  /settings  /privacy    │
│                                                                                           │
│  Pipeline de segurança do chat                                                            │
│   0. Pré-filtro determinístico (tamanho, rate limit, injection, dados pessoais)           │
│   1. Classificador de entrada  ──► decisão: responder | responder com cuidado |           │
│                                    redirecionar | bloquear | crise                        │
│   2. Geração da resposta (prompt por idade + política da família)                         │
│   3. Classificador de saída (antes de mostrar)                                            │
│   4. Registro do evento + alerta aos pais quando necessário                               │
└───────┬───────────────────────────┬───────────────────────────┬──────────────────────────┘
        │                           │                           │
┌───────▼────────┐        ┌─────────▼──────────┐       ┌────────▼─────────────┐
│ Supabase (SP)  │        │ API da Anthropic   │       │ Notificações         │
│ Postgres + RLS │        │ Claude Haiku 5.5   │       │ Expo Push + e-mail   │
│ Auth (pais)    │        │ (esforço medium)   │       │ (Resend)             │
└────────────────┘        └────────────────────┘       └──────────────────────┘
```

### 3.1 Escolhas de tecnologia

| Camada | Escolha | Por quê |
|---|---|---|
| App | **Expo (React Native) + TypeScript + Expo Router** | Um código para Android, iOS e web; publicação nas lojas com EAS; atualizações sem passar pela loja (EAS Update). Substitui Capacitor + HTML monolítico. |
| UI | Tamagui ou NativeWind | Componentes que funcionam igual no celular, tablet e navegador. |
| API | **Hono em Node 22**, TypeScript, Zod para validação | Leve, rápido, fácil de testar; streaming de resposta nativo. |
| Hospedagem da API | Fly.io ou Railway, região **São Paulo (gru)** | Baixa latência e dados no Brasil. |
| Banco e login dos pais | **Supabase** (Postgres + Auth), região **São Paulo** | Login com e-mail, Google e Apple prontos; Row Level Security garante que um pai só vê os filhos dele (corrige o problema nº 2 do diagnóstico na raiz). |
| ORM | Drizzle | Tipado, migrações simples, sem cliente pesado. |
| IA | **Claude Haiku 5.5 (Anthropic)**, esforço `medium`, para responder e para classificar. Sonnet 5.5 fica como opção futura para perguntas complexas | Contrato comercial com termos de dados claros (a API não treina com os dados enviados), bom comportamento de segurança de base, saída estruturada para os classificadores. Custo na seção 3.4. |
| Testes | Vitest (unidade), Playwright (web), Maestro (mobile), suíte de avaliação de segurança própria | Ver seção 6. |
| Observabilidade | Sentry (erros) + logs sem conteúdo de mensagem | Não vazar conversas de crianças em logs. |

### 3.2 Contas, logins e dispositivos

- **Responsável** cria conta com e-mail e senha, Google ou Apple (Supabase Auth). Confirma e-mail e aceita o termo de consentimento parental (LGPD art. 14).
- **Responsável cadastra cada filho**: apelido, ano de nascimento, série (opcional), avatar. Não pedimos nome completo, escola nem cidade.
- **Pareamento do aparelho da criança**: no painel, o responsável gera um código de 6 dígitos ou QR code; no celular/tablet da criança, o app lê o código e fica vinculado àquele filho. A criança entra com um **PIN simples** (4 dígitos) e não precisa de e-mail.
- **Trocar para o modo Responsável** no aparelho da criança exige a senha do responsável (ou biometria do responsável num aparelho compartilhado).
- Sessão da criança: token de curta duração + token de dispositivo revogável pelo painel ("desconectar tablet").
- Mais de um responsável por família (pai e mãe) entra na fase 2.

> **Limite honesto:** o app não impede a criança de abrir outro navegador ou outro chatbot. Para isso, o plano é combinar a Tatá IA com o **Google Family Link** (Android) e o **Tempo de Uso** (iOS), deixando a Tatá como o app de IA permitido. Isso entra no guia de instalação para os pais.

### 3.3 Guardrails: como a Tatá decide

O núcleo do produto. Funciona em camadas, e a decisão final é sempre registrada com o motivo.

**Camada 0 · Pré-filtro determinístico (milissegundos, sem custo)**
Tamanho da mensagem, limite de mensagens por minuto e por dia, padrões conhecidos de prompt injection (reaproveitados do repositório antigo), detecção de dados pessoais da criança (telefone, endereço, CPF, senha) com aviso amigável e mascaramento antes de enviar à IA.

**Camada 1 · Classificador de entrada (Claude Haiku 5.5, saída estruturada)**
Recebe a mensagem e as últimas mensagens da conversa, e devolve: `categoria`, `intenção` (escolar, curiosidade, pessoal, busca de dano, teste de limites), `sinal_de_risco` (nenhum, baixo, alto, crise) e `decisão`. Decisões possíveis:

| Decisão | O que a criança vê | O que os pais veem |
|---|---|---|
| **Responder** | Resposta normal | Item no histórico |
| **Responder com cuidado** | Resposta adequada à idade, sem detalhes gráficos, sugerindo conversar com um adulto quando fizer sentido | Item marcado com a categoria |
| **Redirecionar** | Explicação gentil de que esse assunto é melhor conversar com os pais, e uma alternativa | Item destacado |
| **Bloquear** | Mensagem curta e não punitiva | Item destacado; alerta se houver repetição |
| **Crise** | Acolhimento, incentivo a falar com um adulto de confiança, **CVV 188** (ou Disque 100 em caso de violência/abuso) | **Alerta imediato** (push + e-mail) |

**Política por categoria (padrão para 11 anos; o responsável pode deixar mais estrita ou mais aberta)**

| Categoria | Padrão |
|---|---|
| Morte, guerras, doenças, desastres | Responder com cuidado em contexto escolar, histórico ou científico. Luto pessoal → acolhimento. |
| Suicídio e autolesão | Nunca dar método ou detalhe. Pergunta escolar genérica → resposta curta e cuidadosa. Qualquer sinal pessoal → **Crise**. |
| Sexualidade | Puberdade, reprodução e corpo humano no nível do currículo de Ciências → responder com cuidado (ajustável pelos pais). Conteúdo sexual explícito → bloquear. Relato de abuso ou aliciamento → **Crise**. |
| Drogas, álcool, cigarro, vape | Prevenção e efeitos na saúde → responder com cuidado. Como obter, usar ou esconder → bloquear. |
| Violência e armas | História e atualidades → responder com cuidado. Instruções para ferir, fabricar armas → bloquear. Ameaça ou bullying sofrido → acolhimento + alerta. |
| Desafios perigosos de internet, transtornos alimentares, dietas extremas | Bloquear e acolher; alerta se for pessoal. |
| Apostas e "bets", golpes, hacking, burlar regras | Bloquear, com explicação educativa curta quando cabível. |
| Conversar com estranhos, encontros, compartilhar fotos | Orientação de segurança digital; alerta se houver relato concreto. |
| Ódio e discriminação | Bloquear conteúdo ofensivo; explicar respeito e diversidade quando for dúvida sincera. |
| Lição de casa | **Modo Lição de Casa**: a Tatá guia com perguntas e explicações em vez de entregar a resposta pronta. Os pais escolhem se o modo é obrigatório. |

**Camada 2 · Geração da resposta (Claude Haiku 5.5, esforço medium)**
Prompt de sistema montado no servidor a partir de: idade, série, configurações da família e a decisão da camada 1. O histórico da conversa vem do banco, nunca do app (corrige o problema do diagnóstico). A Tatá tem personalidade definida: calorosa, curiosa, em português do Brasil, linguagem para a idade, cita quando não tem certeza, e sugere fontes confiáveis (Khan Academy, Brasil Escola, livros didáticos) em vez de links aleatórios.

**Camada 3 · Classificador de saída (Claude Haiku 5.5)**
Antes de mostrar, confere se a resposta respeitou a política. Na v1 a resposta é verificada inteira e depois exibida com efeito de digitação; em fase posterior, verificação por trechos durante o streaming.

**Camada 4 · Registro e alertas**
Toda interação vira um evento com: pergunta, resposta, decisão de cada camada, categoria, sinal de risco e modelo usado. Alertas seguem regras simples: crise sempre; bloqueios repetidos na mesma categoria (3 em 24h); tentativas de burlar o filtro.

**Avaliação contínua.** Um conjunto de **pelo menos 500 perguntas de teste** em português (escolares legítimas que não podem ser bloqueadas + perguntas perigosas que precisam ser barradas + tentativas de burla) roda em toda mudança de prompt ou modelo. Metas de aceite da v1: ≥ 99% das perguntas perigosas tratadas corretamente, 100% dos casos de crise detectados, ≤ 3% de perguntas escolares legítimas bloqueadas.

### 3.4 Custo estimado de IA por criança

Preços de tabela da Anthropic (US$ por milhão de tokens): Sonnet 5.5 entrada 2,00 / saída 10,00; Haiku 5.5 entrada 0,10 / saída 0,50.

Suposição de uso intenso: 30 perguntas por dia, 900 por mês; cada pergunta com ~1.500 tokens de entrada e ~400 de saída na geração, e dois classificadores de ~800 tokens cada.

| Item | Por mês |
|---|---|
| Geração com Sonnet 5.5 (900 × (1.500 × 2 + 400 × 10) / 1M) | ≈ US$ 6,30 |
| Com cache de prompt do sistema (economia típica de 30–40% na entrada) | ≈ US$ 5,00 |
| Classificadores com Haiku 5.5 | ≈ US$ 0,20 |
| **Total, uso intenso** | **≈ US$ 5 a 6,5** |
| **Total, uso típico (10 perguntas/dia)** | **≈ US$ 2** |
| Alternativa: gerar com Haiku 5.5 também | ≈ US$ 0,50 no uso intenso |

**Decisão do Edison (21/11/2026): começar com Claude Haiku 5.5, esforço `medium`, na geração e nos classificadores.** Custo estimado: cerca de US$ 0,50 por criança por mês no uso intenso, e uns US$ 0,20 no uso típico, já contando os classificadores. Se a suíte de avaliação ou o dogfooding mostrarem respostas fracas em perguntas complexas, a opção é mandar só essas para o Sonnet 5.5.

### 3.5 Modelo de dados (v1)

```
family            id, created_at, plan, data_region
guardian          id, family_id, auth_user_id, name, email, role(owner|member), consent_at
child             id, family_id, nickname, birth_year, grade?, avatar, pin_hash, active
device            id, child_id, platform, paired_at, last_seen_at, revoked_at
family_settings   family_id, category_policy(jsonb), homework_mode, daily_limit, quiet_hours, retention_days
conversation      id, child_id, title, started_at
message           id, conversation_id, role(child|tata), content, created_at
safety_event      id, message_id, layer, category, intent, risk, decision, model, latency_ms
alert             id, family_id, child_id, safety_event_id, severity, status(new|seen|resolved), created_at
audit_log         id, actor, action, target, created_at   (quem viu/apagou/exportou o quê)
```

Row Level Security: um responsável só lê linhas da própria `family`. A criança só lê as próprias conversas (via API).

### 3.6 Painel dos pais

- **Linha do tempo** por filho: perguntas e respostas, com etiqueta de categoria e decisão.
- **Filtros e busca**: por data, categoria, só bloqueadas, só alertas, texto.
- **Alertas** com push e e-mail; marcar como visto ou resolvido.
- **Resumo semanal** gerado por IA: assuntos estudados, curiosidades, pontos de atenção.
- **Configurações**: rigor por categoria, modo Lição de Casa, limite diário, horários sem uso, retenção dos dados.
- **Dispositivos**: ver aparelhos pareados e desconectar.
- **Privacidade**: exportar dados, apagar conversas, excluir conta.

## 4. Privacidade e conformidade (LGPD e ECA Digital)

> Este resumo orienta o produto e **não substitui** a revisão por um advogado especializado, que está no backlog antes do lançamento público.

- **LGPD, art. 14**: tratamento de dados de criança exige consentimento específico e em destaque de pelo menos um dos pais, informação clara e coleta mínima. → Fluxo de consentimento no cadastro, registro de data e versão do termo.
- **ECA Digital (Lei 15.211/2025)**: impõe a produtos digitais usados por crianças e adolescentes, entre outros pontos, proteção por padrão no nível mais alto, ferramentas de supervisão parental, mecanismos de verificação de idade confiáveis, proibição de perfilamento para publicidade e transparência. → A Tatá já nasce com supervisão parental, sem anúncios, com configuração padrão estrita e criança cadastrada pelo responsável. Confirmar com assessoria jurídica as obrigações e prazos aplicáveis.
- **Dados no Brasil**: banco e API em São Paulo. A chamada à IA sai do país; isso precisa estar declarado na política de privacidade (transferência internacional, art. 33 da LGPD) e coberto pelos termos comerciais do provedor.
- **Retenção**: padrão de 90 dias para conversas, configurável pelos pais (30 a 365). Eventos de crise ficam até os pais resolverem.
- **Direitos do titular**: exportar e apagar pelo próprio painel.
- **Segurança**: senhas e PINs com hash, tokens curtos, RLS, cabeçalhos de segurança, CORS restrito, segredos só em variáveis de ambiente (sem valores padrão), logs sem conteúdo de conversa, trilha de auditoria.
- **Política de uso do provedor de IA**: confirmar os requisitos da Anthropic para produtos usados por menores (salvaguardas, divulgação) antes do beta.
- **Lojas de apps**: seguir as regras de apps para famílias do Google Play e as diretrizes da App Store; não usar SDKs de anúncio nem de analytics de terceiros no app da criança.

## 5. Estrutura do repositório proposta

```
escolar-ai/            (renomear para tata-ia quando quiser)
├── apps/
│   ├── mobile/        Expo: Android, iOS e Web
│   └── api/           Hono + pipeline de segurança
├── packages/
│   ├── shared/        tipos, esquemas Zod, constantes
│   └── safety/        política, prompts, classificadores, suíte de avaliação
├── supabase/          migrações e políticas RLS
├── docs/tata-ia/      estes documentos
└── legacy/            código antigo, só para consulta (removido após o MVP)
```

Monorepo com pnpm + Turborepo. CI no GitHub Actions: lint, tipos, testes e a suíte de avaliação de segurança (com amostra menor em cada PR e completa antes de cada versão).

## 6. Qualidade e testes

- **Unidade**: regras de política, pré-filtro, montagem de prompt, permissões.
- **Integração**: rotas da API com banco de teste, incluindo testes de que um pai **não** acessa dados de outra família.
- **Avaliação de segurança**: suíte da seção 3.3, com relatório de acertos por categoria.
- **E2E**: Playwright no web; Maestro no Android.
- **Dogfooding**: a primeira usuária usa por 2–4 semanas com o Edison revisando o painel; cada bloqueio indevido ou resposta ruim vira caso de teste.

## 7. Riscos principais

| Risco | Mitigação |
|---|---|
| Filtro bloqueia demais e a criança desiste | Meta de ≤ 3% de bloqueio indevido; botão "isso era para a escola" que vai para revisão dos pais |
| Filtro deixa passar algo grave | Duas camadas de classificação + modelo com segurança própria + suíte de avaliação + alertas |
| Criança usa outro app sem filtro | Guia de Family Link / Tempo de Uso; experiência boa o bastante para ela preferir a Tatá |
| Custo de IA cresce | Limite diário por criança, cache de prompt, roteamento Haiku/Sonnet |
| Exigências legais mudam | Revisão jurídica antes do beta aberto; design já alinhado a privacidade por padrão |
| Dependência de um provedor de IA | Camada de IA isolada em `packages/safety` com interface própria |
