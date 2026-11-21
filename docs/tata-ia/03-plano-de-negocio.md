# 03 · Plano de negócio enxuto — Tatá IA

**Data:** 21/11/2026 · Substitui `docs/plano-negocio-escolar-ai.md` (que fica como referência histórica, junto com a pesquisa de mercado em `docs/pesquisa-profunda-escolar-ai.md`).

## 1. Problema

Crianças de 9 a 13 anos já usam IA generativa para a escola e para tirar dúvidas, quase sempre em ferramentas feitas para adultos. Os pais não sabem o que foi perguntado, e os filtros dessas ferramentas não foram pensados para a idade nem para o contexto brasileiro. As alternativas são proibir (a criança usa escondido) ou liberar sem supervisão.

## 2. Solução

Um app de IA em português, feito para crianças, que **responde de verdade** (escola e curiosidades em geral), **trata temas sensíveis com cuidado em vez de simplesmente bloquear**, **acolhe e avisa os pais** em situações de risco e dá aos pais **visibilidade completa** do uso.

## 3. Para quem

| Segmento | Descrição | Quando |
|---|---|---|
| **Cliente zero** | A família do Edison (filha de 11 anos) | Já |
| **Primeiros clientes** | Pais e mães de crianças de 9 a 13 anos, classe média, com celular ou tablet próprio da criança, preocupados com segurança digital | Beta e lançamento |
| **Canal futuro** | Escolas particulares que querem indicar uma IA segura aos alunos (B2B2C) | Depois de 6 meses de produto estável |

Quem paga é o responsável; quem usa é a criança. O produto precisa agradar aos dois: a criança precisa gostar de usar, os pais precisam confiar.

## 4. Proposta de valor e diferenciais

- **Para a criança:** uma ajudante simpática, que explica do jeito dela, ajuda na lição sem entregar a resposta pronta e responde as curiosidades.
- **Para os pais:** tranquilidade, com histórico completo, alertas de verdade (não só "bloqueado") e regras ajustáveis por família.
- **Diferenciais frente a ChatGPT, Gemini e similares:** feito para a idade desde o início (não um modo restrito de um produto adulto), em português do Brasil, histórico integral visível aos pais, acolhimento com CVV e Disque 100, alinhado à LGPD e ao ECA Digital, sem anúncios e sem uso dos dados para outros fins.

## 5. Modelo de receita

| Plano | Preço sugerido | Inclui |
|---|---|---|
| **Beta** | Grátis | Até 30 famílias convidadas, em troca de feedback |
| **Família** | **R$ 29,90/mês** ou **R$ 249/ano** | Até 3 filhos, todos os recursos, limite justo de uso diário |
| **Teste grátis** | 14 dias | Plano Família completo |

Preço a validar no beta (pergunta direta: "quanto você pagaria?", e teste com duas faixas).

## 6. Conta de unidade (estimativa)

Premissas: família com 1,5 filho em média; uso típico de 10 perguntas por dia por criança; US$ 1 ≈ R$ 5,50 (ajustar ao câmbio do dia); comissão de loja de 15% (programas para pequenas empresas do Google Play e da App Store).

| Cenário | Custo de IA por família/mês | Receita líquida (R$ 29,90 − 15%) | Margem bruta |
|---|---|---|---|
| **Haiku 5.5 em tudo (decisão inicial)** | ≈ R$ 2 | R$ 25,40 | ≈ 90% |
| Roteamento (70% Haiku 5.5, 30% Sonnet 5.5) | ≈ R$ 6,50 | R$ 25,40 | ≈ 75% |
| Só Sonnet 5.5 na geração | ≈ R$ 16,50 | R$ 25,40 | ≈ 35% |

Conclusão: com o Haiku 5.5 (decisão do Edison em 21/11/2026) o custo de IA deixa de ser um problema, e sobra espaço para levar perguntas difíceis ao Sonnet 5.5 se a qualidade pedir. O limite diário continua no backlog para proteger contra abuso.

## 7. Custos fixos iniciais (estimativa)

| Item | Valor aproximado |
|---|---|
| Supabase Pro | US$ 25/mês |
| Hospedagem da API (Fly.io/Railway) | US$ 5–20/mês |
| Expo EAS (builds e updates) | Grátis no início; US$ 19/mês se precisar |
| Conta de desenvolvedor Apple | US$ 99/ano |
| Conta de desenvolvedor Google Play | US$ 25 (uma vez) |
| Domínio e e-mail transacional | ~R$ 100/ano + plano grátis do Resend |
| Revisão jurídica (termos, política, ECA Digital) | Orçar; estimativa de R$ 3 a 8 mil, uma vez |
| Registro de marca "Tatá IA" no INPI | Orçar; taxas oficiais de algumas centenas de reais |

Ponto de equilíbrio dos custos fixos (sem contar jurídico): cerca de 10 a 15 famílias pagantes.

## 8. Como chegar aos clientes

1. **Dogfooding** (semanas 1–4 após o MVP): uso diário pela filha, ajustes com base no painel.
2. **Beta fechado** (20–30 famílias): pais da escola da filha, amigos, grupos de pais no WhatsApp. Entrevista curta com cada família no início e no fim.
3. **Lançamento**: página simples com lista de espera, conteúdo curto para Instagram e TikTok voltado a pais ("o que seu filho pergunta para a IA?"), parceria com psicólogos infantis e educadores que falam de segurança digital.
4. **Escolas**: piloto gratuito com uma escola, depois plano institucional.

## 9. Metas e métricas

| Fase | Meta |
|---|---|
| Dogfooding | A filha usa pelo menos 4 dias por semana; bloqueio indevido ≤ 3%; zero falhas graves de segurança |
| Beta | 20 famílias ativas; 60% das crianças usam toda semana após 4 semanas; nota de confiança dos pais ≥ 8/10 |
| Lançamento | 100 famílias pagantes em 6 meses; cancelamento mensal ≤ 6% |

Métricas acompanhadas sempre: uso semanal por criança, perguntas por sessão, taxa de bloqueio por categoria, bloqueios contestados, alertas de crise (e tempo até o responsável ver), custo de IA por família.

## 10. Riscos do negócio

- **Grandes empresas lançam modo infantil gratuito.** Resposta: foco no Brasil, supervisão completa e relação de confiança com pais e escolas.
- **Responsabilidade em caso de falha do filtro.** Resposta: termos claros, avaliação contínua, alertas, seguro de responsabilidade quando houver receita.
- **Mudança regulatória.** Resposta: privacidade por padrão e revisão jurídica antes do lançamento.
- **Projeto de uma pessoa só.** Resposta: arquitetura simples, serviços gerenciados e escopo pequeno por fase.
