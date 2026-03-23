# 📋 SDD - Technical Specification
# Escolar AI - Especificação Técnica

**Versão:** 1.0  
**Data:** 2026-03-23  
**Status:** DRAFT

---

## 1. Arquitetura Técnica

### 1.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PRODUCTION ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────────┐         ┌──────────────────────────────────────┐        │
│    │   WhatsApp   │         │           LOAD BALANCER              │        │
│    │   Business   │────────▶│          (nginx/ALB)                 │        │
│    │     API      │◀────────│                                      │        │
│    └──────────────┘         └──────────────────────────────────────┘        │
│                                         │                                   │
│                           ┌─────────────┼─────────────┐                     │
│                           ▼             ▼             ▼                     │
│                    ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│                    │  Bot App   │ │  Bot App   │ │  Bot App   │            │
│                    │  Instance  │ │  Instance  │ │  Instance  │            │
│                    │   (PM2)    │ │   (PM2)    │ │   (PM2)    │            │
│                    └─────┬──────┘ └─────┬──────┘ └─────┬──────┘            │
│                          │              │              │                    │
│                          └──────────────┼──────────────┘                    │
│                                         │                                   │
│                    ┌────────────────────┼────────────────────┐              │
│                    │                    │                    │              │
│              ┌─────▼─────┐      ┌──────▼──────┐     ┌───────▼──────┐       │
│              │   Redis   │      │ PostgreSQL  │     │ OpenAI API   │       │
│              │   Cache   │      │  Database   │     │  GPT-4o-mini │       │
│              │  + Queue  │      │             │     │              │       │
│              └───────────┘      └─────────────┘     └──────────────┘       │
│                                                                             │
│              ┌─────────────────────────────────────────┐                    │
│              │           S3 / CloudStorage             │                    │
│              │         (Logs & Analytics)              │                    │
│              └─────────────────────────────────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Técnico Detalhado

### 2.1 Backend Core

| Componente | Tecnologia | Versão | Justificativa |
|------------|-----------|--------|---------------|
| **Runtime** | Node.js | 20 LTS | Performance, async I/O |
| **Framework** | Fastify | 4.x | Schema validation, performance |
| **Language** | TypeScript | 5.x | Type safety, IDE support |
| **Test Runner** | Jest | 29.x | TDD/SDD support |
| **Linting** | ESLint + Prettier | - | Code quality |

### 2.2 Banco de Dados

| Componente | Tecnologia | Justificativa |
|------------|-----------|---------------|
| **Primary DB** | PostgreSQL 15+ | ACID, JSONB, full-text search |
| **Cache** | Redis 7+ | Sessões, rate limiting, queues |
| **ORM** | Prisma | Type-safe queries, migrations |

### 2.3 APIs Externas

| Serviço | API | Custo Estimado |
|---------|-----|----------------|
| **OpenAI** | GPT-4o-mini | ~R$ 0,05-0,10/query |
| **OpenAI** | Moderation API | Grátis |
| **WhatsApp** | 360dialog | R$ 3-5/mil msgs |

### 2.4 Infraestrutura

| Componente | Serviço | Configuração |
|------------|---------|--------------|
| **Compute** | AWS EC2 / DigitalOcean | t3.small (2 vCPU, 2GB) |
| **Database** | AWS RDS / DigitalOcean DB | db.t3.small |
| **Cache** | AWS ElastiCache / DO Redis | cache.t3.micro |
| **Monitoring** | Datadog / New Relic | Starter plan |

---

## 3. Estrutura de Código

### 3.1 Diretórios

