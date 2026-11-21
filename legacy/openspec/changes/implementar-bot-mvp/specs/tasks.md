# 📋 Tasks: WhatsApp Bot Direto (MVP)

---

## Pré-requisitos
- [ ] Conta 360dialog (WhatsApp Business API)
- [ ] Conta OpenAI (API key)
- [ ] Conta Cloudflare (AutoRAG)
- [ ] PostgreSQL (Supabase free)
- [ ] Node.js 20+

---

## Tarefa MVP-01: Setup do Projeto
**Estimativa:** 3h

- [ ] Inicializar projeto Node.js
- [ ] Instalar dependências:
  - [ ] `whatsapp-web.js` ou `@360dialog/whatsapp-api`
  - [ ] `openai`
  - [ ] `prisma`
  - [ ] `express` (webhook)
- [ ] Configurar Prisma schema
- [ ] Criar `.env` com credenciais
- [ ] Criar estrutura de pastas

```bash
npm init -y
npm install whatsapp-web.js openai @prisma/client
npm install -D prisma
```

---

## Tarefa MVP-02: Guard Rails
**Estimativa:** 4h

- [ ] Copiar implementação existente (`src/guardrails/`)
- [ ] Camada 1: Formato ✓ (já existe)
- [ ] Camada 2: Prompt Injection
- [ ] Camada 3: OpenAI Moderation
- [ ] Camada 4: Keywords
- [ ] Camada 5: Rate Limiting (Redis)
- [ ] Camada 6: Output Check
- [ ] Escrever testes

---

## Tarefa MVP-03: AutoRAG Integration
**Estimativa:** 2h

- [ ] Criar `src/rag/autorag.js`
- [ ] Implementar upload de PDF
- [ ] Implementar search
- [ ] Configurar pipeline na Cloudflare
- [ ] Testar com apostila real

```javascript
// src/rag/autorag.js
class AutoRAGService {
  async search(query, childId) { }
  async uploadPDF(pdf, metadata) { }
}
```

---

## Tarefa MVP-04: WhatsApp Bot
**Estimativa:** 4h

- [ ] Criar `src/bot/whatsapp.js`
- [ ] Configurar 360dialog client
- [ ] Implementar message handler
- [ ] Integrar Guard Rails
- [ ] Integrar AutoRAG
- [ ] Integrar OpenAI
- [ ] Implementar respostas amigáveis

```javascript
// src/bot/handlers/child.js
async function handleChildMessage(message) {
  // 1. Guard Rails
  // 2. AutoRAG search
  // 3. OpenAI chat
  // 4. Guard Rails output
  // 5. Send response
  // 6. Log to database
}
```

---

## Tarefa MVP-05: Controle Parental
**Estimativa:** 3h

- [ ] Criar `src/bot/handlers/parent.js`
- [ ] Implementar `!pai cadastrar`
- [ ] Implementar `!pai filhos`
- [ ] Implementar `!pai relatorio`
- [ ] Implementar `!pai alertas`
- [ ] Implementar alertas automáticos (3 bloqueios/hora)

```javascript
// src/bot/handlers/parent.js
const commands = {
  '!pai cadastrar': cadastrarFilho,
  '!pai filhos': listarFilhos,
  '!pai relatorio': enviarRelatorio,
  '!pai alertas': listarAlertas,
};
```

---

## Tarefa MVP-06: Database
**Estimativa:** 2h

- [ ] Criar Prisma schema
- [ ] Tabelas: users, children, conversations, guardrail_logs
- [ ] Criar migrations
- [ ] Implementar repository functions

```prisma
model Child {
  id        String   @id @default(uuid())
  name      String
  age       Int
  grade     String?
  parentId  String
  // ...
}

model Conversation {
  id        String   @id @default(uuid())
  input     String
  output    String?
  status    String
  // ...
}
```

---

## Tarefa MVP-07: Deploy
**Estimativa:** 3h

- [ ] Provisionar VPS (DigitalOcean/Railway)
- [ ] Configurar Node.js
- [ ] Configurar PostgreSQL
- [ ] Configurar Redis
- [ ] Deploy do código
- [ ] Configurar PM2 (process manager)
- [ ] Configurar webhook 360dialog
- [ ] Testar em produção

---

## Tarefa MVP-08: Testes Finais
**Estimativa:** 3h

- [ ] Teste completo com filha
- [ ] Teste de Guard Rails (cenários perigosos)
- [ ] Teste de RAG (upload apostila)
- [ ] Teste de controle parental
- [ ] Fix bugs encontrados
- [ ] Documentar setup

---

## Resumo

| Tarefa | Estimativa |
|--------|-----------|
| MVP-01: Setup | 3h |
| MVP-02: Guard Rails | 4h |
| MVP-03: AutoRAG | 2h |
| MVP-04: WhatsApp Bot | 4h |
| MVP-05: Controle Parental | 3h |
| MVP-06: Database | 2h |
| MVP-07: Deploy | 3h |
| MVP-08: Testes | 3h |
| **TOTAL** | **24h (~3 dias)** |

---

## Ordem de Execução

```
MVP-01 (Setup)
    ↓
MVP-02 (Guard Rails) ─┐
MVP-03 (AutoRAG)      ├─ Paralelo
MVP-06 (Database)     ┘
    ↓
MVP-04 (Bot Integration)
    ↓
MVP-05 (Controle Parental)
    ↓
MVP-07 (Deploy)
    ↓
MVP-08 (Testes)
```

---

## Entregável

Bot WhatsApp funcional que:
1. Criança faz pergunta → Resposta da apostila
2. Conteúdo inadequado → Bloqueado
3. Pai recebe alertas → WhatsApp
4. Relatório semanal → WhatsApp

**Custo mensal:** ~R$ 80
**Validação:** Com sua filha + 50 famílias beta

---

## 💡 Ideas do Edison (Futuro)

### Guard Rails Dinâmicos
- Criar testes unitários baseados nas mensagens reais das crianças
- Atualizar validações continuamente (o que pode/não pode)
- Aprendizado com contexto das interações

### Controle Parental - Histórico
- Interface para pais verem histórico completo
- Opções: Email, Dashboard web, relatório no WhatsApp
- Auditoria do que crianças pesquisaram
