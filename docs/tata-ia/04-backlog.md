# 04 · Backlog priorizado — Tatá IA

**Data:** 21/11/2026 · Prioridade: **P0** = sem isso não há MVP · **P1** = importante para o beta · **P2** = depois.
Estimativas em dias de trabalho focado (com apoio de IA no desenvolvimento). São ordens de grandeza, não compromissos.

---

## Fase 0 · Decisões e fundação (≈ 1 semana)

| ID | Tarefa | Prior. | Est. |
|---|---|---|---|
| F0-01 | Edison aprova este plano (arquitetura e escopo do MVP). Modelo de IA já decidido: Haiku 5.5, esforço medium | P0 | — |
| F0-02 | Mover código antigo para `legacy/`, limpar `coverage/`, `test-results/`, `qrcode.png`; novo README e AGENTS.md | P0 | 0,5 |
| F0-03 | Monorepo pnpm + Turborepo com `apps/mobile`, `apps/api`, `packages/shared`, `packages/safety` | P0 | 1 |
| F0-04 | CI no GitHub Actions: lint, checagem de tipos, testes | P0 | 0,5 |
| F0-05 | Criar projetos: Supabase (região São Paulo), Anthropic (chave de API e limite de gasto), Expo/EAS, Sentry | P0 | 0,5 |
| F0-06 | Identidade mínima: nome Tatá IA, ícone, cores, tom de voz da Tatá | P1 | 1 |
| F0-07 | Verificar disponibilidade do nome/domínio e iniciar registro de marca | P2 | — |

## Fase 1 · MVP para uso em casa (≈ 4 a 6 semanas)

Objetivo: a filha do Edison usar no celular e no tablet (Android) e o Edison acompanhar tudo pelo painel.

### Contas e acesso
| ID | Tarefa | Prior. | Est. |
|---|---|---|---|
| M-01 | Esquema do banco (seção 3.5 da arquitetura) com migrações e RLS | P0 | 1,5 |
| M-02 | Cadastro e login do responsável (e-mail/senha e Google) com termo de consentimento | P0 | 1,5 |
| M-03 | Cadastro de filho (apelido, ano de nascimento, série, avatar, PIN) | P0 | 1 |
| M-04 | Pareamento de aparelho por código de 6 dígitos / QR e login da criança por PIN | P0 | 2 |
| M-05 | Troca para modo Responsável protegida por senha | P0 | 0,5 |
| M-06 | Testes de isolamento: um responsável nunca acessa dados de outra família | P0 | 1 |

### Chat da criança
| ID | Tarefa | Prior. | Est. |
|---|---|---|---|
| M-10 | Tela de chat (celular e tablet): mensagens, digitando, sugestões de perguntas, aviso "seus pais podem ver" | P0 | 3 |
| M-11 | Lista de conversas da criança ("minhas perguntas") | P0 | 1 |
| M-12 | Rota `/chat` autenticada, histórico vindo do banco, resposta com efeito de digitação | P0 | 2 |
| M-13 | Prompt da Tatá (Haiku 5.5, esforço medium) por idade e série; modo Lição de Casa (guiar sem entregar resposta) | P0 | 1,5 |

### Segurança (núcleo)
| ID | Tarefa | Prior. | Est. |
|---|---|---|---|
| M-20 | Documento de política por categoria (tabela da seção 3.3) revisado pelo Edison | P0 | 1 |
| M-21 | Pré-filtro: tamanho, limite por minuto/dia, injection, dados pessoais | P0 | 1 |
| M-22 | Classificador de entrada com saída estruturada (Haiku 5.5, medium) | P0 | 2 |
| M-23 | Classificador de saída (Haiku 5.5) | P0 | 1 |
| M-24 | Respostas padrão de redirecionamento, bloqueio e crise (CVV 188, Disque 100) | P0 | 0,5 |
| M-25 | Suíte de avaliação v1: 300 casos em português (legítimos, perigosos, burlas, crise), com relatório | P0 | 3 |
| M-26 | Registro de `safety_event` para toda decisão | P0 | 0,5 |