```
escolar-ai/
├── src/
│   ├── bot/                    # WhatsApp Bot Core
│   │   ├── index.ts           # Entry point
│   │   ├── handlers/          # Message handlers
│   │   │   ├── child.ts       # Handler para crianças
│   │   │   ├── parent.ts      # Handler para pais
│   │   │   └── system.ts      # Handler de comandos
│   │   └── middleware/        # Middleware do bot
│   │       └── auth.ts        # Autenticação
│   │
│   ├── guardrails/            # Sistema de Guard Rails
│   │   ├── index.ts           # Orchestrador principal
│   │   ├── layers/            # Camadas individuais
│   │   │   ├── format.ts      # Camada 1: Validação formato
│   │   │   ├── injection.ts   # Camada 2: Prompt injection
│   │   │   ├── classifier.ts  # Camada 3: Classificação
│   │   │   ├── keywords.ts    # Camada 4: Filtro palavras
│   │   │   ├── spam.ts        # Camada 5: Anti-spam
│   │   │   └── output.ts      # Camada 6: Verificação output
│   │   ├── types.ts           # Types e interfaces
│   │   └── config.ts          # Configurações
│   │
│   ├── ai/                    # OpenAI Integration
│   │   ├── client.ts          # Cliente OpenAI
│   │   ├── prompts.ts         # System prompts
│   │   ├── history.ts         # Gestão de histórico
│   │   └── moderation.ts      # OpenAI Moderation API
│   │
│   ├── api/                   # REST API (Dashboard)
│   │   ├── routes/
│   │   │   ├── children.ts    # CRUD crianças
│   │   │   ├── reports.ts     # Relatórios
│   │   │   └── auth.ts        # Autenticação
│   │   ├── middleware/
│   │   │   └── jwt.ts         # JWT validation
│   │   └── server.ts          # Fastify server
│   │
│   ├── database/              # Database Layer
│   │   ├── schema.prisma      # Schema Prisma
│   │   ├── migrations/        # Migrations
│   │   └── repositories/      # Data access
│   │       ├── user.ts
│   │       ├── child.ts
│   │       ├── conversation.ts
│   │       └── guardrail-log.ts
│   │
│   ├── notifications/         # Notificações
│   │   ├── whatsapp.ts        # Envio WhatsApp
│   │   ├── alerts.ts          # Alertas
│   │   └── reports.ts         # Relatórios
│   │
│   └── utils/                 # Utilitários
│       ├── logger.ts          # Logging
│       ├── encrypt.ts         # Criptografia
│       └── validators.ts      # Validações
│
├── tests/
│   ├── unit/                  # Testes unitários
│   │   ├── guardrails/
│   │   ├── ai/
│   │   └── utils/
│   ├── integration/           # Testes de integração
│   │   ├── bot/
│   │   └── api/
│   └── acceptance/            # Testes de aceitação (specs)
│       └── *.feature
│
├── specs/                     # SDD Specifications
├── scripts/                   # Scripts auxiliares
├── config/                    # Configurações
└── docs/                      # Documentação
```

---

## 4. Especificações de Código

### 4.1 Guard Rails - Interface Principal

```typescript
// src/guardrails/index.ts

interface GuardRailInput {
  message: string;
  userId: string;
  childId?: string;
}

interface GuardRailOutput {
  safe: boolean;
  layers: LayerResult[];
  blockedLayer?: string;
  reason?: string;
  confidence?: number;
}

interface LayerResult {
  name: string;
  passed: boolean;
  reason?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

class GuardRailsEngine {
  private layers: GuardRailLayer[];
  
  constructor(config: GuardRailConfig) {
    this.layers = [
      new FormatLayer(config.format),
      new InjectionLayer(config.injection),
      new ClassifierLayer(config.classifier),
      new KeywordsLayer(config.keywords),
      new SpamLayer(config.spam, redisClient),
      new OutputLayer(config.output),
    ];
  }

  async check(input: GuardRailInput): Promise<GuardRailOutput> {
    const results: LayerResult[] = [];
    
    for (const layer of this.layers) {
      const result = await layer.validate(input);
      results.push(result);
      
      if (!result.passed) {
        return {
          safe: false,
          layers: results,
          blockedLayer: layer.name,
          reason: result.reason,
          confidence: result.confidence,
        };
      }
    }
    
    return { safe: true, layers: results };
  }
}

export { GuardRailsEngine, GuardRailInput, GuardRailOutput, LayerResult };
```

### 4.2 Camada 3: Classificador de Conteúdo

