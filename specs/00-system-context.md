# 📋 SDD - System Context Specification
# Escolar AI - IA Educacional com Controle Parental

**Versão:** 1.0  
**Data:** 2026-03-23  
**Autor:** Edison Azevedo + Robert (IA)

---

## 1. Visão do Sistema (System Vision)

### 1.1 Propósito
O **Escolar AI** é uma plataforma de inteligência artificial educacional voltada para crianças brasileiras (6-14 anos) que utiliza WhatsApp como canal principal, oferecendo:
- Assistência de pesquisa escolar com guard rails educationais
- Controle parental via relatórios automáticos
- Proteção contra conteúdo inadequado

### 1.2 Escopo
```
IN SCOPE:
├── WhatsApp Bot para crianças
├── Controle parental para pais
├── Guard rails de conteúdo
├── Relatórios automáticos
└── Dashboard web dos pais

OUT OF SCOPE (v1):
├── Aplicativo nativo (Android/iOS)
├── Conteúdo curricular completo
├── Integração com escolas
└── Sistema de gamificação
```

---

## 2. Atores do Sistema

### 2.1 Primary Actors

| Ator | Descrição | Necessidades |
|------|-----------|--------------|
| **Criança** | Usuário final (6-14 anos) | Fazer perguntas escolares, receber respostas didáticas |
| **Pai/Mãe** | Responsável legal | Cadastrar filho, receber relatórios, controlar acesso |
| **Admin** | Operador do sistema | Gerenciar usuários, monitorar métricas |

### 2.2 Secondary Actors

| Ator | Descrição |
|------|-----------|
| **OpenAI API** | Provedor de IA (GPT-4o-mini) |
| **WhatsApp Business API** | Canal de comunicação |
| **Banco de Dados** | Armazenamento de dados |

---

## 3. Restrições do Sistema

### 3.1 Restrições Técnicas
- **Linguagem:** JavaScript/Node.js
- **Framework:** Express.js ou Fastify
- **IA:** OpenAI GPT-4o-mini
- **WhatsApp:** 360dialog ou Twilio
- **Database:** PostgreSQL ou MongoDB

### 3.2 Restrições de Negócio
- **LGPD:** Dados de crianças são sensíveis (Art. 5º, II)
- **ECA Digital:** Verificação de idade obrigatória (Lei 15.211/2025)
- **Menores de 13:** Consentimento parental obrigatório
- **Data Residency:** Dados devem ficar no Brasil

### 3.3 Restrições Operacionais
- **Disponibilidade:** 99.5% uptime
- **Latência:** Resposta < 5 segundos
- **Concurrent Users:** 1.000 simultâneos (fase 1)

---

## 4. Tecnologias Aprovadas

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Backend** | Node.js 20+ | Experiência da equipe, performance |
| **Framework** | Fastify | Performance, validação de schemas |
| **IA** | OpenAI GPT-4o-mini | Custo-benefício, qualidade PT-BR |
| **WhatsApp** | 360dialog | Simplicidade, preço |
| **Database** | PostgreSQL | Robusto, relacional |
| **Cache** | Redis | Performance, sessões |
| **Hosting** | AWS (São Paulo) | LGPD compliance, latência |

---

## 5. Políticas de Segurança

### 5.1 Dados Pessoais
- NÃO coletar nome completo da criança
- NÃO coletar localização
- NÃO armazenar mensagens por mais de 90 dias
- Criptografia AES-256 em repouso
- TLS 1.3 em trânsito

### 5.2 Consentimento
- Obrigatoriedade de consentimento parental antes do uso
- Termos de uso claros e em linguagem simples
- Possibilidade de exclusão de dados (direito ao esquecimento)

### 5.3 Monitoramento
- Log de todas as interações (para segurança)
- Alertas automáticos para conteúdo inadequado
- Dashboard de métricas de segurança

---

## 6. Requisitos Não-Funcionais

### 6.1 Performance
| Métrica | Target |
|---------|--------|
| Tempo de resposta (p95) | < 3 segundos |
| Throughput | 100 req/min |
| Disponibilidade | 99.5% |
| Recovery Time (RTO) | < 1 hora |

### 6.2 Escalabilidade
- Horizontal scaling (stateless)
- Database connection pooling
- Cache para respostas frequentes

### 6.3 Usabilidade
- Interface 100% via WhatsApp (não requer instalação)
- Respostas com emojis e linguagem simples
- Comandos intuitivos (!help, !pai, etc.)

---

## 7. Assunções e Dependências

### 7.1 Assunções
- Crianças têm acesso ao WhatsApp
- Pais possuem smartphones Android/iOS
- Conexão com internet estável

### 7.2 Dependências Externas
- OpenAI API (disponibilidade e custo)
- WhatsApp Business API (políticas do Meta)
- Conta de hosting (AWS/GCP)

---

## 8. Riscos Identificados

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| IA responde conteúdo inadequado | Crítico | Média | Guard rails + human review |
| WhatsApp muda políticas | Alto | Baixa | Multi-channel (web, app) |
| LGPD compliance | Crítico | Média | Advogado especializado |
| Custo de API elevado | Médio | Alta | Cache, otimização |

---

**Próximo:** [Feature Specification - Guard Rails](./01-guard-rails-spec.md)
