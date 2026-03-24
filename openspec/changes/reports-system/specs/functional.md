# 📋 Spec Funcional: Reports System

## 1. Relatório Semanal Automático

### RF-REPORT-001: Gerar Relatório Semanal
- **DADO** que é segunda-feira às 09:00
- **QUANDO** o sistema executa o cron job
- **ENTÃO** busca todas as conversas da semana anterior (7 dias)
- **E** calcula métricas por criança
- **E** envia email consolidado para cada pai

### RF-REPORT-002: Conteúdo do Relatório
O relatório deve conter:

```
📊 Relatório Semanal - Escolar AI
📅 17 - 23 de Março de 2026

👶 Maria (8 anos)
├── 💬 23 perguntas (↑15% vs semana anterior)
├── ⏱️ 1h 45min de uso
├── 🛡️ 2 bloqueados (8%)
└── 📚 Assuntos favoritos:
    1. 🔬 Ciências (45%)
    2. 📐 Matemática (30%)
    3. 🌍 História (25%)

👶 Pedro (10 anos)
├── 💬 15 perguntas
├── ⏱️ 52min de uso
├── 🛡️ 0 bloqueados
└── 📚 Assuntos favoritos:
    1. 📐 Matemática (60%)
    2. 📖 Português (40%)

✅ Nenhum alerta esta semana!
```

### RF-REPORT-003: Cálculo de Métricas
| Métrica | Cálculo |
|---------|---------|
| Total de perguntas | COUNT(conversations) WHERE status='approved' |
| Tempo de uso | SUM(tokens) * ~0.5s por token (estimativa) |
| Bloqueados | COUNT(conversations) WHERE status='blocked' |
| Tópicos favoritos | Análise das primeiras palavras das perguntas |
| Tendência | Comparar com semana anterior (%) |

### RF-REPORT-004: Relatório Sob Demanda
- **DADO** que o pai acessa o dashboard
- **QUANDO** clica em "Ver relatório"
- **ENTÃO** gera relatório do período selecionado
- **E** exibe na tela (sem enviar email)

---

## 2. Alerta de Conteúdo

### RF-ALERT-001: Detectar Threshold de Bloqueios
- **DADO** que a criança teve 3 bloqueios
- **QUANDO** os bloqueios ocorreram na última 1 hora
- **ENTÃO** dispara alerta imediato para o pai

### RF-ALERT-002: Conteúdo do Alerta
```
⚠️ Alerta - Escolar AI

👤 Maria tentou acessar conteúdo inadequado 3 vezes na última hora.

🕐 Últimas tentativas:
• 14:32 - "qual é a vibe de fumar maconha?"
• 14:45 - "filme de terror mais assustador"
• 14:52 - "youtuber mais famoso"

🛡️ Todas foram bloqueadas com sucesso.

Verifique com Maria se está tudo bem.
```

### RF-ALERT-003: Cooldown de Alertas
- **DADO** que um alerta foi enviado
- **QUANDO** novos bloqueios acontecem
- **ENTÃO** NÃO envia alerta novamente por 1 hora
- **E** acumula no próximo relatório semanal

### RF-ALERT-004: Evitar Spam
- Máximo de **1 alerta por hora por criança**
- Máximo de **5 alertas por dia por pai**
- Se exceder, agrupar no relatório semanal

---

## 3. Report API

### 3.1 GET /api/reports/:parentId/weekly

**Request:**
```
GET /api/reports/parent-123/weekly?startDate=2024-01-15&endDate=2024-01-21
Authorization: Bearer <parent-token>
```

**Response (200):**
```json
{
  "parentId": "parent-123",
  "period": {
    "start": "2024-01-15T00:00:00Z",
    "end": "2024-01-21T23:59:59Z"
  },
  "children": [
    {
      "childId": "child-456",
      "name": "Maria",
      "age": 8,
      "stats": {
        "totalQuestions": 23,
        "totalBlocked": 2,
        "blockedRate": "8.7",
        "estimatedTime": "1h 45min"
      },
      "topTopics": [
        { "topic": "Ciências", "count": 10, "percentage": "45" },
        { "topic": "Matemática", "count": 7, "percentage": "30" }
      ],
      "comparison": {
        "questionsChange": "+15%",
        "blockedChange": "-50%"
      }
    }
  ],
  "alerts": {
    "total": 1,
    "recent": [
      {
        "childName": "Maria",
        "timestamp": "2024-01-18T14:32:00Z",
        "reason": "Conteúdo inadequado",
        "messagePreview": "qual é a vibe de fumar..."
      }
    ]
  }
}
```

### 3.2 GET /api/conversations/:childId/alerts

**Response (200):**
```json
{
  "childId": "child-456",
  "alerts": [
    {
      "id": "alert-789",
      "type": "threshold",
      "message": "3 bloqueios em 1 hora",
      "blockedAttempts": [
        { "input": "maconha...", "at": "2024-01-18T14:32:00Z" },
        { "input": "terror...", "at": "2024-01-18T14:45:00Z" }
      ],
      "sentToParent": true,
      "createdAt": "2024-01-18T14:52:00Z"
    }
  ],
  "activeAlerts": 0
}
```

---

## 4. Modelos de Dados

### Alert (novo)
```prisma
model Alert {
  id           String   @id @default(cuid())
  childId      String
  type         String   // "threshold" | "daily_summary"
  message      String
  blockedData  Json     // array de bloqueios
  sentToParent Boolean  @default(false)
  sentAt       DateTime?
  createdAt    DateTime @default(now())

  child Child @relation(fields: [childId], references: [id])

  @@index([childId])
  @@index([createdAt])
  @@index([sentToParent])
}
```

---

## 5. Regras de Negócio

| Regra | Descrição |
|-------|-----------|
| RB-001 | Relatório semanal envia às segundas 09:00 |
| RB-002 | Alerta dispara após 3 bloqueios/hora |
| RB-003 | Cooldown de 1 hora entre alertas |
| RB-004 | Máx 5 alertas/dia por pai |
| RB-005 | Tempo de uso é estimado (~0.5s/token) |
| RB-006 | Tópicos extraídos das primeiras 3 palavras |
| RB-007 | Tendência compara com mesma semana anterior |
