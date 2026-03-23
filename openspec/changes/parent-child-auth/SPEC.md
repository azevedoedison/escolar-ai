# 🛡️ Specification: Cadastro Pai & Filho + Autenticação
# Escolar AI - Sistema de Controle Parental e Login

**Versão:** 1.0
**Data:** 2026-03-23
**Status:** DRAFT
**Prioridade:** 🔴 Critical

---

## 1. Visão Geral

### 1.1 Problema
O Escolar AI precisa de um sistema de cadastro que permita:
- **Pais** se cadastrarem com dados pessoais e email
- **Filhos** terem um login para usar a IA (mesmo sem email)
- **Pais** controlarem o acesso eMonitorarem o uso dos filhos
- Vinculação entre pai e filho(s)

### 1.2 Usuários

| Usuário | Idade | Email | Login | O que precisa |
|---------|-------|-------|-------|---------------|
| **Pai** | Adulto (18+) | ✅ Obrigatório | Via Google OAuth | Nome, CPF, email, telefone |
| **Filho** | 6-14 anos | Opcional | ✅ Obrigatório (login+senha) | Nome, idade, escola |

### 1.3 Fluxo Principal

```
┌─────────────────────────────────────────────────────────────┐
│  1. Pai cria conta (Google OAuth ou email+senha)            │
│  2. Pai preenche dados pessoais                             │
│  3. Pai cadastra filho (nome, idade, escola)               │
│  4. Pai define login/senha para o filho                     │
│  5. Filho faz login com login+senha                         │
│  6. Filho usa a IA (com guardrails ativos)                  │
│  7. Pai vê relatórios de uso no dashboard                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Requisitos

### 2.1 RF (Requisitos Funcionais)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-PC-001 | Pai DEVE fazer cadastro com Google OAuth | 🔴 Critical |
| RF-PC-002 | Pai DEVE informar nome completo, email, telefone | 🔴 Critical |
| RF-PC-003 | Pai DEVE confirmar email antes de ativar conta | 🟡 High |
| RF-PC-004 | Pai DEVE cadastrar filho com: nome, idade, escola | 🔴 Critical |
| RF-PC-005 | Pai DEVE definir login (nickname) e senha para o filho | 🔴 Critical |
| RF-PC-006 | Filho DEVE fazer login com login + senha | 🔴 Critical |
| RF-PC-007 | Filho PODE ter email vinculado (opcional) | 🟢 Low |
| RF-PC-008 | Filho DEVE informar: escola, cidade, estado | 🟡 High |
| RF-PC-009 | Idade do filho DEVE ser 6-14 anos | 🔴 Critical |
| RF-PC-010 | Pai DEVE ver lista de filhos cadastrados | 🟡 High |
| RF-PC-011 | Pai DEVE poder desativar login do filho | 🟡 High |
| RF-PC-012 | Pai DEVE poder redefinir senha do filho | 🟡 High |
| RF-PC-013 | Sistema DEVE autenticar com JWT (access + refresh) | 🔴 Critical |
| RF-PC-014 | Sessão do filho DEVE expirar em 2 horas | 🟡 High |
| RF-PC-015 | Pai DEVE receber email de confirmação de cadastro | 🟢 Low |

### 2.2 NFR (Requisitos Não-Funcionais)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| NFR-PC-001 | Login do filho DEVE responder em <500ms | 🟡 High |
| NFR-PC-002 | Senhas DEVEM ser hash com bcrypt (salt rounds: 10) | 🔴 Critical |
| NFR-PC-003 | Rate limit: 5 tentativas de login em 5 minutos | 🟡 High |
| NFR-PC-004 | Google OAuth DEVE usar PKCE | 🟡 High |
| NFR-PC-005 | Dados DEVEM ser criptografados em rest (AES-256) | 🟢 Low |

---

## 3. Modelos de Dados

### 3.1 Schema Prisma

```prisma
// schema.prisma

model Parent {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  phone        String?
  googleId     String?  @unique
  emailVerified Boolean @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  children     Child[]
  sessions     Session[]
}

