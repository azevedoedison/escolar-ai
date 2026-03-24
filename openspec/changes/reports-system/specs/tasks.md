# 📋 Tasks: Reports System

## Sprint: Reports (1-2 dias)

---

### Tarefa 001: ReportGenerator
| Campo | Valor |
|-------|-------|
| **ID** | T-001 |
| **Spec Ref** | functional.md §1 |
| **Prioridade** | 🔴 Critical |
| **Estimativa** | 3 horas |
| **Depende de** | Tarefa 7 (conversas) |

**Checklist:**
- [ ] Criar `src/reports/generator.js`
- [ ] Implementar `generateWeeklyReport(parentId, startDate, endDate)`
- [ ] Implementar `calculateChildStats(childId, startDate, endDate)`
- [ ] Implementar `extractTopTopics(childId, startDate, endDate)`
- [ ] Implementar `calculateComparison(childId, current, previous)`
- [ ] Implementar `formatTimeFromTokens(tokens)`
- [ ] Escrever testes unitários

---

### Tarefa 002: AlertDetector
| Campo | Valor |
|-------|-------|
| **ID** | T-002 |
| **Spec Ref** | functional.md §2 |
| **Prioridade** | 🔴 Critical |
| **Estimativa** | 2 horas |
| **Depende de** | Tarefa 7 (conversas) |

**Checklist:**
- [ ] Criar `src/reports/alert-detector.js`
- [ ] Implementar `recordBlock(childId, blockData)`
- [ ] Implementar `checkThreshold(childId)` — 3 bloqueios/hora
- [ ] Implementar `shouldSendAlert(childId)` — cooldown 1 hora
- [ ] Implementar `sendAlert(parentId, childId, attempts)`
- [ ] Escrever testes unitários

---

### Tarefa 003: EmailSender
| Campo | Valor |
|-------|-------|
| **ID** | T-003 |
| **Spec Ref** | functional.md §1.2 |
| **Prioridade** | 🟡 High |
| **Estimativa** | 2 horas |
| **Depende de** | T-001, T-002 |

**Checklist:**
- [ ] Criar `src/reports/email-sender.js`
- [ ] Configurar Nodemailer (reutilizar SMTP do .env)
- [ ] Implementar `sendWeeklyReport(parentEmail, report)`
- [ ] Implementar `sendAlert(parentEmail, alert)`
- [ ] Criar templates HTML (report + alert)
- [ ] Escrever testes

---

### Tarefa 004: Topic Extraction
| Campo | Valor |
|-------|-------|
| **ID** | T-004 |
| **Spec Ref** | technical.md §3 |
| **Prioridade** | 🟡 High |
| **Estimativa** | 1 hora |
| **Depende de** | T-001 |

**Checklist:**
- [ ] Criar `src/reports/topics.js`
- [ ] Mapear keywords por disciplina (Ciências, Matemática, etc.)
- [ ] Implementar `extractTopics(conversations)`
- [ ] Retornar top 3 com percentual
- [ ] Escrever testes

---

### Tarefa 005: Report API
| Campo | Valor |
|-------|-------|
| **ID** | T-005 |
| **Spec Ref** | functional.md §3 |
| **Prioridade** | 🟡 High |
| **Estimativa** | 2 horas |
| **Depende de** | T-001, T-004 |

**Checklist:**
- [ ] Criar `src/api/routes/reports.js`
- [ ] Implementar `GET /api/reports/:parentId/weekly`
- [ ] Implementar `GET /api/conversations/:childId/alerts`
- [ ] Autenticação (authenticateParent)
- [ ] Integração com server.js
- [ ] Escrever testes de integração

---

### Tarefa 006: Cron Job (Relatório Semanal)
| Campo | Valor |
|-------|-------|
| **ID** | T-006 |
| **Spec Ref** | functional.md §1.1 |
| **Prioridade** | 🔴 Critical |
| **Estimativa** | 1 hora |
| **Depende de** | T-001, T-003 |

**Checklist:**
- [ ] Criar script `scripts/weekly-report.js`
- [ ] Buscar todos os pais ativos
- [ ] Gerar relatório para cada um
- [ ] Enviar emails
- [ ] Configurar OpenClaw cron (segundas 09:00)
- [ ] Log de sucessos/falhas

---

## 📊 Resumo

| Tarefa | Estimativa | Prioridade |
|--------|------------|------------|
| T-001 ReportGenerator | 3h | 🔴 Critical |
| T-002 AlertDetector | 2h | 🔴 Critical |
| T-003 EmailSender | 2h | 🟡 High |
| T-004 Topic Extraction | 1h | 🟡 High |
| T-005 Report API | 2h | 🟡 High |
| T-006 Cron Job | 1h | 🔴 Critical |
| **TOTAL** | **11h** | ~2 dias |

---

## 🎯 Order of Implementation (TDD)

1. **T-001** ReportGenerator (testes → código)
2. **T-004** Topic Extraction (testes → código)
3. **T-002** AlertDetector (testes → código)
4. **T-005** Report API (testes → código)
5. **T-003** EmailSender (testes → código)
6. **T-006** Cron Job (integração)
