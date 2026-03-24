# 📋 Proposal: Reports System

## Resumo
Sistema de relatórios automáticos e alertas para pais.

## Funcionalidades

### 1. Relatório Semanal Automático (RF-021)
- Gerado automaticamente às **segundas-feiras 09:00**
- Enviado por email para o pai
- Conteúdo: perguntas, bloqueios, tópicos, tempo de uso

### 2. Alerta de Conteúdo (RF-022)
- Notificação quando criança atinge **3 bloqueios em 1 hora**
- Email imediato para o pai
- Lista as últimas tentativas bloqueadas

### 3. Report API (5.4)
- `GET /api/reports/:parentId/weekly` — relatório sob demanda
- `GET /api/conversations/:childId/alerts` — alertas ativos

## Por que separado do conversations.js?

| Atual (conversations) | Novo (reports) |
|-----------------------|----------------|
| Dados brutos | Dados agregados |
| Por criança | Por pai (todos os filhos) |
| Sob demanda | Automático + sob demanda |

## Tecnologias
- **Cron:** OpenClaw cron (segundas 09:00)
- **Email:** Nodemailer (já configurado)
- **Dados:** ConversationRepository (existente)
