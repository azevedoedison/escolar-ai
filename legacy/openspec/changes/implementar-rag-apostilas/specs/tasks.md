# 📋 Tasks: RAG com Cloudflare AutoRAG

## Pré-requisitos
- [ ] Conta Cloudflare gratuita
- [ ] Node.js 20+
- [ ] Acceso ao projeto Escolar AI

---

## Tarefas

### Tarefa AUTORAG-01: Setup Cloudflare
**Estimativa:** 1h  
**Depende de:** Nenhuma

- [ ] Criar conta Cloudflare (gratuito)
- [ ] Criar R2 Bucket: `escolar-ai-apostilas`
- [ ] Configurar AutoRAG pipeline: `escolar-ai`
- [ ] Criar API Token (R2 edit + AutoRAG)
- [ ] Copiar Account ID
- [ ] Criar `.env` com credenciais

```env
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
AUTORAG_PIPELINE_NAME=escolar-ai
R2_BUCKET_NAME=escolar-ai-apostilas
```

---

### Tarefa AUTORAG-02: AutoRAG Service
**Estimativa:** 2h  
**Depende de:** Tarefa AUTORAG-01

- [ ] Criar `src/rag/autorag.ts`
- [ ] Implementar classe AutoRAGService
- [ ] Implementar `uploadApostila()`
- [ ] Implementar `search()`
- [ ] Implementar `deleteApostila()`
- [ ] Implementar tratamento de erros
- [ ] Escrever testes:

```typescript
describe('AutoRAGService', () => {
  it('should upload PDF and return success', async () => {});
  it('should search and return answer with citations', async () => {});
  it('should handle API errors gracefully', async () => {});
  it('should return empty when no context found', async () => {});
});
```

---

### Tarefa AUTORAG-03: Upload API
**Estimativa:** 2h  
**Depende de:** Tarefa AUTORAG-02

- [ ] Criar `src/api/routes/apostilas.ts`
- [ ] Implementar POST `/api/apostilas/upload`
- [ ] Implementar validação de PDF (max 50MB)
- [ ] Implementar metadados (childId, materia)
- [ ] Implementar feedback de progresso
- [ ] Escrever testes de integração:

```typescript
describe('POST /api/apostilas/upload', () => {
  it('should upload valid PDF', async () => {});
  it('should reject invalid file type', async () => {});
  it('should reject file > 50MB', async () => {});
});
```

---

### Tarefa AUTORAG-04: Bot Integration
**Estimativa:** 2h  
**Depende de:** Tarefa AUTORAG-02

- [ ] Criar `src/bot/rag-handler.ts`
- [ ] Modificar `ChildHandler` para usar AutoRAG
- [ ] Implementar System Prompt com contexto
- [ ] Implementar fallback (sem contexto)
- [ ] Formatar resposta com citações
- [ ] Escrever testes:

```typescript
describe('RAG-enabled ChildHandler', () => {
  it('should return answer from apostila with citation', async () => {});
  it('should return fallback when no context', async () => {});
  it('should still apply Guard Rails', async () => {});
});
```

---

### Tarefa AUTORAG-05: Dashboard Upload
**Estimativa:** 3h  
**Depende de:** Tarefa AUTORAG-03

- [ ] Criar componente de upload no dashboard
- [ ] Implementar drag-and-drop de PDF
- [ ] Implementar seleção de criança
- [ ] Implementar seleção de matéria
- [ ] Implementar barra de progresso
- [ ] Implementar lista de apostilas
- [ ] Implementar botão de remover
- [ ] Escrever testes E2E:

```typescript
describe('Apostila Upload Flow', () => {
  it('should upload and show in list', async () => {});
  it('should show processing status', async () => {});
  it('should allow deletion', async () => {});
});
```

---

### Tarefa AUTORAG-06: WhatsApp Upload (Opcional)
**Estimativa:** 2h  
**Depende de:** Tarefa AUTORAG-03

- [ ] Implementar comando `!pai upload`
- [ ] Implementar接收 de PDF via WhatsApp
- [ ] Implementar confirmação de upload
- [ ] Escrever testes:

```typescript
describe('WhatsApp Upload', () => {
  it('should accept PDF via WhatsApp', async () => {});
  it('should confirm upload to parent', async () => {});
});
```

---

### Tarefa AUTORAG-07: Testing & Documentation
**Estimativa:** 2h  
**Depende de:** Todas as anteriores

- [ ] Testes E2E completos
- [ ] Testes de performance
- [ ] Documentação de setup
- [ ] Documentação de API
- [ ] README de RAG

---

## Ordem Sugerida

```
AUTORAG-01 (Setup Cloudflare)
    ↓
AUTORAG-02 (AutoRAG Service)
    ↓
AUTORAG-03 (Upload API) ─┐
AUTORAG-04 (Bot Integração)┤ Paralelo
AUTORAG-05 (Dashboard) ───┘
    ↓
AUTORAG-06 (WhatsApp - Opcional)
    ↓
AUTORAG-07 (Testing)
```

**Tempo total estimado:** 12-14 horas (vs 28-32h do zero)

---

## Checklist de Entrega

### MVP
- [ ] Cloudflare configurado
- [ ] AutoRAG pipeline ativo
- [ ] Upload de PDF funcionando
- [ ] Bot respondendo com contexto
- [ ] Guard Rails ativo

### Teste Real
- [ ] Upload apostila de teste
- [ ] Criança faz pergunta
- [ ] Resposta vem da apostila
- [ ] Citação correta (página)
- [ ] Fallback quando não encontra

---

## Referências

- [Cloudflare AutoRAG Docs](https://developers.cloudflare.com/ai-search/)
- [AutoRAG API Reference](https://developers.cloudflare.com/ai-search/api/)
- [R2 Storage Docs](https://developers.cloudflare.com/r2/)