model Child {
  id           String   @id @default(cuid())
  parentId     String
  name         String
  nickname     String   @unique  // login
  passwordHash String            // bcrypt hash
  email        String?  @unique  // opcional
  age          Int
  grade        String?           // série escolar
  school       String?           // nome da escola
  city         String?
  state        String?
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  parent       Parent   @relation(fields: [parentId], references: [id])
  sessions     Session[]
  conversations Conversation[]
  
  @@index([parentId])
  @@index([nickname])
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  userType     String   // "parent" ou "child"
  token        String   @unique
  refreshToken String?  @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  
  @@index([token])
  @@index([userId])
}

model Conversation {
  id        String   @id @default(cuid())
  childId   String
  input     String
  output    String?
  status    String   // "approved" | "blocked"
  guardRailLayers Json?
  createdAt DateTime @default(now())
  
  child     Child    @relation(fields: [childId], references: [id])
  
  @@index([childId])
  @@index([createdAt])
}
```

### 3.2 Diagrama de Relacionamentos

```
┌──────────┐       1:N        ┌──────────┐       1:N        ┌──────────────┐
│  Parent  │──────────────────│  Child   │──────────────────│ Conversation │
│          │                  │          │                  │              │
│ email    │                  │ nickname │                  │ input/output │
│ name     │                  │ password │                  │ guardrails   │
│ googleId │                  │ age/school│                  │ status       │
└──────────┘                  └──────────┘                  └──────────────┘
     │                              │
     │ 1:N                          │ 1:N
     ▼                              ▼
┌──────────┐                  ┌──────────┐
│ Session  │                  │ Session  │
│ (parent) │                  │ (child)  │
└──────────┘                  └──────────┘
```

---

## 4. APIs

### 4.1 Auth - Parent

```
POST   /api/auth/google          → Redireciona para Google OAuth
GET    /api/auth/google/callback → Callback do Google
POST   /api/auth/parent/register → Cadastro manual (email+senha)
POST   /api/auth/parent/login    → Login com email+senha
POST   /api/auth/parent/refresh  → Refresh token
POST   /api/auth/parent/logout   → Logout
```

### 4.2 Parent - Children Management

```
GET    /api/parent/children          → Lista filhos
POST   /api/parent/children          → Cadastra filho
GET    /api/parent/children/:id      → Detalhes do filho
PATCH  /api/parent/children/:id      → Atualiza dados do filho
DELETE /api/parent/children/:id      → Remove/desativa filho
POST   /api/parent/children/:id/reset-password → Redefine senha
POST   /api/parent/children/:id/toggle → Ativa/desativa login
```

### 4.3 Child - Auth & Usage

```
POST   /api/auth/child/login    → Login com nickname + senha
POST   /api/auth/child/refresh  → Refresh token
POST   /api/auth/child/logout   → Logout
GET    /api/child/profile       → Perfil do filho
POST   /api/child/chat          → Enviar mensagem (usa guardrails)
GET    /api/child/history       → Histórico de conversas
```

### 4.4 Request/Response Examples

**POST /api/parent/children**
```json
// Request
{
  "name": "Maria Silva",
  "age": 10,
  "grade": "5º ano",
  "school": "Escola Municipal São José",
  "city": "Curitiba",
  "state": "PR",
  "nickname": "mariazinha",     // login do filho
  "password": "senha123"        // definida pelo pai
}

// Response 201
{
  "id": "clx123abc",
  "name": "Maria Silva",
  "nickname": "mariazinha",
  "age": 10,
  "active": true,
  "createdAt": "2026-03-23T14:00:00Z"
}
```

**POST /api/auth/child/login**
```json
// Request
{
  "nickname": "mariazinha",
  "password": "senha123"
}

