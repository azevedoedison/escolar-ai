# 📋 Proposal: Web First (MVP via Navegador)

## Resumo
Mudar foco do WhatsApp para **Interface Web** como canal principal de validação.

---

## Por que Web First?

| WhatsApp | Web |
|----------|-----|
| ❌ QR Code complexo | ✅ Link direto |
| ❌ Limitações de formato | ✅ Interface rica |
| ❌ Hard to debug | ✅ DevTools |
| ❌ Dependência Meta | ✅ Independente |

---

## O que MUDA

### Foco Principal → Interface Web
```
ANTES: WhatsApp → Bot → IA
AGORA:  Browser → Web App → IA
```

### Mantém
- ✅ Guard Rails (6 camadas)
- ✅ OpenRouter/Ollama (IA)
- ✅ RAG (futuro - apostilas)
- ✅ Controle parental (dashboard)

### Remove do MVP
- ❌ whatsapp-web.js
- ❌ QR Code
- ❌ Puppeteer/Chrome

### Adiciona
- ✅ Interface ChatGPT style
- ✅ Login de criança/pai
- ✅ Dashboard parental web

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB FIRST MVP                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌐 Browser (Criança)                                       │
│     │                                                       │
│     ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Express.js Server                       │   │
│  │                                                      │   │
│  │  GET  /           → Interface Chat                   │   │
│  │  POST /api/chat   → Processar pergunta               │   │
│  │  GET  /pai        → Dashboard parental               │   │
│  └─────────────────────────────────────────────────────┘   │
│                     │                                       │
│                     ▼                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Serviços                                │   │
│  │  • Guard Rails Engine                                │   │
│  │  • OpenRouter / Ollama                               │   │
│  │  • Banco de dados (logs)                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Funcionalidades

### Para Criança
- Chat simples estilo ChatGPT
- Sugestões de perguntas
- Respostas com emojis
- Histórico da sessão

### Para Pai (Dashboard)
- Listar filhos
- Ver histórico de perguntas
- Alertas de conteúdo bloqueado
- Configurações

---

## Tecnologias

| Componente | Tecnologia |
|------------|-----------|
| Frontend | HTML/CSS/JS (Vanilla) |
| Backend | Express.js |
| IA | OpenRouter (grátis) |
| Fallback | Ollama (local) |
| Banco | SQLite (simples) |

---

## Cronograma

| Dia | Tarefa |
|-----|--------|
| 1 | Interface web completa |
| 2 | Login + Dashboard pai |
| 3 | Guard Rails web |
| 4 | Testes com filha |
| 5 | Ajustes + RAG |

---

## Critérios de Sucesso

- [ ] Criança acessa via browser
- [ ] Faz pergunta e recebe resposta
- [ ] Conteúdo inadequado é bloqueado
- [ ] Pai vê histórico no dashboard
- [ ] Funciona sem internet (Ollama)
