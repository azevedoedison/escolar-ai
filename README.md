# 📚 Escolar AI

IA Educacional com Controle Parental via WhatsApp

## 🎯 Visão Geral

O **Escolar AI** é uma plataforma de inteligência artificial educacional voltada para crianças (6-14 anos) que oferece:

- 🛡️ **Guard Rails Educationais** - Responde apenas conteúdo escolar
- 👨‍👩‍👧 **Controle Parental via WhatsApp** - Relatórios automáticos para pais
- 💬 **Chat Simples** - Criança usa WhatsApp (sem instalar nada)

## 📊 Mercado

- **EdTech Brasil:** USD 6,0 bi (2025) → USD 15,6 bi (2034)
- **65%** das crianças 9-17 anos usam IA generativa
- **Brasil TOP 3** no uso do ChatGPT

## 🚀 Tecnologias

- **Backend:** Node.js + Fastify
- **IA:** OpenAI GPT-4o-mini
- **WhatsApp:** 360dialog / Twilio
- **Database:** PostgreSQL + Redis

## 📁 Estrutura

```
escolar-ai/
├── docs/           # Documentação
├── src/            # Código fonte
│   ├── bot/        # WhatsApp bot
│   ├── api/        # Backend API
│   └── database/   # Models
├── config/         # Configurações
└── scripts/        # Scripts úteis
```

## 🔧 Setup

```bash
# Clonar repositório
git clone https://github.com/robertclaw-ia/robert-edison-projects.git
cd robert-edison-projects/escolar-ai

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp config/.env.example config/.env
# Editar config/.env com suas chaves

# Iniciar desenvolvimento
npm run dev
```

## 👥 Equipe

- **Edison Azevedo** - CEO/Product
- **Robert (IA)** - CTO/Dev Assistant

## 📅 Timeline

- **Mês 1-3:** MVP WhatsApp + Dogfooding
- **Mês 3-4:** Beta (50 famílias)
- **Mês 4-6:** Lançamento pago
- **Mês 12-18:** Rodada Seed

---

**Desenvolvido com ❤️ por Edison & Robert**
