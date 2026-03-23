# 📋 Especificação Técnica: Web First

---

## Arquitetura

```
escolar-ai/
├── src/
│   ├── web/
│   │   ├── index.js         ← Express server
│   │   └── public/
│   │       ├── index.html   ← Chat interface
│   │       ├── style.css    ← Estilos
│   │       └── app.js       ← Lógica frontend
│   ├── guardrails/          ← Proteção
│   ├── ai/                  ← OpenRouter/Ollama
│   └── database/            ← SQLite
├── package.json
└── .env
```

---

## Frontend (HTML/CSS/JS)

### Tecnologias
- Vanilla JS (sem frameworks)
- CSS Grid + Flexbox
- Google Fonts (Inter)
- Responsive design

### Componentes
```
┌─────────────────────────────────────────┐
│ Header (título + descrição)             │
├─────────────────────────────────────────┤
│ Chat Container                          │
│  ├── Message (bot)                      │
│  ├── Message (user)                     │
│  └── Typing indicator                   │
├─────────────────────────────────────────┤
│ Suggestions (botões)                    │
├─────────────────────────────────────────┤
│ Input Area                              │
│  ├── Input field                        │
│  └── Send button                        │
└─────────────────────────────────────────┘
```

---

## Backend (Express)

### Endpoints

| Método | Rota | Função |
|--------|------|--------|
| GET | / | Servir interface |
| POST | /api/chat | Processar pergunta |
| GET | /pai | Dashboard |
| GET | /api/history/:id | Histórico |

### Middleware
- express.json()
- express.static()
- CORS (se necessário)

---

## Guard Rails (Web)

### Camadas Ativas
1. **Formato** - min 3, max 500 chars
2. **Rate Limit** - 10 req/min
3. **Keywords** - lista bloqueio
4. **Injection** - prompt injection detection

### Output
- Respostas bloqueadas retornam `{ blocked: true }`
- Frontend mostra mensagem amigável

---

## Banco de Dados (SQLite)

### Tabelas
- users (id, name, role, parent_id, age)
- conversations (id, user_id, question, answer, blocked, created_at)

### Logs
- Todas as conversas salvas
- Bloqueios com motivo
- Timestamps

---

## Deploy Local

```bash
# Instalar
npm install

# Rodar
npm run web

# Acessar
http://localhost:3000
```

---

## Tasks

| # | Tarefa | Tempo |
|---|--------|-------|
| 1 | Interface HTML/CSS | 2h |
| 2 | JS Frontend (chat) | 2h |
| 3 | Express API | 2h |
| 4 | Guard Rails web | 1h |
| 5 | SQLite + Logs | 1h |
| 6 | Dashboard pai | 3h |
| 7 | Testes | 2h |
| **Total** | | **13h** |
