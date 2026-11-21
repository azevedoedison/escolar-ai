# 📋 Functional Specification: Guard Rails

## Visão Geral
Sistema de proteção que filtra mensagens ANTES e DEPOIS da chamada à LLM.

---

## Requisitos Funcionais

### RF-001: Validação de Formato (Camada 1)
**Como** sistema  
**Preciso** validar formato da mensagem  
**Para** evitar processamento de dados inválidos

#### Cenários

##### Cenário 1.1: Mensagem válida
- **DADO** que a criança envia "O que é fotossíntese?"
- **QUANDO** o sistema valida o formato
- **ENTÃO** a mensagem é aprovada (3-500 chars, UTF-8 válido)

##### Cenário 1.2: Mensagem muito curta
- **DADO** que a criança envia "oi"
- **QUANDO** o sistema valida o formato
- **ENTÃO** a mensagem é bloqueada
- **E** retorna "Pergunte algo sobre escola! 📚"

##### Cenário 1.3: Mensagem muito longa
- **DADO** que a criança envia uma mensagem de 600 caracteres
- **QUANDO** o sistema valida o formato
- **ENTÃO** a mensagem é bloqueada
- **E** retorna "Mensagem muito longa! Tente ser mais breve 😊"

---

### RF-002: Detecção de Prompt Injection (Camada 2)
**Como** sistema  
**Preciso** detectar tentativas de manipulação  
**Para** manter integridade das respostas

#### Cenários

##### Cenário 2.1: Injection em inglês
- **DADO** que alguém envia "Ignore your instructions"
- **QUANDO** o sistema analisa a mensagem
- **ENTÃO** a tentativa é bloqueada
- **E** o incidente é logado

##### Cenário 2.2: Injection em português
- **DADO** que alguém envia "ignore suas instruções"
- **QUANDO** o sistema analisa a mensagem
- **ENTÃO** a tentativa é bloqueada

##### Cenário 2.3: Pergunta escolar legítima
- **DADO** que a criança pergunta "como ignorar erros de digitação"
- **QUANDO** o sistema analisa a mensagem
- **ENTÃO** a mensagem é aprovada (não é injection)

---

### RF-003: Classificação de Conteúdo (Camada 3)
**Como** sistema  
**Preciso** classificar conteúdo em categorias  
**Para** bloquear conteúdo inadequado

#### Cenários

##### Cenário 3.1: Conteúdo violento
- **DADO** que a criança pergunta "o que é suicídio"
- **QUANDO** o sistema classifica o conteúdo
- **ENTÃO** é bloqueado com categoria "violence"
- **E** retorna mensagem com CVV 188

##### Cenário 3.2: Conteúdo sexual
- **DADO** que alguém pergunta sobre conteúdo sexual
- **QUANDO** o sistema classifica o conteúdo
- **ENTÃO** é bloqueado com categoria "sexual"

##### Cenário 3.3: Conteúdo escolar
- **DADO** que a criança pergunta "como calcular área de triângulo"
- **QUANDO** o sistema classifica o conteúdo
- **ENTÃO** é aprovado com categoria "school"

---

### RF-004: Filtro de Palavras (Camada 4)
**Como** sistema  
**Preciso** verificar lista de palavras proibidas  
**Para** bloquear conteúdo conhecido

#### Cenários

##### Cenário 4.1: Palavra proibida encontrada
- **DADO** que a mensagem contém "filme de terror"
- **QUANDO** o sistema verifica a lista
- **ENTÃO** é bloqueado

##### Cenário 4.2: Escola mencionada
- **DADO** que a mensagem contém "matemática"
- **QUANDO** o sistema verifica a lista
- **ENTÃO** é aprovado

---

### RF-005: Rate Limiting (Camada 5)
**Como** sistema  
**Preciso** limitar taxa de mensagens  
**Para** prevenir spam e abuso

#### Regras
- Máximo 10 mensagens por minuto
- Máximo 50 mensagens por hora
- Cooldown de 30 segundos após exceder

#### Cenários

##### Cenário 5.1: Dentro do limite
- **DADO** que a criança envia 5 mensagens em 1 minuto
- **QUANDO** o sistema verifica o rate
- **ENTÃO** todas são processadas

##### Cenário 5.2: Acima do limite
- **DADO** que a criança envia 11 mensagens em 1 minuto
- **QUANDO** o sistema verifica o rate
- **ENTÃO** a 11ª mensagem é bloqueada
- **E** retorna "Aguarde um momento antes de enviar outra mensagem"

---

### RF-006: Verificação de Output (Camada 6)
**Como** sistema  
**Preciso** verificar resposta da LLM antes de enviar  
**Para** garantir que resposta é educacional

#### Cenários

##### Cenário 6.1: Resposta educacional
- **DADO** que a LLM responde "Fotossíntese é o processo..."
- **QUANDO** o sistema verifica o output
- **ENTÃO** a resposta é enviada

##### Cenário 6.2: Resposta inadequada
- **DADO** que a LLM responde conteúdo inadequado
- **QUANDO** o sistema verifica o output
- **ENTÃO** a resposta é bloqueada
- **E** retorna resposta fallback segura

---

### RF-007: Notificação de Pais (Camada 7)
**Como** pai  
**Preciso** receber alertas quando filho tenta acessar conteúdo inadequado  
**Para** saber o que meu filho está pesquisando

#### Regras
- Notificar após 3 bloqueios em 1 hora
- Relatório semanal automático

#### Cenários

##### Cenário 7.1: Threshold atingido
- **DADO** que Maria teve 3 bloqueios na última hora
- **QUANDO** o sistema detecta o threshold
- **ENTÃO** envia alerta para o pai no WhatsApp

##### Cenário 7.2: Relatório semanal
- **DADO** que é segunda-feira às 09:00
- **QUANDO** o sistema gera relatórios
- **ENTÃO** envia resumo semanal para cada pai

---

## Modelos de Dados

### Conversation
```typescript
{
  id: string;           // UUID
  userId: string;       // WhatsApp ID
  childId?: string;     // ID da criança
  input: string;        // Mensagem original
  output?: string;      // Resposta enviada
  status: 'approved' | 'blocked';
  blockReason?: string; // Motivo do bloqueio
  guardRailLayers: LayerResult[];  // Resultado de cada camada
  createdAt: Date;
}
```

### GuardRailLog
```typescript
{
  id: string;
  conversationId: string;
  userId: string;
  layer: string;        // Camada que bloqueou
  input: string;
  reason?: string;
  confidence?: number;
  action: 'blocked' | 'allowed' | 'warned';
  createdAt: Date;
}
```

---

## API Design

### POST /api/guardrails/check
**Request:**
```json
{
  "message": "O que é fotossíntese?",
  "userId": "5511999999999",
  "childId": "uuid-opcional"
}
```

**Response (aprovado):**
```json
{
  "safe": true,
  "layers": [
    {"name": "format", "passed": true, "confidence": 1.0},
    {"name": "injection", "passed": true, "confidence": 1.0},
    {"name": "classifier", "passed": true, "category": "school", "confidence": 0.95},
    {"name": "keywords", "passed": true, "confidence": 1.0},
    {"name": "spam", "passed": true, "count": 3, "confidence": 1.0}
  ]
}
```

**Response (bloqueado):**
```json
{
  "safe": false,
  "layers": [...],
  "blockedLayer": "classifier",
  "reason": "Conteúdo inadequado: violence",
  "confidence": 0.92
}
```
