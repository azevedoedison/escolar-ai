# PLANO DE NEGÓCIO: "Escolar AI"
## IA Educacional com Controle Parental via WhatsApp

**Data:** 23/03/2026 | **Versão:** 4.0 - Final
**Fundador:** Edison Azevedo | **Dogfooding:** Pai + filha 10 anos

---

## 1. EXECUTIVO

**"Escolar AI"** é uma plataforma de inteligência artificial educacional para crianças (6-14 anos) com **guard rails educationais** e **controle parental via WhatsApp**.

**Problema Validado:**
- ✅ **ChatGPT quebra controles parentais em minutos** (Folha de S.Paulo, O Globo, Estadão - Outubro 2025)
- ✅ **ECA Digital sancionado no Brasil** - obriga verificações de idade e proteções em IAs
- ✅ **Caso real:** Adolescente preso por pergunta ao ChatGPT (outubro 2025)
- ✅ **OpenAI reconhece riscos** - "desde conteúdo impróprio até conselhos perigosos sobre saúde mental"

**Timing Perfeito:**
- 🇧🇷 **Brasil é o 2º maior polo de EdTechs do mundo** (Distrito EdTech Report 2025)
- 💰 Mercado EdTech global: **US$ 250+ bi** (HolonIQ 2025)
- ⚠️ Nenhum concorrente oferece **IA + Controle Parental + WhatsApp** no Brasil

**Validação Pessoal:**
> *"Eu sou o pai. A dor que eu tenho é a dor de todo pai e mãe."* - Edison Azevedo

---

## 2. MERCADO

### 2.1 Tamanho do Mercado

| Segmento | Valor (2025) | Projeção | Fonte |
|----------|--------------|----------|-------|
| **EdTech Global** | US$ 250+ bi | US$ 400+ bi (2025) | HolonIQ |
| **EdTech Brasil** | 2º maior polo global | - | Distrito |
| **Controle Parental** | US$ 1,57-2,84 bi | US$ 4,12 bi (2034) | Fortune BI |
| **IA na Educação** | US$ 25,7 bi | US$ 80+ bi (2030) | HolonIQ |

### 2.2 Segmentação

**TAM:** 15 milhões de famílias com crianças 6-14 no Brasil
**SAM:** 4,5 milhões (smartphones, filhos usam IA, internet)
**SAM Qualificado:** 1,2 milhões (renda >R$ 5k, preocupadas com segurança)
**SOM Ano 1:** 10.000 (early adopters em capitais)
**SOM Ano 3:** 150.000 (escala + B2B)

### 2.3 Regulamentação (VANTAGEM!)

| Regulamento | Status | Impacto |
|-------------|--------|---------|
| **ECA Digital (Brasil)** | ✅ Sancionado | Obriga verificação de idade e proteções em IAs |
| **LGPD** | ✅ Vigente | Dados de crianças = sensíveis, consentimento parental obrigatório |
| **UK Online Safety Act** | ✅ Vigente | Multas até 10% da receita global |
| **EU AI Act** | ✅ Aprovado | Classificação de risco para IA infantil |
| **Kids Online Safety Act (EUA)** | 🔄 Em trânsito | Responsabilidade por danos a crianças |

**Conclusão:** Regulamentação é **VANTAGEM** para quem nasce compliance-first. Big Techs estão correndo para se adequar.

---

## 3. CONCORRÊNCIA

### 3.1 Diretos (Tutores AI)

| Produto | Preço | Foco | Controle Parental | WhatsApp | Brasil |
|---------|-------|------|-------------------|----------|--------|
| **Khanmigo** | US$ 44/ano | K-12 Socrático | Mínimo | ❌ | ❌ (só EUA) |
| **Synthesis** | US$ 95-300/ano | Matemática K-5 | ❌ | ❌ | ❌ |
| **Photomath** | US$ 9,99/mês | Matemática | ❌ | ❌ | Parcial |
| **Socratic** | Gratuito | Homework | ❌ | ❌ | Parcial |
| **Brainly** | US$ 24-48/ano | Comunidade | ❌ | ❌ | Parcial |
| **★ Escolar AI** | **R$ 49,90/mês** | **IA + Escola** | **✅ Avançado** | **✅** | **✅ 100%** |

### 3.2 Indiretos (Controle Parental)

| Produto | Preço | Foco | IA Educacional | WhatsApp Integration |
|---------|-------|------|----------------|---------------------|
| **Qustodio** | US$ 55-100/ano | Monitoramento geral | ❌ | Apenas monitora |
| **Bark** | US$ 14/mês | Redes sociais | ❌ | ❌ |
| **Google Family Link** | Gratuito | Controle básico | ❌ | ❌ |

### 3.3 Brasileiros (EdTech)

| Startup | Foco | Diferencial |
|---------|------|-------------|
| **Alicerce** | Leitura, matemática, programação (5-15 anos) | Escolas |
| **Ensinei** | IA para professores | Planos de aula |
| **HistórIA** | Educação infantil interativa | Gamificação |
| **Escola da Inteligência** | Socioemocional | 15 anos no mercado |

