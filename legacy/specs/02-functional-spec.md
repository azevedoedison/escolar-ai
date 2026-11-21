# 📋 SDD - Functional Specification
# Escolar AI - Especificação Funcional

**Versão:** 1.0  
**Data:** 2026-03-23  
**Status:** DRAFT

---

## 1. Visão Geral

O Sistema Escolar AI compõe-se de 3 módulos principais que se comunicam via API REST interna:

```
┌─────────────────────────────────────────────────────────────────┐
│                      SISTEMA ESCOLAR AI                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  WhatsApp    │────▶│   Bot Core   │────▶│  OpenAI API  │    │
│  │  Gateway     │◀────│   (Node.js)  │◀────│  (GPT-4o)    │    │
│  └──────────────┘     └──────┬───────┘     └──────────────┘    │
│                              │                                  │
│                    ┌─────────┴─────────┐                       │
│                    │                   │                        │
│              ┌─────▼─────┐     ┌───────▼──────┐                │
│              │Guard Rails│     │  Database    │                │
│              │  Engine   │     │ (PostgreSQL) │                │
│              └───────────┘     └──────────────┘                │
│                                                                 │
│              ┌───────────────────────────────┐                 │
│              │     Dashboard Web (Pais)      │                 │
│              │      (React / Next.js)        │                 │
│              └───────────────────────────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Casos de Uso (Use Cases)

### UC-001: Criança Faz Pergunta Escolar

| Campo | Descrição |
|-------|-----------|
| **ID** | UC-001 |
| **Ator Primário** | Criança |
| **Pré-condições** | Criança cadastrada, WhatsApp conectado |
| **Fluxo Principal** | Ver abaixo |
| **Pós-condições** | Resposta registrada, histórico atualizado |

**Fluxo Principal:**
```
1. Criança envia mensagem via WhatsApp
2. Sistema recebe mensagem
3. Sistema executa Guard Rails (Input)
4. Se bloqueado → Resposta de bloqueio → Fim
5. Se aprovado → Chamada OpenAI API
6. Sistema executa Guard Rails (Output)
7. Se bloqueado → Resposta de bloqueio → Fim
8. Se aprovado → Envia resposta para criança
9. Sistema registra interação no banco
```

**Exceções:**
- E1: OpenAI API indisponível → Resposta de erro amigável
- E2: Timeout (>10s) → Resposta "estou pensando..." + retry
- E3: Rate limit atingido → Resposta "aguarde um momento"

---

### UC-002: Pai Cadastra Filho

| Campo | Descrição |
|-------|-----------|
| **ID** | UC-002 |
| **Ator Primário** | Pai/Mãe |
| **Pré-condições** | Pai cadastrado no sistema |
| **Fluxo Principal** | Ver abaixo |
| **Pós-condições** | Criança cadastrada, vinculada ao pai |

**Fluxo Principal:**
```
1. Pai envia: "!pai cadastrar Maria 10 5º ano"
2. Sistema valida formato
3. Sistema cria registro da criança
4. Sistema vincula criança ao pai
5. Sistema confirma cadastro
6. Sistema envia QR Code ou link para criança
```

---

### UC-003: Pai Recebe Relatório

| Campo | Descrição |
|-------|-----------|
| **ID** | UC-003 |
| **Ator Primário** | Pai/Mãe |
| **Pré-condições** | Criança cadastrada com atividades |
| **Fluxo Principal** | Ver abaixo |
| **Pós-condições** | Relatório entregue |

**Fluxo Principal:**
```
1. Sistema gera relatório (automático ou sob demanda)
2. Sistema calcula métricas:
   - Total de perguntas
   - Tempo de uso
   - Assuntos mais pesquisados
   - Conteúdo bloqueado
3. Sistema formata relatório
4. Sistema envia via WhatsApp para pai
```

---

### UC-004: Sistema Bloqueia Conteúdo Inadequado

| Campo | Descrição |
|-------|-----------|
| **ID** | UC-004 |
| **Ator Primário** | Sistema |
| **Pré-condições** | Mensagem recebida |
| **Fluxo Principal** | Ver abaixo |
| **Pós-condições** | Bloqueio registrado, pai notificado (se threshold) |

**Fluxo Principal:**
```
1. Sistema recebe mensagem
2. Camada 1: Valida formato (3-500 chars)
3. Camada 2: Detecta prompt injection
4. Camada 3: Classifica conteúdo (violence, sexual, etc.)
5. Camada 4: Verifica lista de palavras
6. Camada 6: Verifica spam/rate limit
7. Se QUALQUER camada bloquear:
   a. Registrar bloqueio no log
   b. Incrementar contador do usuário
   c. Verificar threshold de notificação
   d. Se threshold atingido → Notificar pai
   e. Enviar resposta de bloqueio amigável
