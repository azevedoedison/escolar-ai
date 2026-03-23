# 📋 Functional Specification: RAG com Apostilas

## Visão Geral
Sistema que permite upload de apostilas PDF e utiliza RAG para restringir respostas da IA ao conteúdo dessas apostilas.

---

## Requisitos Funcionais

### RF-RAG-001: Upload de Apostila
**Como** pai  
**Preciso** fazer upload de apostilas em PDF  
**Para** que a IA use o material da escola do meu filho

#### Cenários

##### Cenário 1.1: Upload via Dashboard
- **DADO** que o pai está logado no dashboard
- **QUANDO** clica em "Adicionar Apostila" e seleciona arquivo PDF
- **ENTÃO** o sistema faz upload e processa o PDF
- **E** exibe "Apostila processada com sucesso"

##### Cenário 1.2: Upload via WhatsApp
- **DADO** que o pai envia comando "!pai upload"
- **QUANDO** envia o PDF como anexo
- **ENTÃO** o sistema processa e confirma

##### Cenário 1.3: PDF muito grande
- **DADO** que o pai envia apostila de 300 páginas
- **QUANDO** o sistema processa
- **ENTÃO** divide em chunks de 500 tokens
- **E** armazena todos os chunks

---

### RF-RAG-002: Processamento de PDF
**Como** sistema  
**Preciso** extrair texto do PDF e criar embeddings  
**Para** indexar para busca semântica

#### Cenários

##### Cenário 2.1: PDF texto (nativo)
- **DADO** que recebo apostila com texto nativo
- **QUANDO** processo o PDF
- **ENTÃO** extraio texto com preservação de formatação
- **E** crio chunks de 500 tokens com overlap de 50

##### Cenário 2.2: PDF scaneado (imagem)
- **DADO** que recebo apostila scaneada
- **QUANDO** processo o PDF
- **ENTÃO** detecto que é imagem
- **E** aciono OCR (Tesseract)
- **E** depois processo normalmente

##### Cenário 2.3: Geração de embeddings
- **DADO** que tenho chunks extraídos
- **QUANDO** gero embeddings
- **ENTÃO** uso Ollama (nomic-embed-text) ou OpenAI
- **E** armazeno no Vector DB

---

### RF-RAG-003: Busca Semântica
**Como** sistema  
**Preciso** buscar chunks relevantes baseado na pergunta  
**Para** fornecer contexto à LLM

#### Cenários

##### Cenário 3.1: Busca com resultado relevante
- **DADO** que a criança pergunta "O que é fotossíntese?"
- **QUANDO** busco no Vector DB
- **ENTÃO** retorno top 3 chunks sobre fotossíntese
- **E** incluo metadados (página, apostila)

##### Cenário 3.2: Busca sem resultado
- **DADO** que a criança pergunta sobre algo não nas apostilas
- **QUANDO** busco no Vector DB
- **ENTÃO** nenhum chunk relevante é encontrado
- **E** retorno resposta: "Não encontrei isso na sua apostila..."

##### Cenário 3.3: Busca com baixa relevância
- **DADO** que a pergunta tem resultado com score < 0.7
- **QUANDO** analiso relevância
- **ENTÃO** considero como "não encontrado"
- **E** sugiro temas da apostila

---

### RF-RAG-004: Geração de Resposta com Contexto
**Como** sistema  
**Preciso** gerar resposta usando contexto encontrado  
**Para** resposta baseada no material

#### Cenários

##### Cenário 4.1: Contexto encontrado
- **DADO** que busquei e encontrei contexto relevante
- **QUANDO** envio para LLM
- **ENTÃO** incluo System Prompt especial:

```
Você é um tutor da Escolar AI. Responda APENAS com base no contexto fornecido.

CONTEXTO DA APOSTILA:
[página 45] "A fotossíntese é o processo que as plantas usam para converter luz solar em alimento..."

PERGUNTA DA CRIANÇA: O que é fotossíntese?

Responda de forma simples, com emojis, em português brasileiro.
Se o contexto não responder à pergunta, diga que não encontrou na apostila.
```

- **E** a resposta é baseada no contexto

##### Cenário 4.2: Contexto não encontrado
- **DADO** que não encontrei contexto relevante
- **QUANDO** respondo
- **ENTÃO** digo: "Não encontrei isso na sua apostila 📚"
- **E** sugiro: "Que tal perguntar sobre [tópicos da apostila]?"

---

### RF-RAG-005: Gestão de Apostilas
**Como** pai  
**Preciso** gerenciar apostilas dos meus filhos  
**Para** atualizar材料 quando necessário

#### Cenários

##### Cenário 5.1: Listar apostilas
- **DADO** que estou no dashboard
- **QUANDO** clico em "Minhas Apostilas"
- **ENTÃO** vejo lista com: nome, matéria, data upload, páginas

##### Cenário 5.2: Remover apostila
- **DADO** que tenho apostila antiga
- **QUANDO** clico em "Remover"
- **ENTÃO** sistema remove do Vector DB
- **E** confirma remoção

##### Cenário 5.3: Substituir apostila
- **DADO** que escola atualizou apostila
- **QUANDO** faço upload da nova versão
- **ENTÃO** sistema remove chunks da versão antiga
- **E** indexa a nova versão

---

## API Design

### POST /api/rag/upload
**Request:**
```
Content-Type: multipart/form-data

file: [apostila.pdf]
childId: uuid-da-criança
materia: "Ciências"
```

**Response:**
```json
{
  "success": true,
  "apostilaId": "uuid",
  "pages": 45,
  "chunks": 120,
  "processingTime": "15s"
}
```

### POST /api/rag/search
**Request:**
```json
{
  "query": "O que é fotossíntese?",
  "childId": "uuid-da-criança",
  "topK": 3
}
```

**Response:**
```json
{
  "found": true,
  "chunks": [
    {
      "text": "A fotossíntese é o processo...",
      "source": "apostila-ciencias-5ano.pdf",
      "page": 45,
      "score": 0.92
    }
  ],
  "context": "Conforme sua apostila de Ciências, pág. 45..."
}
```

---

## Modelos de Dados

### Apostila
```typescript
interface Apostila {
  id: string;
  childId: string;
  fileName: string;
  materia: string;
  pages: number;
  chunks: number;
  uploadedAt: Date;
  processedAt?: Date;
  status: 'processing' | 'ready' | 'error';
}
```

### Chunk
```typescript
interface Chunk {
  id: string;
  apostilaId: string;
  text: string;
  page: number;
  chunkIndex: number;
  embedding: number[];
}
```

---

## Dependências

| Pacote | Uso | Alternativa |
|--------|-----|-------------|
| `pdf-parse` | Extração de texto PDF | `pdf2json` |
| `tesseract.js` | OCR para PDFs scaneados | `aws-textract` |
| `chromadb` | Vector Database | `pinecone` |
| `ollama` | Embeddings local | `openai` |

---

## Testes

### Unit Tests
- `tests/unit/rag/pdf-parser.test.ts`
- `tests/unit/rag/chunker.test.ts`
- `tests/unit/rag/embeddings.test.ts`
- `tests/unit/rag/search.test.ts`

### Integration Tests
- `tests/integration/rag/upload-process.test.ts`
- `tests/integration/rag/search-response.test.ts`

### Acceptance Tests
- `tests/acceptance/rag/child-question.test.ts` - Criança pergunta algo da apostila
- `tests/acceptance/rag/not-found.test.ts` - Pergunta fora da apostila