**Vazio confirmado:** Ninguém faz IA educacional + Controle Parental via WhatsApp.

---

## 4. PRODUTO

### 4.1 MVP (Fase 1)

**Core:**
- WhatsApp bot para crianças
- Guard rails educationais (5 camadas)
- Respostas curtas e didáticas
- Fallback: "Essa pergunta está fora do contexto escolar"

**Controle Parental:**
- Cadastro do filho (nome, idade, série)
- Relatório semanal via WhatsApp (texto simples)
- Alerta quando criança tenta conteúdo inadequado

### 4.2 Guard Rails (5 Camadas)

```
Layer 1: Lista de bloqueio (palavras/chave proibidas)
    ↓
Layer 2: Classificador de intenção (GPT-4o-mini: escola/bloqueado/ok)
    ↓
Layer 3: System prompt (persona educacional, linguagem simples)
    ↓
Layer 4: Validação pós-resposta (verifica adequação)
    ↓
Layer 5: Human review (fila para análise humana)
```

### 4.3 Roadmap

| Fase | Tempo | Entregas |
|------|-------|----------|
| **MVP** | Semana 1-3 | WhatsApp bot + guard rails + dogfooding |
| **Beta** | Semana 4-6 | 50 famílias beta, feedback loops |
| **Lançamento** | Mês 2-3 | Planos pagos, marketing |
| **Escala** | Mês 4-6 | 5-10 escolas piloto, app mobile |
| **Seed** | Mês 12-18 | R$ 10-15M, expansão |

---

## 5. MODELO DE NEGÓCIO

### 5.1 Preços

| Plano | Preço | Perguntas | Filhos | Relatórios | Controle Parental |
|-------|-------|-----------|--------|------------|-------------------|
| **Turma** | R$ 29,90/mês | 200/mês | 1 | Mensal | Básico |
| **Escola** | R$ 49,90/mês | Ilimitado | Até 4 | Semanal + Mensal | Avançado |
| **Instituição** | R$ 899/mês | Ilimitado | N/A | Dashboard | Completo |
| **Gratuito** | R$ 0 | 20/mês | 1 | Não | Limitado |

### 5.2 Projeções

**Cenário Conservador:**

| Métrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| Usuários Gratuitos | 50.000 | 150.000 | 400.000 |
| Assinantes Pagantes | 1.500 | 8.000 | 27.000 |
| Escolas | 5 | 30 | 100 |
| MRR | R$ 63K | R$ 361K | R$ 1,27M |
| ARR | **R$ 760K** | **R$ 4,3M** | **R$ 15,3M** |

### 5.3 Unidade Econômica

| Métrica | Plano Básico | Plano Família | Plano Escola |
|---------|--------------|---------------|--------------|
| **Preço** | R$ 29,90 | R$ 49,90 | R$ 899 |
| **Custo/Usuário** | R$ 14-18 | R$ 16-22 | R$ 12-15 |
| **Margem** | 40-53% | 56-68% | **83-87%** |
| **CAC** | R$ 50-80 | R$ 80-120 | R$ 500-1.000 |
| **LTV (24m)** | R$ 500-600 | R$ 800-1.000 | **R$ 18-20K** |
| **LTV:CAC** | 6-12x | 7-12x | **18-40x** |

**Insight:** Plano Escola (B2B) tem melhor economia. Priorizar após validação.

---

## 6. TECH STACK

### 6.1 Arquitetura MVP

```
Criança → WhatsApp → Twilio/360dialog → Backend (Node.js) → Guard Rails → OpenAI API → Resposta
                                                              ↓
                                                    Registro de logs → Relatórios para pais
```

### 6.2 Componentes

| Camada | Tecnologia | Custo Estimado |
|--------|-----------|----------------|
| **WhatsApp API** | 360dialog | R$ 3-5/mil msgs |
| **Backend** | Node.js + Fastify | - |
| **IA** | OpenAI GPT-4o-mini | R$ 0,05-0,10/query |
| **Database** | PostgreSQL + Redis | - |
| **Infra** | DigitalOcean / AWS | R$ 200-500/mês |

**Custo MVP (50 usuários):** ~R$ 500-1.000/mês

---

## 7. INVESTIMENTO

### 7.1 Fases

| Fase | Valor | Fonte | Uso |
|------|-------|-------|-----|
| **MVP** | R$ 50-100K | Bootstrapping/F&F | Desenvolvimento, jurídico, testes |
| **Pre-Seed** | R$ 500K-1,5M | Angels/Accelerators | Lançamento, marketing, equipe |
| **Seed** | R$ 5-15M | VCs EdTech | Escala, app mobile, B2B |

### 7.2 VCs EdTech no Brasil (Top 10)