// Response 200
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "expiresIn": 7200,
  "child": {
    "id": "clx123abc",
    "name": "Maria",
    "age": 10
  }
}
```

---

## 5. Fluxos

### 5.1 Cadastro do Pai (Google OAuth)

```
┌──────┐        ┌──────────┐       ┌─────────┐       ┌──────────┐
│ Pai  │        │ Frontend │       │ Backend │       │ Google   │
└──┬───┘        └────┬─────┘       └────┬────┘       └────┬─────┘
   │  1. Clicar     │                   │                  │
   │  "Entrar com   │                   │                  │
   │   Google"      │                   │                  │
   │───────────────>│                   │                  │
   │                │  2. GET /auth/    │                  │
   │                │  google           │                  │
   │                │──────────────────>│                  │
   │                │                   │  3. Redirect     │
   │                │                   │  to Google       │
   │                │<──────────────────│                  │
   │  4. Redirect   │                   │                  │
   │  to Google     │                   │                  │
   │<───────────────│                   │                  │
   │───────────────────────────────────────────────────────>
   │                │                   │                  │
   │  5. Login      │                   │                  │
   │  Google        │                   │                  │
   │<───────────────────────────────────────────────────────│
   │                │                   │                  │
   │  6. Callback   │                   │                  │
   │  redirect      │                   │                  │
   │───────────────>│                   │                  │
   │                │  7. /callback?code=xxx                │
   │                │──────────────────>│                  │
   │                │                   │  8. Exchange code│
   │                │                   │─────────────────>│
   │                │                   │  9. User info    │
   │                │                   │<─────────────────│
   │                │                   │                  │
   │                │                   │ 10. Create/Find  │
   │                │                   │ parent record    │
   │                │                   │                  │
   │                │  11. JWT tokens   │                  │
   │                │<──────────────────│                  │
   │                │                   │                  │
   │                │  12. Redirect to  │                  │
   │                │  /complete-profile│                  │
   │  13. Preencher │                   │                  │
   │  dados restantes│                   │                  │
   │───────────────>│                   │                  │
   │                │  14. PUT /profile │                  │
   │                │──────────────────>│                  │
   │                │                   │  15. Save        │
   │  16. Dashboard │                   │                  │
   │<───────────────│                   │                  │
```

### 5.2 Cadastro do Filho pelo Pai

```
┌──────┐        ┌──────────┐       ┌─────────┐
│ Pai  │        │ Frontend │       │ Backend │
└──┬───┘        └────┬─────┘       └────┬────┘
   │  1. "Cadastrar │                   │
   │     filho"     │                   │
   │───────────────>│                   │
   │                │                   │
   │  2. Form:      │                   │
   │  nome, idade,  │                   │
   │  escola, login,│                   │
   │  senha         │                   │
   │───────────────>│                   │
   │                │  3. POST          │
   │                │  /parent/children │
   │                │  Authorization:   │
   │                │  Bearer <jwt>     │
   │                │──────────────────>│
   │                │                   │
   │                │                   │  4. Validar:
   │                │                   │  - idade 6-14
   │                │                   │  - nickname único
   │                │                   │  - hash senha
   │                │                   │
   │                │  5. Criança       │
   │                │  criada           │
   │                │<──────────────────│
   │  6. Sucesso +  │                   │
   │  dados login   │                   │
   │<───────────────│                   │
   │                │                   │
   │  7. Compartilhar login com filho   │
   │     (papel, WhatsApp, etc.)       │
```

### 5.3 Login do Filho

```
┌──────┐        ┌──────────┐       ┌─────────┐
│Filho │        │ Frontend │       │ Backend │
└──┬───┘        └────┬─────┘       └────┬────┘
   │  1. Abrir app   │                   │
   │  "Entrar"      │                   │
   │───────────────>│                   │
   │                │                   │
   │  2. Login:     │                   │
   │  "mariazinha"  │                   │
   │  "senha123"    │                   │
   │───────────────>│                   │
   │                │  3. POST          │
   │                │  /auth/child/login│
   │                │──────────────────>│
   │                │                   │
   │                │                   │  4. Verificar:
   │                │                   │  - nickname existe?
   │                │                   │  - senha correta?
   │                │                   │  - conta ativa?
   │                │                   │  - rate limit OK?
   │                │                   │
   │                │  5. JWT (2h)      │
   │                │<──────────────────│
   │                │                   │
   │                │  6. Redirecionar  │
   │                │  para chat        │
   │  7. Chat       │                   │
   │  habilitado    │                   │
   │<───────────────│                   │