```typescript
// src/guardrails/layers/classifier.ts

import OpenAI from 'openai';
import { GuardRailLayer, GuardRailInput, LayerResult } from '../types';

enum ContentCategory {
  SCHOOL = 'school',
  VIOLENCE = 'violence',
  SEXUAL = 'sexual',
  DRUGS = 'drugs',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other'
}

interface ClassificationResult {
  category: ContentCategory;
  confidence: number;
  flaggedCategories: string[];
}

class ClassifierLayer implements GuardRailLayer {
  name = 'classifier';
  private openai: OpenAI;
  private threshold: number;

  constructor(config: { threshold: number }) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.threshold = config.threshold;
  }

  async validate(input: GuardRailInput): Promise<LayerResult> {
    try {
      // 1. Usar OpenAI Moderation API (gratuito)
      const moderation = await this.openai.moderations.create({
        input: input.message,
      });

      const result = moderation.results[0];
      
      // 2. Verificar categorias flagged
      const flagged = Object.entries(result.categories)
        .filter(([_, value]) => value === true)
        .map(([key]) => key);

      // 3. Mapear categorias do OpenAI para nossas
      const category = this.mapCategory(flagged);
      
      // 4. Se categoria não for SCHOOL, bloquear
      if (category !== ContentCategory.SCHOOL) {
        return {
          name: this.name,
          passed: false,
          reason: `Conteúdo inadequado: ${category}`,
          confidence: result.flagged ? 0.9 : 0.5,
          metadata: { flagged: flagged, category },
        };
      }

      return {
        name: this.name,
        passed: true,
        confidence: 1 - (result.flagged ? 0.9 : 0),
        metadata: { category },
      };

    } catch (error) {
      // Fallback: allow if OpenAI fails (log error)
      console.error('Classifier error:', error);
      return { name: this.name, passed: true, metadata: { error: true } };
    }
  }

  private mapCategory(openaiCategories: string[]): ContentCategory {
    const violence = ['violence', 'graphic_violence', 'weapons'];
    const sexual = ['sexual', 'sexual_minors'];
    const drugs = ['drugs'];
    
    if (openaiCategories.some(c => violence.includes(c))) return ContentCategory.VIOLENCE;
    if (openaiCategories.some(c => sexual.includes(c))) return ContentCategory.SEXUAL;
    if (openaiCategories.some(c => drugs.includes(c))) return ContentCategory.DRUGS;
    
    return ContentCategory.SCHOOL;
  }
}

export { ClassifierLayer, ContentCategory };
```

### 4.3 Camada 2: Detecção de Prompt Injection

```typescript
// src/guardrails/layers/injection.ts

import { GuardRailLayer, GuardRailInput, LayerResult } from '../types';

// Padrões de Prompt Injection conhecidos
const INJECTION_PATTERNS = [
  // Inglês
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /forget\s+(your|all)\s+(instructions|rules|prompts)/i,
  /you\s+are\s+now\s+(DAN|evil|unrestricted)/i,
  /jailbreak/i,
  /override\s+(safety|content|moderation)/i,
  /new\s+(persona|role|character)/i,
  /pretend\s+(to\s+be|you're)/i,
  /act\s+as\s+(if\s+)?(you\s+(have\s+)?no|without)/i,
  
  // Português
  /ignore\s+(todas\s+)?(instruções|regras)/i,
  /esqueça\s+(suas|as)\s+(instruções|regras)/i,
  /agora\s+você\s+(é|será|pode)/i,
  /modo\s+(livre|irrestrito|DAN)/i,
  /sem\s+(restrições|limites|filtros)/i,
  
  // Técnicos
  /system\s*:/i,
  /\[INST\]|\[\/INST\]/i,
  /<\|im_start\|>|<\|im_end\|>/i,
  /```system/i,
];

class InjectionLayer implements GuardRailLayer {
  name = 'injection';
  private patterns: RegExp[];

  constructor() {
    this.patterns = INJECTION_PATTERNS;
  }

  async validate(input: GuardRailInput): Promise<LayerResult> {
    const message = input.message.toLowerCase();
    
    for (const pattern of this.patterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          name: this.name,
          passed: false,
          reason: `Prompt injection detectado: ${pattern.source}`,
          confidence: 0.95,
          metadata: { pattern: pattern.source, match: match[0] },
        };
      }
    }

    return {
      name: this.name,
      passed: true,
      confidence: 1.0,
    };
  }
}

