# 📋 Especificação Funcional: Web First

---

## 1. Chat Interface (Criança)

### RF-WEB-001: Enviar Pergunta
- **DADO** que a criança está na página principal
- **QUANDO** digita uma pergunta e clica Enviar
- **ENTÃO** a pergunta é enviada para o servidor
- **E** uma resposta é recebida em < 3 segundos

### RF-WEB-002: Resposta Educacional
- **DADO** que a pergunta é sobre conteúdo escolar
- **QUANDO** o servidor processa
- **ENTÃO** retorna resposta com emojis e linguagem simples
- **E** máximo 3 parágrafos

### RF-WEB-003: Bloqueio de Conteúdo
- **DADO** que a criança pergunta algo inadequado
- **QUANDO** Guard Rails detecta
- **ENTÃO** retorna mensagem amigável de bloqueio
- **E** sugere temas escolares

### RF-WEB-004: Sugestões de Pergunta
- **DADO** que a página carrega
- **QUANDO** a criança vê as sugestões
- **ENTÃO** pode clicar em botões pré-definidos
- **E** a pergunta é enviada automaticamente

---

## 2. Dashboard (Pai)

### RF-DASH-001: Acesso Dashboard
- **DADO** que o pai acessa /pai
- **QUANDO** faz login (simples)
- **ENTÃO** vê lista de filhos

### RF-DASH-002: Histórico de Conversas
- **DADO** que o pai seleciona um filho
- **QUANDO** clica no nome
- **ENTÃO** vê todas as perguntas e respostas
- **E** data/hora de cada uma

### RF-DASH-003: Alertas
- **DADO** que houve bloqueios
- **QUANDO** o pai acessa o dashboard
- **ENTÃO** vê alertas destacados
- **E** motivos dos bloqueios

---

## 3. API

### POST /api/chat
```json
// Request
{ "message": "O que é fotossíntese?" }

// Response (sucesso)
{ 
  "response": "Fotossíntese é...",
  "blocked": false 
}

// Response (bloqueado)
{
  "response": "Ops! Isso está fora do contexto...",
  "blocked": true,
  "reason": "outOfContext"
}
```

### GET /api/history/:childId
```json
// Response
{
  "history": [
    { "question": "...", "answer": "...", "date": "..." }
  ]
}
```

---

## 4. Modelos de Dados

### User (Criança/Pai)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('child', 'parent')),
  parent_id INTEGER,
  age INTEGER,
  created_at DATETIME DEFAULT NOW
);
```

### Conversation
```sql
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  question TEXT NOT NULL,
  answer TEXT,
  blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  created_at DATETIME DEFAULT NOW
);
```
