# 📋 Proposal: RAG com Apostilas PDF (Cloudflare AutoRAG)

## Resumo
Implementar sistema RAG usando **Cloudflare AutoRAG** (serviço gerenciado) para restringir respostas da IA ao conteúdo das apostilas escolares, sem gerenciar infraestrutura.

---

## Por que Cloudflare AutoRAG?

### ❌ RAG do Zero (Complexo)
```
PDF Parser → Chunking → Embeddings → Vector DB → Search → LLM
     ↓           ↓           ↓           ↓          ↓        ↓
  pdf-parse  manual    Ollama/OpenAI  ChromaDB   código   OpenAI
  tesseract                                    próprio
```
**Custo de desenvolvimento:** 28-32 horas  
**Manutenção:** Infra, upgrades, scaling

### ✅ Cloudflare AutoRAG (Simples)
```
Upload PDF → AutoRAG API → Resposta
    ↓              ↓          ↓
  R2 Storage   Cloudflare   Pronto
```
**Custo de desenvolvimento:** 4-6 horas  
**Manutenção:** Quase zero

---

## Comparação: RAG Próprio vs Cloudflare AutoRAG

| Aspecto | RAG Próprio | Cloudflare AutoRAG |
|---------|-------------|-------------------|
| **Setup** | 28-32h | 4-6h |
| **Infra** | Própria (Ollama, ChromaDB) | Gerenciada |
| **Scaling** | Manual | Automática |
| **Custo MVP** | R$ 0 | R$ 0 (beta) |
| **Custo Produção** | R$ 50-100/mês | ~R$ 50/mês |
| **Manutenção** | Alta | Baixa |
| **Lock-in** | Nenhum | Cloudflare |

---

## Por que NÃO é problema usar Cloudflare?

### Objecção: "Dependência de fornecedor"
**Resposta:** 
- API REST padrão (fácil migrar depois)
- MVP é para VALIDAR (se funcionar, migramos se precisar)
- Beta gratuito = custo zero para testar

### Objecção: "Dados de crianças na Cloud?"
**Resposta:**
- Cloudflare tem compliance COPPA/GDPR
- Dados no Brasil (edge locations em São Paulo)
- Apostilas são públicas (não são PII)

---

## Arquitetura Simplificada

```
┌─────────────────────────────────────────────────────────────┐
│            ESGOLAR AI + CLOUDFLARE AUTORAG                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📱 PAI (Upload Apostila)                                   │
│     │                                                       │
│     ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Cloudflare R2 (Storage de PDFs)            │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Cloudflare AutoRAG (Processamento)         │   │
│  │                                                       │   │
│  │  • Chunking automático                                │   │
│  │  • Embeddings (Workers AI)                            │   │
│  │  • Vector Store (Vize vectorize)                      │   │
│  │  • Busca semântica                                    │   │
│  │  • Geração de resposta                                │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Nosso Bot (Node.js)                        │   │
│  │                                                       │   │
│  │  1. Criança pergunta                                   │   │
│  │  2. Chama AutoRAG API                                  │   │
│  │  3. Recebe resposta com contexto                       │   │
│  │  4. Aplica Guard Rails (camada extra)                  │   │
│  │  5. Envia para criança                                 │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           WhatsApp (Criança)                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## O que MUDA

### Adicionar
- Cloudflare account (gratuito)
- R2 Bucket para PDFs
- AutoRAG instance
- API calls para AutoRAG

### Remover (do original)
- ~~pdf-parse~~
- ~~tesseract.js~~
- ~~ChromaDB~~
- ~~Ollama embeddings~~
- ~~Chunking manual~~
- ~~Vector store próprio~~

### Manter
- Guard Rails (camada extra de segurança)
- Bot WhatsApp
- Controle parental

---

## Custo Estimado

### MVP (Beta - Grátis)
| Recurso | Custo |
|---------|-------|
| AutoRAG (open beta) | $0 |
| R2 Storage (10GB) | $0 |
| Workers AI | $0 |
| **Total** | **$0** |

### Produção (1.000 crianças)
| Recurso | Custo |
|---------|-------|
| AutoRAG | ~$20-50/mês |
| R2 Storage (100GB) | ~$1.50/mês |
| Workers (100k req/dia) | ~$5/mês |
| **Total** | **~$30-60/mês** |

---

## Implementação

### Código Simplificado

```typescript
// src/rag/autorag.ts

const AUTORAG_URL = 'https://api.cloudflare.com/client/v4/accounts/{account_id}/autorag';

export class AutoRAGService {
  constructor(private apiKey: string, private accountId: string) {}

  // Upload da apostila
  async uploadApostila(pdf: Buffer, metadata: ApostilaMetadata) {
    // 1. Upload para R2
    await this.uploadToR2(pdf, metadata.fileName);
    
    // 2. AutoRAG indexa automaticamente
    // (webhook ou polling)
  }

  // Buscar resposta
  async search(query: string, childId: string): Promise<RAGResponse> {
    const response = await fetch(`${AUTORAG_URL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        filters: { childId },
        max_results: 3,
      }),
    });

    return response.json();
  }
}
```

---

## Critérios de Sucesso

- [ ] Upload de PDF funciona
- [ ] Busca encontra conteúdo relevante (>90%)
- [ ] Resposta em < 2 segundos
- [ ] Custo zero no MVP
- [ ] Migrável para outro provider se necessário

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Beta terminar | Fallback para Ragie.ai ou self-hosted |
| Lock-in Cloudflare | API REST padrão, fácil migrar |
| Data residency | Cloudflare tem edge em São Paulo |
| Custo crescer | Monitorar usage, alertas |

---

## Próximos Passos

1. Criar conta Cloudflare (gratuito)
2. Configurar AutoRAG
3. Configurar R2 bucket
4. Implementar integração (4-6h)
5. Testar com apostila real

---

*Proposta baseada em: Cloudflare AutoRAG (open beta, 2026)*