```

---

## 6. Segurança

### 6.1 Requisitos de Segurança

| ID | Requisito | Implementação |
|----|-----------|---------------|
| SEC-01 | Senhas nunca em texto claro | bcrypt hash (cost: 10) |
| SEC-02 | JWT assinado com secret forte | HS256, 256-bit secret |
| SEC-03 | Access token curto | 15 minutos |
| SEC-04 | Refresh token longo | 7 dias |
| SEC-05 | Rate limiting login | 5 tentativas / 5 min por IP |
| SEC-06 | Conta bloqueada após 10 falhas | Reset manual pelo pai |
| SEC-07 | CSRF protection | SameSite cookies + tokens |
| SEC-08 | Input sanitização | Validar todos os campos |

### 6.2 JWT Structure

```
// Access Token (15 min)
{
  "sub": "clx123abc",
  "type": "child",
  "parentId": "plx456def",
  "iat": 1711200000,
  "exp": 1711200900
}

// Refresh Token (7 dias)
{
  "sub": "clx123abc",
  "type": "child_refresh",
  "jti": "unique-token-id",
  "iat": 1711200000,
  "exp": 1711804800
}
```

---

## 7. Frontend

### 7.1 Telas

| Tela | Path | Usuário |
|------|------|---------|
| Login | `/login` | Pai e Filho |
| Cadastro Pai | `/register/parent` | Pai |
| Completar Perfil | `/complete-profile` | Pai (pós-Google) |
| Dashboard Pai | `/dashboard` | Pai |
| Cadastrar Filho | `/dashboard/child/new` | Pai |
| Gerenciar Filhos | `/dashboard/children` | Pai |
| Login Filho | `/child/login` | Filho |
| Chat (uso normal) | `/chat` | Filho |

### 7.2 Tela de Login do Filho

```
┌─────────────────────────────────────────┐
│                                         │
│           📚 Escolar AI                 │
│                                         │
│     👋 Oi! Como você se chama?          │
│                                         │
│   ┌───────────────────────────────┐     │
│   │  Seu nome de usuário          │     │
│   │  mariazinha                   │     │
│   └───────────────────────────────┘     │
│                                         │
│   ┌───────────────────────────────┐     │
│   │  Sua senha                     │     │
│   │  ••••••••                     │     │
│   └───────────────────────────────┘     │
│                                         │
│        ┌─────────────────────┐          │
│        │    🚀 Entrar        │          │
│        └─────────────────────┘          │
│                                         │
│   Esqueceu a senha? Peça pro papai! 👨  │
│                                         │
└─────────────────────────────────────────┘
```

### 7.3 Dashboard do Pai

```
┌─────────────────────────────────────────────────────────┐
│  📚 Escolar AI         👋 Olá, Edison    [Sair]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👨‍👧‍👦 Meus Filhos                              [+Adicionar]│
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 👧 Maria (10 anos)                              │   │
│  │ Escola: Municipal São José - Curitiba/PR        │   │
│  │ Login: mariazinha | ✅ Ativo                    │   │
│  │ Perguntas hoje: 12 | Bloqueadas: 2              │   │
│  │ [Ver Histórico] [Redefinir Senha] [Desativar]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 👦 João (8 anos)                                │   │
│  │ Escola: Colégio Batista - Curitiba/PR           │   │
│  │ Login: joaozinho | ✅ Ativo                     │   │
│  │ Perguntas hoje: 8 | Bloqueadas: 0               │   │
│  │ [Ver Histórico] [Redefinir Senha] [Desativar]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Testes

### 8.1 Test Table - Autenticação Pai

