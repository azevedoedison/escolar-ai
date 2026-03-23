# 📋 Tasks: Web First MVP

---

## ✅ Concluídas
- [x] Tarefa 0: Interface HTML/CSS ChatGPT style
- [x] Tarefa 1: JS Frontend (chat interativo)
- [x] Tarefa 2: Express API (/api/chat)
- [x] Tarefa 3: Guard Rails integrado
- [x] Tarefa 4: OpenRouter + Ollama fallback

---

## ⏳ Pendentes

### Tarefa 5: SQLite + Persistência
**Estimativa:** 2h

- [ ] Instalar better-sqlite3
- [ ] Criar tabelas (users, conversations)
- [ ] Salvar todas as conversas
- [ ] Salvar bloqueios com motivo

### Tarefa 6: Login Simples
**Estimativa:** 2h

- [ ] Formulário de nome
- [ ] Seleção criança/pai
- [ ] Salvar sessão (localStorage)
- [ ] Identificar usuário nas requisições

### Tarefa 7: Dashboard Pai
**Estimativa:** 3h

- [ ] Página /pai
- [ ] Lista de filhos
- [ ] Histórico de conversas
- [ ] Alertas de bloqueios
- [ ] Filtro por data

### Tarefa 8: Interface Admin
**Estimativa:** 2h

- [ ] Página /admin
- [ ] Gerenciar keywords bloqueadas
- [ ] Ver estatísticas
- [ ] Logs do sistema

### Tarefa 9: Testes com Filha
**Estimativa:** 2h

- [ ] Teste fluxo completo
- [ ] Ajustar respostas
- [ ] Corrigir bugs
- [ ] Validar Guard Rails

### Tarefa 10: Deploy Local Definitivo
**Estimativa:** 1h

- [ ] Script de inicio
- [ ] Configuração .env
- [ ] Documentação README
- [ ] Testes finais

---

## 📊 Resumo

| Status | Tarefas | Tempo |
|--------|---------|-------|
| ✅ Concluídas | 5 | 8h |
| ⏳ Pendentes | 5 | 10h |
| **Total** | **10** | **18h** |

---

## Próximos Passos

1. **HOJE:** Testar interface atual (localhost:3000)
2. **AMANHÃ:** SQLite + Login + Dashboard
3. **DIA 3:** Testes com filha

---

## 📋 Fase 2 - Arquitetura RAG Platform (Inspiração)

**Referência:** github.com/CiceroDeveloper01/rag-platform

### Components para Adotar (Fase 2)

#### 1. BullMQ para Fila de Mensagens
```javascript
// inbound-messages queue
// flow-execution queue
// Processar respostas sem bloquear UI
```

#### 2. Status Tracking
```
PENDING → PROCESSING → COMPLETED/FAILED
Para apostilas em upload
```

#### 3. Dead-Letter Queue
```
Retry com limite → DLQ após falhas
Não perder mensagens de crianças
```

#### 4. Observabilidade
```
Prometheus + Grafana
- Quantas perguntas por hora
- Quantas bloqueadas por Guard Rails
- Tempo de resposta
- Custo por pergunta
```

#### 5. Service-to-Service Auth
```
api-web → api-business (JWT)
Orchestrator → API (service token)
```

### Arquitetura Fase 2
```
Browser → api-web → api-business → Orchestrator
                                           ↓
                                    BullMQ queues
                                           ↓
                                    RAG (pgvector)
```

### Timeline Fase 2
- MVP validado com filha ✅
- BullMQ setup (4h)
- Observabilidade (4h)
- Dashboard pai (6h)
- Deploy cloud (4h)
- **Total: ~18h**

---

*Anotado: 23/03/2026 - RAG Platform insights para Fase 2*