| VC | EdTech Investments | Foco |
|----|-------------------|------|
| **Bossa Invest** | 11 | Seed, Pre-Seed |
| **Canary** | 8 | Seed, Series A |
| **Leonardo Teixeira** | 6 | Angel |
| **Igah Ventures** | 6 | Series A, Seed |
| **DOMO.VC** | 6 | Seed, Pre-Seed |
| **Invest Tech** | 4 | Seed |
| **Valor Capital** | 4 | Series A |
| **TM3 Capital** | 4 | Seed |
| **Astella** | 3 | Series A |
| **MAYA Capital** | 3 | Seed |

**Globais ativos no Brasil:**
- Owl Ventures (US$ 2B AUM) - 3 investments EdTech Brasil
- Reach Capital - 3 investments Brasil
- Redpoint Eventures - 2 investments Brasil

---

## 8. GO-TO-MARKET

### 8.1 Estratégia B2C (Foco)

| Canal | Estratégia | Budget |
|-------|-----------|--------|
| **Indicação** | "Indique amigo, ganhe 1 mês grátis" | Orgânico |
| **Instagram/TikTok** | Vídeos: problema (filhos + ChatGPT sem controle) vs. solução | R$ 10-20K/mês |
| **Google Ads** | "Controle parental IA", "ChatGPT seguro crianças" | R$ 5-10K/mês |
| **Influenciadores** | 5-10 micro (10K-100K) parenting | R$ 15-25K |

### 8.2 Estratégia B2B (Pós-Validação)

| Canal | Estratégia |
|-------|-----------|
| **Escolas piloto** | 5-10 escolas gratuitas (case de sucesso) |
| **Programa Embaixadores** | Professores indicam, ganham comissão |
| **Feiras educações** | Presence em eventos de EdTech |

### 8.3 Métricas de Crescimento

| Métrica | Mês 3 | Mês 6 | Mês 12 |
|---------|-------|-------|--------|
| **Usuários Totais** | 500 | 5.000 | 30.000 |
| **Assinantes** | 50 | 500 | 5.000 |
| **MRR** | R$ 2K | R$ 20K | R$ 200K |
| **NPS** | >40 | >50 | >60 |
| **Retention 30d** | >50% | >60% | >70% |

---

## 9. RISCOS

### 9.1 Matriz de Risco

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| **Guard rails falharem** | 15-25% | CRÍTICO | Triple-layer + human review + seguro |
| **WhatsApp mudar políticas** | 10% | ALTO | App mobile como fallback |
| **Concorrência Big Tech** | 40% (24m) | ALTO | Moats: escolas, dados, compliance |
| **Custos IA subirem** | 50% | ALTO | Cache + open-source (Llama/Mistral) |
| **Pais não pagarem** | 30% | MÉDIO | Freemium generoso + valor emocional |

### 9.2 Fator Crítico de Sucesso

**Guard rails = vida ou morte da empresa**

Investimento mínimo:
- 30% do tempo de desenvolvimento em segurança
- R$ 100-200K em auditoria e testes
- Bug bounty program
- Protocolo de crise definido

---

## 10. EQUIPE

### 10.1 MVP (Fase 1)

| Função | Responsável | Status |
|--------|-------------|--------|
| **CEO/Product** | Edison Azevedo | ✅ |
| **CTO/Dev** | Contratar (ou Edison) | ⏳ |
| **Pedagógico** | Consultor (part-time) | ⏳ |
| **Jurídico** | Advogado LGPD | ⏳ |

### 10.2 Crescimento (Fase 2)

| Função | Quando |
|--------|--------|
| **Full-stack Developer** | Mês 2-3 |
| **Pedagogo/Content** | Mês 3-4 |
| **Marketing/Growth** | Mês 4-6 |
| **Customer Success** | Mês 6+ |

---

## 11. TIMELINE

```
Mês 1-3: MVP + Dogfooding (Edison + filha)
    ↓
Mês 3-4: Beta (50 famílias)
    ↓
Mês 4-6: Lançamento pago + Marketing
    ↓
Mês 6-9: 5-10 escolas piloto + App mobile
    ↓
Mês 9-12: Escala (10K+ usuários)
    ↓
Mês 12-18: Rodada Seed (R$ 10-15M)
    ↓
Mês 18-24: Expansão Brasil + LATAM
    ↓
Mês 24-36: 500K usuários, ARR R$ 30M+
```

---

## 12. PRÓXIMOS PASSOS (Esta Semana)

- [ ] **Dogfooding:** Configurar WhatsApp bot com guard rails básico
- [ ] **Validação:** Sua filha testa com pesquisas reais
- [ ] **Feedback:** Registrar o que funciona, o que quebra
- [ ] **Jurídico:** Contatar advogado LGPD
- [ ] **Tech:** Definir stack final (OpenAI vs. multi-model)

---

**Documento:** plano-negocio-escolar-ai.md
**Próxima revisão:** 30/03/2026
**Contato:** Edison Azevedo (azevedoedison@gmail.com)

---
*Plano elaborado com base em pesquisa de mercado (Brave Search), análise de concorrentes, dados do Distrito EdTech Report 2025, HolonIQ, e regulamentação brasileira (ECA Digital, LGPD).*