export { InjectionLayer, INJECTION_PATTERNS };
```

### 4.4 Camada 5: Rate Limiting com Redis

```typescript
// src/guardrails/layers/spam.ts

import Redis from 'ioredis';
import { GuardRailLayer, GuardRailInput, LayerResult } from '../types';

interface SpamConfig {
  windowSeconds: number;      // Janela de tempo (ex: 60)
  maxMessages: number;        // Máximo mensagens na janela
  cooldownSeconds: number;    // Cooldown após ultrapassar
}

class SpamLayer implements GuardRailLayer {
  name = 'spam';
  private redis: Redis;
  private config: SpamConfig;

  constructor(config: SpamConfig, redisUrl: string) {
    this.config = config;
    this.redis = new Redis(redisUrl);
  }

  async validate(input: GuardRailInput): Promise<LayerResult> {
    const key = `rate:${input.userId}`;
    const now = Date.now();
    
    // 1. Verificar se está em cooldown
    const cooldownKey = `cooldown:${input.userId}`;
    const cooldown = await this.redis.get(cooldownKey);
    
    if (cooldown) {
      return {
        name: this.name,
        passed: false,
        reason: 'Aguarde um momento antes de enviar outra mensagem',
        confidence: 1.0,
        metadata: { cooldownRemaining: parseInt(cooldown) - now },
      };
    }

    // 2. Adicionar timestamp atual à lista
    await this.redis.zadd(key, now, now);
    
    // 3. Remover entries fora da janela
    const windowStart = now - (this.config.windowSeconds * 1000);
    await this.redis.zremrangebyscore(key, 0, windowStart);
    
    // 4. Contar mensagens na janela
    const count = await this.redis.zcard(key);
    
    // 5. Verificar limite
    if (count > this.config.maxMessages) {
      // Ativar cooldown
      const cooldownEnd = now + (this.config.cooldownSeconds * 1000);
      await this.redis.setex(cooldownKey, this.config.cooldownSeconds, cooldownEnd);
      
      return {
        name: this.name,
        passed: false,
        reason: 'Muitas mensagens. Aguarde um momento.',
        confidence: 1.0,
        metadata: { count, limit: this.config.maxMessages },
      };
    }

    return {
      name: this.name,
      passed: true,
      confidence: 1.0,
      metadata: { count, limit: this.config.maxMessages },
    };
  }

  async reset(userId: string): Promise<void> {
    await this.redis.del(`rate:${userId}`);
    await this.redis.del(`cooldown:${userId}`);
  }
}

export { SpamLayer, SpamConfig };
```

### 4.5 Bot Core - Message Handler

```typescript
// src/bot/handlers/child.ts

import { GuardRailsEngine } from '../../guardrails';
import { OpenAIClient } from '../../ai/client';
import { ConversationRepository } from '../../database/repositories/conversation';

interface ChildMessageContext {
  userId: string;
  childId?: string;
  message: string;
}

class ChildHandler {
  constructor(
    private guardrails: GuardRailsEngine,
    private ai: OpenAIClient,
    private conversationRepo: ConversationRepository
  ) {}

  async handleMessage(context: ChildMessageContext): Promise<string> {
    const { userId, childId, message } = context;

    // 1. Executar Guard Rails (Input)
    const guardResult = await this.guardrails.check({
      message,
      userId,
      childId,
    });

    // 2. Se bloqueado, retornar resposta amigável
    if (!guardResult.safe) {
      const friendlyResponse = this.getFriendlyBlockedResponse(guardResult.reason);
      
      await this.conversationRepo.create({
        userId,
        childId,
        input: message,
        output: friendlyResponse,
        status: 'blocked',
        blockReason: guardResult.reason,
        guardRailLayers: guardResult.layers,
      });

      return friendlyResponse;
    }

    // 3. Buscar histórico da conversa
    const history = await this.conversationRepo.getRecentHistory(userId, 10);

    // 4. Chamar OpenAI
    const aiResponse = await this.ai.chat({
      message,
      history,
      childId,
    });

    // 5. Verificar output (Camada 6)
    const outputCheck = await this.guardrails.checkOutput(aiResponse);
    
    if (!outputCheck.safe) {
      const safeResponse = this.getFallbackResponse();
      
      await this.conversationRepo.create({
        userId,
        childId,
        input: message,
        output: safeResponse,
        status: 'blocked',
        blockReason: 'output_blocked',
        guardRailLayers: [...guardResult.layers, outputCheck],
      });

      return safeResponse;
    }

    // 6. Salvar interação aprovada
    await this.conversationRepo.create({
      userId,
      childId,
      input: message,
      output: aiResponse,
      status: 'approved',
      guardRailLayers: [...guardResult.layers, outputCheck],
    });

    return aiResponse;
  }

