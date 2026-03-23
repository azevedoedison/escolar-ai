# 📚 Proposta: RAG com Apostilas PDF

## Resumo Executivo

Implementação de sistema RAG (Retrieval Augmented Generation) que utiliza apostilas escolares como base de conhecimento, restringindo respostas da IA ao conteúdo curricular real.

---

## Por que RAG?

### ❌ Problema Atual (LLM Aberto)
```
Criança: "Me conta uma piada"
IA: *conta piada* (resposta inadequada)
```

### ✅ Com RAG
```
Criança: "Me conta uma piada"
IA: "Não encontrei piadas na sua apostila 📚
    Que tal perguntar sobre Ciências ou Matemática?"
```

---

## Comparação Rápida

| | LLM Aberto | RAG + Apostilas |
|--|-----------|-----------------|
| **Escopo** | Tudo | Só a apostila |
| **Precisão** | Pode errar | Baseado no real |
| **Custo/query** | R$ 0,10 | R$ 0,01 |
| **Segurança** | Risco | Controlado |

---

## Arquitetura

```
📄 PDF → 🔧 Texto → 🧩 Chunks → 🧠 Embeddings → 🗄️ Vector DB
                                                          ↓
                                              🔍 Busca Semântica
                                                          ↓
                                              🤖 LLM + Contexto
                                                          ↓
                                              ✅ Resposta
```

---

## Próximos Passos

1. Aprovar esta proposta
2. Implementar Tarefa RAG-01 (Setup)
3. Testar com apostila real

---

## Documentação

- `proposal.md` - Justificativa completa
- `specs/functional.md` - Requisitos e cenários
- `specs/design.md` - ADRs e arquitetura
- `specs/tasks.md` - Checklist de implementação
