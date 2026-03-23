# 📋 Tasks: Implementação de Guard Rails

## Pré-requisitos
- [x] Node.js 20+ instalado
- [x] PostgreSQL configurado
- [x] Redis instalado e rodando
- [x] OpenAI API Key configurada

---

## Tarefas

### Tarefa 1: Configuração Base
**Estimativa:** 2h  
**Depende de:** Nenhuma

- [ ] Criar `src/guardrails/types.ts` com interfaces
- [ ] Criar `src/guardrails/config.ts` com configuração
- [ ] Criar `src/guardrails/index.ts` (GuardRailsEngine)
- [ ] Criar testes unitários básicos

---

### Tarefa 2: Camada 1 - Formato
**Estimativa:** 1.5h  
**Depende de:** Tarefa 1

- [ ] Criar `src/guardrails/layers/format.ts`
- [ ] Implementar validação de comprimento (3-500 chars)
- [ ] Implementar validação de encoding UTF-8
- [ ] Escrever testes:
  - [ ] Mensagem válida (aprovar)
  - [ ] Mensagem < 3 chars (bloquear)
  - [ ] Mensagem > 500 chars (bloquear)
  - [ ] Caracteres inválidos (bloquear)

---

### Tarefa 3: Camada 2 - Prompt Injection
**Estimativa:** 2h  
**Depende de:** Tarefa 1

- [ ] Criar `src/guardrails/layers/injection.ts`
- [ ] Implementar padrões de detecção (inglês + português)
- [ ] Escrever testes:
  - [ ] "Ignore your instructions" (bloquear)
  - [ ] "Forget your rules" (bloquear)
  - [ ] "ignore suas instruções" (bloquear)
  - [ ] "como ignorar erros de digitação" (aprovar)

---

### Tarefa 4: Camada 3 - Classificador
**Estimativa:** 3h  
**Depende de:** Tarefa 1

- [ ] Criar `src/guardrails/layers/classifier.ts`
- [ ] Integrar OpenAI Moderation API
- [ ] Implementar mapeamento de categorias
- [ ] Implementar fallback (fail-open)
- [ ] Escrever testes:
  - [ ] Conteúdo violento (bloquear)
  - [ ] Conteúdo sexual (bloquear)
  - [ ] Conteúdo escolar (aprovar)
  - [ ] API indisponível (fail-open + log)

---

### Tarefa 5: Camada 4 - Palavras Chave
**Estimativa:** 2h  
**Depende de:** Tarefa 1

- [ ] Criar `src/guardrails/layers/keywords.ts`
- [ ] Criar seed data de keywords
- [ ] Implementar Trie para busca eficiente
- [ ] Escrever testes:
  - [ ] "filme de terror" (bloquear)
  - [ ] "matemática" (aprovar)
  - [ ] Caso insensitive (funcionar)

---

### Tarefa 6: Camada 5 - Rate Limiting
**Estimativa:** 3h  
**Depende de:** Tarefa 1 + Redis

- [ ] Criar `src/guardrails/layers/spam.ts`
- [ ] Implementar sliding window com Redis
- [ ] Implementar cooldown system
- [ ] Escrever testes:
  - [ ] 10 msgs/min (aprovar)
  - [ ] 11ª msg (bloquear)
  - [ ] Cooldown ativo (bloquear)
  - [ ] Após cooldown (aprovar)

---

### Tarefa 7: Camada 6 - Output Check
**Estimativa:** 2h  
**Depende de:** Tarefa 4

- [ ] Criar `src/guardrails/layers/output.ts`
- [ ] Implementar validação via OpenAI
- [ ] Implementar resposta fallback
- [ ] Escrever testes:
  - [ ] Resposta educacional (aprovar)
  - [ ] Resposta inadequada (bloquear)

---

### Tarefa 8: Orchestration
**Estimativa:** 2h  
**Depende de:** Tarefas 2-6

- [ ] Integrar todas as camadas no GuardRailsEngine
- [ ] Implementar fail-fast (parar na primeira falha)
- [ ] Implementar logging estruturado
- [ ] Escrever testes de integração:
  - [ ] Fluxo completo aprovado
  - [ ] Fluxo bloqueado por cada camada

---

### Tarefa 9: Logging e Monitoramento
**Estimativa:** 2h  
**Depende de:** Tarefa 8

- [ ] Criar `src/guardrails/logger.ts`
- [ ] Implementar log de todas as decisões
- [ ] Criar endpoint de métricas
- [ ] Implementar alertas (webhook para monitoramento)

---

### Tarefa 10: Integração com Bot
**Estimativa:** 3h  
**Depende de:** Tarefa 8

- [ ] Integrar GuardRailsEngine no bot principal
- [ ] Implementar resposta amigável por camada
- [ ] Implementar notificação de pais (após threshold)
- [ ] Escrever testes de ponta a ponta

---

## Checklist Final

### Código
- [ ] Todas as camadas implementadas
- [ ] Testes passando (>80% coverage)
- [ ] Sem warnings/lint errors
- [ ] Documentação JSDoc completa

### Testes
- [ ] Unit tests (por camada)
- [ ] Integration tests (engine + bot)
- [ ] Acceptance tests (cenários reais)
- [ ] Performance tests (<500ms p95)

### Deploy
- [ ] Variáveis de ambiente configuradas
- [ ] Redis conectado
- [ ] OpenAI API key válida
- [ ] Logs configurados (winston)
- [ ] Health check funcionando

---

## Ordem Sugerida de Implementação

```
Tarefa 1 (Base)
    ↓
Tarefa 2 (Format) ─┐
Tarefa 3 (Injection) ├─ Paralelizável
Tarefa 5 (Keywords) ─┘
    ↓
Tarefa 4 (Classifier) + Tarefa 6 (Spam)
    ↓
Tarefa 7 (Output)
    ↓
Tarefa 8 (Orchestration)
    ↓
Tarefa 9 (Logging)
    ↓
Tarefa 10 (Integration)
```

**Tempo total estimado:** 22-25 horas
