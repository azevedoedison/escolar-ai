# 📋 AGENTS.md - Guia para Agentes de IA
# Escolar AI

Este documento fornece instruções para agentes de IA que trabalham neste repositório.

---

## 🎯 Regras Fundamentais

### 1. Sempre Comece pelas Specs
- **ANTES** de escrever qualquer código, leia a especificação correspondente em `specs/`
- Se não existir spec para a feature, **CRIE A SPEC PRIMEIRO** e peça aprovação
- Nunca assuma requisitos - especifique explicitamente

### 2. Siga a Arquitetura Definida
- Respeite as tecnologias aprovadas (System Context Specification)
- Não introduza dependências novas sem aprovação
- Mantenha a estrutura de pastas definida

### 3. Testes são Obrigatórios
- Cada feature tem testes em `tests/`
- Testes devem espelhar a especificação (Given/When/Then)
- Coverage mínimo: 80%

---

## 📁 Estrutura do Projeto

```
escolar-ai/
├── specs/                    # ESPECIFICAÇÕES SDD (LEIA PRIMEIRO!)
│   ├── 00-system-context.md # Visão geral do sistema
│   └── 01-guard-rails-spec.md # Especificação dos guard rails
│
├── src/                      # CÓDIGO FONTE
│   ├── bot/                  # WhatsApp bot
│   ├── api/                  # Backend API
│   ├── guardrails/           # Sistema de proteção
│   └── database/             # Models e migrations
│
├── tests/                    # TESTES
│   ├── unit/                 # Testes unitários
│   ├── integration/          # Testes de integração
│   └── acceptance/           # Testes de aceitação (specs)
│
├── config/                   # CONFIGURAÇÕES
│   └── .env.example          # Template de variáveis
│
└── docs/                     # DOCUMENTAÇÃO
    └── ...                   # Documentação adicional
```

---

## 🔄 Fluxo de Desenvolvimento SDD

### Passo 1: Ler Especificação
```bash
# Sempre comece aqui
cat specs/0X-feature-name.md
```

### Passo 2: Criar Testes Baseados na Spec
```javascript
// tests/unit/feature.test.js
// Siga os cenários de teste da spec
describe('Feature - [Nome da Feature]', () => {
  // DADO que...
  // QUANDO...
  // ENTÃO...
});
```

### Passo 3: Implementar Código
- Implemente apenas o necessário para os testes passarem
- Siga os padrões de código definidos
- Documente decisões importantes

### Passo 4: Validar
```bash
npm test
npm run lint
```

---

## 🛡️ Regras Específicas para Guard Rails

### Prioridade de Segurança
1. **NUNCA** remova ou simplifique uma camada de proteção
2. Sempre adicione testes para novos cenários de ataque
3. Log de TODAS as decisões de bloqueio

### Thresholds (NÃO altere sem aprovação)
- Classificação: 0.7
- Output check: 0.8
- Rate limit: 10 msgs/min

---

## 📝 Padrões de Código

### Nomenclatura
```javascript
// Funções: camelCase
function checkGuardRails() {}

// Classes: PascalCase
class GuardRailLayer {}

// Constantes: UPPER_SNAKE_CASE
const MAX_MESSAGE_LENGTH = 500;

// Arquivos: kebab-case
// guard-rails.js
// user-service.js
```

### Estrutura de Arquivo
```javascript
/**
 * [Nome do Arquivo]
 * [Descrição]
 */

// Dependencies
const { OpenAI } = require('openai');

// Constants
const CONFIG = { ... };

// Classes/Functions
class MyService {
  // ...
}

// Exports
module.exports = { MyService };
```

---

## 🚫 O que NÃO Fazer

1. **NÃO** escreva código sem ler a spec primeiro
2. **NÃO** ignore testes quebrados
3. **NÃO** armazene dados sensíveis em logs
4. **NÃO** use dados reais de crianças em testes
5. **NÃO** adicione dependências sem justificativa

---

## ✅ Checklist antes de Commit

- [ ] Li a especificação correspondente
- [ ] Escrevi/atualizei os testes
- [ ] Todos os testes passam
- [ ] Código segue os padrões
- [ ] Não há dados sensíveis expostos
- [ ] Mensagem de commit é descritiva

---

## 📞 Contato

- **Edison Azevedo** - Product Owner
- **Robert (IA)** - Tech Lead Assistant

---

*Última atualização: 2026-03-23*