  private getFriendlyBlockedResponse(reason?: string): string {
    if (reason?.includes('violence') || reason?.includes('harm')) {
      return `🛡️ Essa pergunta não é adequada.\n\nSe você está se sentindo mal, procure um adulto de confiança ou ligue para o CVV: 188.\n\nQue tal perguntar sobre ciências ou matemática? 📚`;
    }

    return `🛡️ Ops! Isso está fora do contexto escolar.\n\nQue tal perguntar sobre:\n• 🔬 Ciências\n• 📐 Matemática\n• 🌍 História\n• 📖 Português\n\n📚 O que você quer aprender?`;
  }

  private getFallbackResponse(): string {
    return `🤔 Ops! Não consegui processar sua pergunta.\n\nTente perguntar de novo ou escolha um assunto:\n• 🔬 Ciências\n• 📐 Matemática\n• 🌍 História`;
  }
}

export { ChildHandler };
```

---

## 5. Configuração de Ambiente

### 5.1 Variáveis de Ambiente (.env)

```bash
# Server
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/escolar_ai

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=sk-xxxxx
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=500

# WhatsApp (360dialog)
WHATSAPP_API_KEY=d360-xxxxx
WHATSAPP_WEBHOOK_URL=https://your-domain.com/api/webhook/whatsapp

# Guard Rails
GUARDRAIL_CLASSIFICATION_THRESHOLD=0.7
GUARDRAIL_OUTPUT_THRESHOLD=0.8
GUARDRAIL_SPAM_RATE_LIMIT=10
GUARDRAIL_SPAM_WINDOW_SECONDS=60

# Notifications
NOTIFICATION_THRESHOLD_PER_HOUR=3
```

### 5.2 Docker Compose (Desenvolvimento)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/escolar_ai
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: escolar_ai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      # Deploy to staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      # Deploy to production (with approval)
```

---

## 7. Monitoramento e Logging

### 7.1 Métricas Principais

| Métrica | Alerta | Threshold |
|---------|--------|-----------|
| **Error Rate** | Critical | > 5% |
| **Response Time (p95)** | Warning | > 5s |
| **Guard Rail Blocks/Hour** | Info | > 100 |
| **OpenAI API Errors** | Critical | > 10/min |
| **Database Connections** | Warning | > 80% pool |

### 7.2 Logging

```typescript
// src/utils/logger.ts

import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Estruturado para Guard Rails
const guardRailLogger = logger.child({ module: 'guardrails' });

export { logger, guardRailLogger };
```

---

## 8. Checklist de Implementação

### Fase 1: MVP (Semana 1-2)
- [ ] Setup projeto (Node.js, TypeScript, Fastify)
- [ ] Configurar Prisma + PostgreSQL
- [ ] Implementar Camada 1 (format)
- [ ] Implementar Camada 4 (keywords)
- [ ] Implementar Camada 5 (spam)
- [ ] Conectar WhatsApp (360dialog)
- [ ] System Prompt básico
- [ ] Comandos !help, !pai cadastrar

### Fase 2: Beta (Semana 3-4)
- [ ] Implementar Camada 2 (injection)
- [ ] Implementar Camada 3 (OpenAI Moderation)
- [ ] Implementar Camada 6 (output check)
- [ ] Histórico de conversas
- [ ] Relatórios semanais
- [ ] Dashboard básico

### Fase 3: Produção (Semana 5-6)
- [ ] Monitoramento (Datadog/NewRelic)
- [ ] Alertas configurados
- [ ] Backup automático DB
- [ ] LGPD compliance
- [ ] Security audit
- [ ] Load testing

---

*Próximo: [Tasks Specification](./04-tasks-spec.md)*