### Painel dos pais
| ID | Tarefa | Prior. | Est. |
|---|---|---|---|
| M-30 | Linha do tempo por filho com etiqueta de categoria e decisão | P0 | 2 |
| M-31 | Filtros (data, só bloqueadas, só alertas) e busca por texto | P0 | 1 |
| M-32 | Alertas de crise por push e e-mail | P0 | 1,5 |
| M-33 | Configurações básicas: rigor (estrito/padrão), modo Lição de Casa, limite diário | P1 | 1,5 |
| M-34 | Dispositivos pareados e botão "desconectar" | P1 | 0,5 |

### Entrega
| ID | Tarefa | Prior. | Est. |
|---|---|---|---|
| M-40 | Build Android (APK interno via EAS) instalado no celular e no tablet | P0 | 0,5 |
| M-41 | Versão web (mesmo app) publicada em domínio próprio | P1 | 0,5 |
| M-42 | Guia para os pais: instalar, parear, configurar Family Link para deixar a Tatá como IA permitida | P1 | 0,5 |
| M-43 | Segurança básica: segredos obrigatórios, CORS restrito, cabeçalhos, logs sem conteúdo | P0 | 0,5 |

**Critério de pronto do MVP:** suíte de avaliação com ≥ 99% de acerto em perguntas perigosas, 100% em crise, ≤ 3% de bloqueio indevido; a filha consegue usar sozinha; o Edison vê tudo no painel e recebe alerta de teste.

## Fase 2 · Beta fechado com 20–30 famílias (≈ 4 a 6 semanas)

| ID | Tarefa | Prior. | Est. |
|---|---|---|---|
| B-01 | Revisão jurídica: termos de uso, política de privacidade, consentimento, ECA Digital | P0 | — |
| B-02 | Exportar dados e excluir conta pelo painel; retenção configurável com limpeza automática por família | P0 | 1,5 |
| B-03 | Segundo responsável na família (convite por e-mail) | P1 | 1,5 |
| B-04 | Rigor por categoria ajustável pelos pais; lista de temas extras bloqueados | P1 | 2 |
| B-05 | Botão da criança "isso era para a escola" → revisão dos pais → caso de teste | P1 | 1 |
| B-06 | Resumo semanal por e-mail gerado por IA | P1 | 1,5 |
| B-07 | Cache de prompt; avaliar mandar perguntas complexas ao Sonnet 5.5 se o Haiku 5.5 ficar fraco nelas | P2 | 2 |
| B-08 | Horários sem uso | P2 | 1 |
| B-09 | Build iOS e TestFlight | P1 | 1 |
| B-10 | Suíte de avaliação v2 com 500+ casos, incluindo casos reais anonimizados do beta | P0 | 2 |
| B-11 | Métricas do produto (painel interno sem conteúdo de conversa) | P1 | 1 |
| B-12 | Entrevistas de início e fim com as famílias do beta | P0 | — |

## Fase 3 · Lançamento pago (≈ 4 semanas)

| ID | Tarefa | Prior. | Est. |
|---|---|---|---|
| L-01 | Assinaturas pelas lojas (RevenueCat) e teste grátis de 14 dias | P0 | 3 |
| L-02 | Publicação na Google Play (programa para famílias) e App Store | P0 | 2 |
| L-03 | Página de divulgação com lista de espera | P0 | 1 |
| L-04 | Verificação de streaming por trechos (resposta aparece mais rápido) | P2 | 2 |
| L-05 | Foto do exercício (imagem) com a mesma política de segurança | P2 | 3 |
| L-06 | Plano para escolas (piloto) | P2 | — |

---

## Próximo passo

Depois da aprovação do Edison (F0-01), começar pela fase 0 e pelas tarefas M-01, M-20 e M-25: banco, política e suíte de avaliação vêm antes da tela de chat, porque são elas que definem se a Tatá é segura.