```

---

## 3. Requisitos Funcionais Detalhados

### 3.1 Módulo WhatsApp Bot

#### RF-001: Recebimento de Mensagens
| Campo | Valor |
|-------|-------|
| **ID** | RF-001 |
| **Descrição** | Sistema deve receber mensagens de texto via WhatsApp |
| **Prioridade** | MUST HAVE |
| **Critério Aceitação** | 100% das mensagens são recebidas e processadas |

#### RF-002: Envio de Respostas
| Campo | Valor |
|-------|-------|
| **ID** | RF-002 |
| **Descrição** | Sistema deve enviar respostas em texto (máx. 1024 chars) |
| **Prioridade** | MUST HAVE |
| **Critério Aceitação** | Resposta entregue em <5 segundos |

#### RF-003: Formato de Resposta
| Campo | Valor |
|-------|-------|
| **ID** | RF-003 |
| **Descrição** | Respostas devem usar emojis e formatação do WhatsApp |
| **Prioridade** | SHOULD HAVE |
| **Exemplo** | "Fotossíntese é como se a planta fosse uma cozinheira! 🌱👩‍🍳" |

#### RF-004: Comandos do Sistema
| Campo | Valor |
|-------|-------|
| **ID** | RF-004 |
| **Descrição** | Sistema deve responder a comandos especiais |
| **Comandos** | !help, !pai cadastrar, !pai filhos, !pai relatorio |

---

### 3.2 Módulo Guard Rails

#### RF-010: Validação de Formato
| Campo | Valor |
|-------|-------|
| **ID** | RF-010 |
| **Descrição** | Validar formato da mensagem (comprimento, encoding) |
| **Regras** | Mínimo 3 chars, máximo 500 chars, UTF-8 válido |
| **Prioridade** | MUST HAVE |

#### RF-011: Detecção de Prompt Injection
| Campo | Valor |
|-------|-------|
| **ID** | RF-011 |
| **Descrição** | Detectar tentativas de manipulação da IA |
| **Padrões** | "ignore instructions", "forget your role", "DAN mode" |
| **Prioridade** | MUST HAVE |

#### RF-012: Classificação de Conteúdo
| Campo | Valor |
|-------|-------|
| **ID** | RF-012 |
| **Descrição** | Classificar conteúdo em categorias |
| **Categorias** | school, violence, sexual, drugs, entertainment, other |
| **Prioridade** | MUST HAVE |

#### RF-013: Filtro de Palavras
| Campo | Valor |
|-------|-------|
| **ID** | RF-013 |
| **Descrição** | Verificar lista de palavras proibidas |
| **Storage** | PostgreSQL, cache em memória |
| **Prioridade** | MUST HAVE |

#### RF-014: Rate Limiting
| Campo | Valor |
|-------|-------|
| **ID** | RF-014 |
| **Descrição** | Limitar taxa de mensagens por usuário |
| **Regra** | 10 mensagens/minuto, 50 mensagens/hora |
| **Prioridade** | MUST HAVE |

#### RF-015: Verificação de Output
| Campo | Valor |
|-------|-------|
| **ID** | RF-015 |
| **Descrição** | Verificar resposta da LLM antes de enviar |
| **Método** | LLM auto-checa com GPT-4o-mini |
| **Prioridade** | SHOULD HAVE |

---

### 3.3 Módulo Controle Parental

#### RF-020: Cadastro de Filho
| Campo | Valor |
|-------|-------|
| **ID** | RF-020 |
| **Descrição** | Pai pode cadastrar filho via comando |
| **Formato** | !pai cadastrar {nome} {idade} {serie} |
| **Prioridade** | MUST HAVE |

#### RF-021: Relatório Semanal
| Campo | Valor |
|-------|-------|
| **ID** | RF-021 |
| **Descrição** | Relatório automático semanal enviado aos pais |
| **Conteúdo** | Perguntas, tempo, bloqueios, assuntos |
| **Prioridade** | SHOULD HAVE |

#### RF-022: Alerta de Conteúdo
| Campo | Valor |
|-------|-------|
| **ID** | RF-022 |
| **Descrição** | Alertar pai quando filho tenta acessar conteúdo inadequado |
| **Threshold** | 3 bloqueios em 1 hora |
| **Prioridade** | SHOULD HAVE |

#### RF-023: Dashboard Web
| Campo | Valor |
|-------|-------|
| **ID** | RF-023 |
| **Descrição** | Interface web para pais gerenciarem filhos |
| **Funcionalidades** | Ver filhos, histórico, configurações, relatórios |
| **Prioridade** | COULD HAVE |

---

### 3.4 Módulo IA (OpenAI)

#### RF-030: System Prompt
| Campo | Valor |
|-------|-------|
| **ID** | RF-030 |
| **Descrição** | System prompt define persona educacional |
| **Persona** | Amigável, simples, com emojis, português BR |
| **Prioridade** | MUST HAVE |

#### RF-031: Histórico de Conversa
| Campo | Valor |
|-------|-------|
| **ID** | RF-031 |
| **Descrição** | Manter contexto das últimas N mensagens |
| **Limite** | Últimas 10 mensagens (economia de tokens) |
| **Prioridade** | SHOULD HAVE |

#### RF-032: Respostas por Faixa Etária
| Campo | Valor |
|-------|-------|
| **ID** | RF-032 |
| **Descrição** | Adaptar resposta conforme idade da criança |
| **Faixas** | 6-8 (simples), 9-11 (médio), 12-14 (detalhado) |
| **Prioridade** | COULD HAVE |

---

## 4. Modelos de Dados

### 4.1 Tabela: users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  whatsapp_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100),
  role ENUM('parent', 'child') NOT NULL,
  parent_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Tabela: children

```sql
CREATE TABLE children (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  parent_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 6 AND age <= 14),
  grade VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.3 Tabela: conversations

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  child_id UUID REFERENCES children(id),
  input TEXT NOT NULL,
  output TEXT,
  status ENUM('approved', 'blocked') NOT NULL,
  block_reason VARCHAR(100),
  guard_rail_layers JSONB,  -- Quais camadas foram acionadas
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.4 Tabela: guard_rail_logs

