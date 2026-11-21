# 📋 Proposal: WhatsApp Bot MVP

## Resumo
WhatsApp Bot para validação com filha usando whatsapp-web.js (gratuito, rápido).

---

## Decisão: whatsapp-web.js

**Motivo:** Validação rápida, sem custo, migra para Meta Cloud API quando escalar.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    BOT MVP                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📱 WhatsApp (whatsapp-web.js)                              │
│     │ QR Code scan → pronto                                 │
│     ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              bot/index.js                            │   │
│  │                                                      │   │
│  │  1. Guard Rails.check()                              │   │
│  │  2. AutoRAG.search() (Cloudflare)                    │   │
│  │  3. OpenAI.chat()                                    │   │
│  │  4. Guard Rails.outputCheck()                        │   │
│  │  5. Responde                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Custo: R$ 0 (whatsapp) + ~R$ 50 (OpenAI) = ~R$ 50/mês     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Tecnologias

| Componente | Tecnologia | Custo |
|------------|-----------|-------|
| WhatsApp | whatsapp-web.js | R$ 0 |
| IA | OpenAI GPT-4o-mini | ~R$ 50/mês |
| RAG | Cloudflare AutoRAG | R$ 0 (beta) |
| Guard Rails | Próprio | R$ 0 |
| Banco | PostgreSQL (Supabase) | R$ 0 |

**Total MVP:** ~R$ 50/mês

---

## Migrations

### Meta Cloud API (Quando escalar)
1. Criar conta Meta Business
2. Configurar App
3. Substituir whatsapp-web.js por API oficial
4. Sem mudanças no resto do código

---

## Cronograma

| Dia | Tarefa |
|-----|--------|
| 1 | Setup + whatsapp-web.js |
| 2 | Guard Rails |
| 3 | AutoRAG + OpenAI |
| 4 | Bot integration |
| 5 | Testes com filha |

