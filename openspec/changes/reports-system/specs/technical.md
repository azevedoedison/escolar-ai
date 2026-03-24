# 📋 Spec Técnica: Reports System

## 1. Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    REPORTS SYSTEM                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⏰ Cron Job (OpenClaw)                                     │
│  │  Segundas 09:00                                          │
│  ▼                                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ReportGenerator                                    │   │
│  │  • Busca conversas da semana                        │   │
│  │  • Calcula métricas por criança                     │   │
│  │  • Extrai tópicos                                   │   │
│  │  • Compara com semana anterior                      │   │
│  │  • Formata email                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Email Sender (Nodemailer)                          │   │
│  │  • Template HTML                                     │   │
│  │  • Para: parent.email                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AlertDetector (em tempo real)                       │   │
│  │  • Monitora bloqueios no chat                        │   │
│  │  • Conta por hora (Redis/memory)                     │   │
│  │  • Dispara alerta se >= 3                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 2. Componentes

### 2.1 ReportGenerator
**Arquivo:** `src/reports/generator.js`

```javascript
class ReportGenerator {
  async generateWeeklyReport(parentId, startDate, endDate)
  // Retorna: { period, children: [...], alerts: [...] }

  async calculateChildStats(childId, startDate, endDate)
  // Retorna: { totalQuestions, totalBlocked, blockedRate, estimatedTime }

  async extractTopTopics(childId, startDate, endDate)
  // Retorna: [{ topic, count, percentage }]

  async calculateComparison(childId, currentPeriod, previousPeriod)
  // Retorna: { questionsChange, blockedChange }

  formatTimeFromTokens(tokens)
  // Retorna: "1h 45min"
}
```

### 2.2 AlertDetector
**Arquivo:** `src/reports/alert-detector.js`

```javascript
class AlertDetector {
  constructor() {
    this.hourlyCounts = new Map(); // childId -> { count, resetAt }
  }

  async recordBlock(childId, blockData)
  // Retorna: shouldAlert (boolean)

  async checkThreshold(childId)
  // Retorna: { shouldAlert, attemptCount, attempts }

  shouldSendAlert(childId)
  // Cooldown: 1 hora entre alertas

  async sendAlert(parentId, childId, attempts)
  // Chama emailSender
}
```

### 2.3 EmailSender
**Arquivo:** `src/reports/email-sender.js`

```javascript
class ReportEmailSender {
  constructor() {
    // Reutiliza config do scripts/send_email.py ou Nodemailer
  }

  async sendWeeklyReport(parentEmail, report)
  // Retorna: { success, messageId }

  async sendAlert(parentEmail, alert)
  // Retorna: { success, messageId }

  formatReportAsHTML(report)
  // Template com emojis e formatação

  formatAlertAsHTML(alert)
}
```

## 3. Topic Extraction

### Algoritmo de Extração de Tópicos
```javascript
function extractTopics(conversations) {
  const topicKeywords = {
    'Ciências': ['fotossíntese', 'planeta', 'átomo', 'dna', 'animal', 'planta', 'água', 'ar'],
    'Matemática': ['soma', 'divisão', 'multiplicação', 'número', 'conta', 'área', 'perímetro'],
    'História': ['brasil', 'guerra', 'rei', 'rainha', 'descoberta', 'colonização', 'escravo'],
    'Português': ['verbo', 'substantivo', 'adjetivo', 'redação', 'texto', 'gramática'],
    'Geografia': ['continente', 'país', 'capital', 'clima', 'rio', 'montanha'],
    'Inglês': ['english', 'word', 'vocabulary', 'verb to be'],
  };

  // Conta palavras iniciais das perguntas
  // Mapeia para categorias
  // Retorna top 3 com percentual
}
```

## 4. Alert Flow

```
Chat Handler (server.js)
    │
    ▼ (após bloqeurar)
AlertDetector.recordBlock(childId, { input, reason, timestamp })
    │
    ▼
checkThreshold(childId)
    │
    ├── < 3 bloqueios/hora → return { shouldAlert: false }
    │
    └── >= 3 bloqueios/hora
        │
        ▼
    shouldSendAlert(childId) // cooldown check
        │
        ├── false → return { shouldAlert: false, cooldown: true }
        │
        └── true
            │
            ▼
        sendAlert(parentId, childId, attempts)
            │
            ▼
        EmailSender.sendAlert(email, alertData)
            │
            ▼
        Registrar envio (evitar spam)
```

## 5. Cron Job

### Configuração OpenClaw
```json
{
  "name": "Weekly Report",
  "schedule": {
    "kind": "cron",
    "expr": "0 9 * * 1",
    "tz": "America/Sao_Paulo"
  },
  "payload": {
    "kind": "agentTurn",
    "message": "Gerar e enviar relatórios semanais para todos os pais ativos"
  },
  "sessionTarget": "isolated",
  "delivery": { "mode": "announce" }
}
```

## 6. Estrutura de Arquivos

```
src/
├── reports/
│   ├── generator.js          # ReportGenerator
│   ├── alert-detector.js     # AlertDetector
│   ├── email-sender.js       # ReportEmailSender
│   ├── topics.js             # Extração de tópicos
│   └── index.js              # Exportações
├── api/
│   └── routes/
│       └── reports.js        # Report API routes
└── web/
    └── server.js             # Adicionar rota reports
```
