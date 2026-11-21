# 📋 Design Specification: RAG com Cloudflare AutoRAG

---

## ADR-RAG-001: Serviço RAG

**Status:** Aprovada (ATUALIZADA)  
**Data:** 2026-03-23

### Decisão
Usar **Cloudflare AutoRAG** ao invés de RAG self-hosted.

### Racional
- 80% menos código para manter
- Beta gratuito = MVP sem custo
- Scaling automático
- Foco no bot, não na infra

---

## ADR-RAG-002: Arquitetura Simplificada

**Status:** Aprovada  
**Data:** 2026-03-23

### Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENTES                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. CLOUDFLARE R2 (Storage)                                 │
│     └── Armazena PDFs das apostilas                         │
│                                                             │
│  2. CLOUDFLARE AUTORAG                                      │
│     ├── Chunking automático                                 │
│     ├── Embeddings (Workers AI)                             │
│     ├── Vector Store (Vize)                                 │
│     ├── Busca semântica                                     │
│     └── Geração de resposta (LLM)                           │
│                                                             │
│  3. NOSSO BOT (Node.js)                                     │
│     ├── WhatsApp integration                                │
│     ├── Guard Rails (camada extra)                          │
│     └── AutoRAG API client                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ADR-RAG-003: Integração API

**Status:** Aprovada  
**Data:** 2026-03-23

### Endpoints Cloudflare AutoRAG

```
POST /autorag/search
- Busca semântica + geração de resposta
- Body: { query, max_results, filters }

POST /r2/upload
- Upload de PDF para R2
- Body: multipart/form-data

GET /autorag/pipelines
- Listar pipelines configurados
```

### Interface do Nosso Código

```typescript
// src/rag/autorag.ts

interface AutoRAGConfig {
  accountId: string;
  apiKey: string;
  pipelineName: string;  // "escolar-ai"
}

interface SearchRequest {
  query: string;
  childId?: string;
  maxResults?: number;
}

interface SearchResult {
  answer: string;           // Resposta gerada
  citations: Citation[];    // Referências (página, apostila)
  sources: Source[];        // Chunks encontrados
}

interface Citation {
  text: string;
  source: string;          // Nome do PDF
  page: number;
}

class AutoRAGService {
  constructor(private config: AutoRAGConfig) {}

  async uploadApostila(
    pdf: Buffer, 
    metadata: { childId: string; materia: string; fileName: string }
  ): Promise<{ success: boolean; chunks: number }>;

  async search(request: SearchRequest): Promise<SearchResult>;
  
  async deleteApostila(apostilaId: string): Promise<void>;
}
```

---

## ADR-RAG-004: Guard Rails + RAG

**Status:** Aprovada  
**Data:** 2026-03-23

### Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO COM RAG + GUARD RAILS              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Criança: "O que é fotossíntese?"                           │
│           ↓                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ GUARD RAILS (Input)                                  │   │
│  │ • Camada 1: Formato ✓                                │   │
│  │ • Camada 2: Injection ✓                              │   │
│  │ • Camada 3: Classificação ✓                          │   │
│  │ • Camada 4: Keywords ✓                               │   │
│  │ • Camada 5: Rate limit ✓                             │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │ Aprovado                         │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ AUTORAG                                               │   │
│  │ • Busca na apostila                                   │   │
│  │ • Encontra contexto (pág. 45)                         │   │
│  │ • Gera resposta com citação                           │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ GUARD RAILS (Output)                                 │   │
│  │ • Verifica se resposta é educacional ✓               │   │
│  │ • Verifica se cita fonte ✓                           │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │ Aprovado                         │
│                          ▼                                  │
│  Resposta: "Segundo sua apostila de Ciências,             │
│  fotossíntese é como se a planta fosse uma                │
│  fábrica! 🌱 (pág. 45)"                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ADR-RAG-005: Setup Cloudflare

**Status:** Aprovada  
**Data:** 2026-03-23

### Passos de Configuração

1. **Criar conta Cloudflare** (gratuito)
   - https://dash.cloudflare.com/sign-up

2. **Criar R2 Bucket**
   - Nome: `escolar-ai-apostilas`
   - Locality: Standard

3. **Configurar AutoRAG**
   - Dashboard → AI → AutoRAG
   - Criar pipeline: `escolar-ai`
   - Configurar embedding model: Workers AI
   - Configurar LLM: Workers AI (@cf/meta/llama-3.1-8b-instruct)

4. **Obter credenciais**
   - Account ID: `{found in dashboard}`
   - API Token: `{create with R2 edit + AutoRAG read/write}`

5. **Configurar no projeto**
   ```env
   CLOUDFLARE_ACCOUNT_ID=xxx
   CLOUDFLARE_API_TOKEN=xxx
   AUTORAG_PIPELINE_NAME=escolar-ai
   ```

---

## ADR-RAG-006: Custo e Limits

**Status:** Aprovada  
**Data:** 2026-03-23

### Free Tier (Open Beta)

| Recurso | Limite |
|---------|--------|
| AutoRAG | Ilimitado (beta) |
| R2 Storage | 10 GB |
| Workers AI | 10k queries/dia |
| Requests | 100k/dia |

### Quando sair do beta (estimado)

| Recurso | Preço estimado |
|---------|---------------|
| AutoRAG | $0.01/query |
| R2 Storage | $0.015/GB/mês |
| Workers AI | $0.01/1k tokens |

### Projeção (1.000 crianças ativas)

```
Queries/dia: ~5.000
Queries/mês: ~150.000

Custo estimado:
- AutoRAG: 150k × $0.01 = $1.500
- R2: 50GB × $0.015 = $0.75
- Workers: $5

Total: ~$1.510/mês
```

**Nota:** Para escalar, podemos:
1. Usar cache (Redis) para reduzir queries
2. Migrar para self-hosted se necessário
3. Negociar plano enterprise

---

## Métricas de Sucesso

| Métrica | Target |
|---------|--------|
| Upload success rate | > 99% |
| Search relevance | > 90% |
| Response latency (p95) | < 2s |
| Cost per query | < $0.01 |
| Uptime | 99.9% |