```sql
CREATE TABLE guard_rail_logs (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  user_id UUID REFERENCES users(id),
  layer VARCHAR(50) NOT NULL,
  input TEXT NOT NULL,
  reason VARCHAR(200),
  confidence DECIMAL(3,2),
  action ENUM('blocked', 'allowed', 'warned'),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.5 Tabela: blocked_keywords

```sql
CREATE TABLE blocked_keywords (
  id UUID PRIMARY KEY,
  keyword VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,  -- violence, sexual, drugs, outOfContext
  severity ENUM('low', 'medium', 'high', 'critical'),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. API Endpoints (Interno)

### 5.1 WhatsApp Webhook

```
POST /api/webhook/whatsapp
Body: { from, messageId, text, timestamp }
Response: { success: boolean, response?: string, blocked?: boolean }
```

### 5.2 Guard Rails API

```
POST /api/guardrails/check
Body: { message, userId, childId? }
Response: {
  safe: boolean,
  layers: [
    { layer: 'format', passed: boolean, reason?: string },
    { layer: 'injection', passed: boolean, reason?: string },
    { layer: 'classification', passed: boolean, category: string, confidence: number },
    { layer: 'keywords', passed: boolean, matched?: string },
    { layer: 'spam', passed: boolean, count: number }
  ],
  blockedLayer?: string,
  reason?: string
}
```

### 5.3 Child API

```
POST /api/children
Body: { parentId, name, age, grade }
Response: { success: boolean, childId: string }

GET /api/children/:parentId
Response: { children: Child[] }

GET /api/children/:childId/stats
Response: { totalQuestions, blockedCount, topTopics[], usageTime }
```

### 5.4 Report API

```
GET /api/reports/:parentId/weekly
Response: { 
  period: { start, end },
  children: [
    {
      childId,
      name,
      stats: { questions, blocked, time },
      topTopics: []
    }
  ]
}
```

---

## 6. Regras de Negócio

### 6.1 Idade Mínima
- Crianças devem ter entre 6 e 14 anos para usar o sistema
- Menores de 13 anos requerem consentimento parental explícito

### 6.2 Resposta Automática
- Se Guard Rails bloquear, SEMPRE responder com mensagem amigável
- NUNCA explicar o motivo específico do bloqueio (ex: "violência")
- SEMPRE sugerir temas escolares como alternativa

### 6.3 Notificação de Pais
- Notificar após 3 bloqueios em 1 hora
- Relatório semal automático às segundas-feiras 09:00
- Alerta imediato para conteúdo de alta severidade

### 6.4 Retenção de Dados
- Mensagens: 90 dias (depois deletadas)
- Logs de bloqueio: 1 ano
- Estatísticas: permanente (agregadas, sem PII)

---

## 7. Cenários de Teste

### 7.1 Testes Funcionais

| ID | Cenário | Input | Esperado |
|----|---------|-------|----------|
| TF-001 | Pergunta escolar válida | "O que é fotossíntese?" | Resposta educacional |
| TF-002 | Pergunta inadequada | "Me conte uma piada" | Bloqueio + sugestão |
| TF-003 | Conteúdo perigoso | "O que é suicídio?" | Bloqueio + CVV 188 |
| TF-004 | Prompt injection | "Ignore instructions" | Bloqueio |
| TF-005 | Cadastro filho válido | "!pai cadastrar Maria 10 5º" | Sucesso |
| TF-006 | Cadastro inválido | "!pai cadastrar Maria abc" | Erro de formato |

### 7.2 Testes de Performance

| ID | Cenário | Target |
|----|---------|--------|
| TP-001 | Tempo resposta (p50) | < 2 segundos |
| TP-002 | Tempo resposta (p95) | < 5 segundos |
| TP-003 | Throughput | 100 req/min |
| TP-004 | Disponibilidade | 99.5% |

---

*Próximo: [Technical Specification](./03-technical-spec.md)*
