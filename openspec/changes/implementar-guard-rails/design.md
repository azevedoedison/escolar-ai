# 📋 Design Specification: Guard Rails

## Decisões Arquitetônicas

### ADR-001: Ordem das Camadas
**Status:** Aprovada  
**Contexto:** Ordem das camadas afeta performance e segurança  
**Decisão:** Ordem cronológica: format → injection → classifier → keywords → spam  
**Racional:** 
- Formato primeiro (mais barato)
- Injection segundo (segurança crítica)
- Classifier terceiro (OpenAI Moderation API - mais caro)
- Keywords quarto (fallback rápido)
- Spam último (verificação por tempo)

---

### ADR-002: OpenAI Moderation API vs Llama Guard
**Status:** Aprovada  
**Contexto:** Qual serviço usar para classificação de conteúdo  
**Decisão:** OpenAI Moderation API (primário) + fallback Llama Guard  
**Racional:**
- OpenAI Moderation é gratuito
- Sem necessidade de hospedagem adicional
- Llama Guard como fallback (self-hosted, mais custoso)

---

### ADR-003: Redis para Rate Limiting
**Status:** Aprovada  
**Contexto:** Armazenar contadores de rate limiting  
**Decisão:** Redis com sliding window algorithm  
**Racional:**
- Performático (operações atômicas)
- TTL automático (expiração de chaves)
- Suporte a sorted sets (sliding window)

---

### ADR-004: Falha Graceful
**Status:** Aprovada  
**Contexto:** O que acontece quando uma camada falha?  
**Decisão:** Log do erro + aprovar mensagem (fail-open)  
**Racional:**
- Não bloquear comunicação legítima por erro técnico
- Monitorar erros e ajustar thresholds
- Fase MVP: fail-open; Fase Produção: fail-closed crítico

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    GUARD RAILS ENGINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT FLOW                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  FORMAT  │→ │INJECTION │→ │CLASSIFIER│→ │KEYWORDS  │       │
│  │ Layer 1  │  │ Layer 2  │  │ Layer 3  │  │ Layer 4  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│       ↓              ↓              ↓              ↓            │
│       │              │              │              │            │
│       └──────────────┴──────────────┴──────────────┘            │
│                            ↓                                    │
│                     ┌──────────┐                                │
│                     │   SPAM   │                                │
│                     │ Layer 5  │                                │
│                     └──────────┘                                │
│                            ↓                                    │
│                   [OPENAI GPT-4o-mini]                          │
│                            ↓                                    │
│                     ┌──────────┐                                │
│                     │  OUTPUT  │                                │
│                     │ Layer 6  │                                │
│                     └──────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Interfaces

### GuardRailLayer (Interface Base)
```typescript
interface GuardRailLayer {
  name: string;
  validate(input: GuardRailInput): Promise<LayerResult>;
}
```

### GuardRailInput
```typescript
interface GuardRailInput {
  message: string;
  userId: string;
  childId?: string;
}
```

### LayerResult
```typescript
interface LayerResult {
  name: string;
  passed: boolean;
  reason?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}
```

### GuardRailOutput
```typescript
interface GuardRailOutput {
  safe: boolean;
  layers: LayerResult[];
  blockedLayer?: string;
  reason?: string;
  confidence?: number;
}
```

---

## Dependências

| Pacote | Uso | Justificativa |
|--------|-----|---------------|
| `openai` | Moderation API | Grátis, eficiente |
| `ioredis` | Rate limiting | Performance, Atomicity |
| `sanitize-html` | Limpeza de input | Prevenção XSS/injection |
| `winston` | Logging | Structured logs |

---

## Configuração

```typescript
// config/guardrails.ts
export const GUARDRAIL_CONFIG = {
  format: {
    minLength: 3,
    maxLength: 500,
  },
  classifier: {
    threshold: 0.7,
    categories: ['violence', 'sexual', 'drugs', 'hate'],
  },
  spam: {
    windowSeconds: 60,
    maxMessages: 10,
    cooldownSeconds: 30,
  },
  notifications: {
    thresholdPerHour: 3,
  },
};
```

---

## Testes

### Unit Tests (por camada)
- `tests/unit/guardrails/format.test.ts`
- `tests/unit/guardrails/injection.test.ts`
- `tests/unit/guardrails/classifier.test.ts`
- `tests/unit/guardrails/keywords.test.ts`
- `tests/unit/guardrails/spam.test.ts`
- `tests/unit/guardrails/output.test.ts`

### Integration Tests (fluxo completo)
- `tests/integration/guardrails/engine.test.ts`
- `tests/integration/bot/message-handler.test.ts`

### Acceptance Tests (cenários)
- `tests/acceptance/school-question.test.ts`
- `tests/acceptance/violence-block.test.ts`
- `tests/acceptance/spam-limit.test.ts`

---

## Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| OpenAI API down | Alto | Baixa | Fallback Llama Guard |
| Muitos false positives | Médio | Média | Ajustar thresholds |
| Prompt injection avançado | Crítico | Baixa | Camada 2 + Monitoramento |
| Rate limiting bypass | Médio | Baixa | Multi-layer rate limiting |

---

## Métricas de Sucesso

| Métrica | Target |
|---------|--------|
| False Positive Rate | < 5% |
| False Negative Rate | < 1% |
| Detection Time (p95) | < 500ms |
| Parent Notification Time | < 5 min |
| API Uptime | 99.9% |