| ID | Cenário | Entrada | Esperado |
|----|---------|---------|----------|
| UT-AU-001 | Cadastro com Google válido | token Google válido | ✅ 201 + JWT |
| UT-AU-002 | Cadastro sem email | dados incompletos | ❌ 400 |
| UT-AU-003 | Login com credenciais válidas | email + senha ok | ✅ 200 + JWT |
| UT-AU-004 | Login com senha errada | email + senha errada | ❌ 401 |
| UT-AU-005 | Rate limit (5 tentativas) | 5 logins errados | ❌ 429 |
| UT-AU-006 | Refresh token válido | refresh token ok | ✅ 200 + novo JWT |
| UT-AU-007 | Refresh token expirado | refresh expirado | ❌ 401 |
| UT-AU-008 | Logout | token válido | ✅ 200 |

### 8.2 Test Table - Cadastro Filho

| ID | Cenário | Entrada | Esperado |
|----|---------|---------|----------|
| UT-CH-001 | Cadastrar filho válido | nome, 10 anos, nickname, senha | ✅ 201 |
| UT-CH-002 | Filho com idade < 6 | nome, 5 anos | ❌ 400 |
| UT-CH-003 | Filho com idade > 14 | nome, 15 anos | ❌ 400 |
| UT-CH-004 | Nickname duplicado | nickname já existe | ❌ 409 |
| UT-CH-005 | Sem nickname | dados sem nickname | ❌ 400 |
| UT-CH-006 | Senha muito curta | senha < 4 chars | ❌ 400 |
| UT-CH-007 | Pai cadastra 2º filho | filho2 válido | ✅ 201 |

### 8.3 Test Table - Login Filho

| ID | Cenário | Entrada | Esperado |
|----|---------|---------|----------|
| UT-LO-001 | Login válido | nickname + senha correta | ✅ 200 + JWT |
| UT-LO-002 | Login nickname inexistente | nickname fake | ❌ 401 |
| UT-LO-003 | Login senha errada | nickname + senha errada | ❌ 401 |
| UT-LO-004 | Login conta desativada | nick + senha, conta off | ❌ 403 |
| UT-LO-005 | Login com rate limit | 5 tentativas erradas | ❌ 429 |

### 8.4 Test Table - Fluxo Completo

| ID | Cenário | Passos | Esperado |
|----|---------|--------|----------|
| UT-FL-001 | Fluxo completo | Cadastra pai → cadastra filho → filho loga → usa chat | ✅ |
| UT-FL-002 | Pai desativa filho | Cadastra → desativa → filho tenta logar | ❌ 403 |
| UT-FL-003 | Pai redefini senha | Filho loga → pai redefine → filho usa senha antiga | ❌ 401 |
| UT-FL-004 | Sessão expira | Filho loga → espera 2h → tenta usar token | ❌ 401 |

---

## 9. Estimativa

| Fase | Tarefas | Tempo |
|------|---------|-------|
| **Fase 1: Schema + Migrations** | Prisma schema, migrations, seed | 2h |
| **Fase 2: Auth API (Pai)** | Google OAuth + login + JWT | 4h |
| **Fase 3: Children API** | CRUD filho + validações | 3h |
| **Fase 4: Auth API (Filho)** | Login + rate limit + sessão | 3h |
| **Fase 5: Frontend** | Telas de login, cadastro, dashboard | 6h |
| **Fase 6: Testes** | Testes unitários + integração | 4h |
| **TOTAL** | | **22h** |

---

## 10. Open Questions

| Questão | Decisão | Status |
|---------|---------|--------|
| Pai pode ter múltiplos filhos? | Sim, ilimitado | ✅ Definido |
| Filho pode ter email? | Sim, opcional | ✅ Definido |
| Idade mínima/máxima? | 6-14 anos | ✅ Definido |
| Sessão do filho dura quanto? | 2 horas | ✅ Definido |
| Google OAuth ou OAuth + email/senha? | Ambos (pai escolhe) | ✅ Definido |
| Filho pode trocar própria senha? | Não, só o pai | ✅ Definido |
| Precisa de confirmação de email? | Sim, para o pai | ✅ Definido |
