# Assinaturas

## Purpose
Cobrança do plano Família pelas lojas.

## ADDED Requirements

### Requirement: Plano Família
O plano Família SHALL permitir até 3 filhos e todos os recursos, com limite justo de uso diário.

#### Scenario: Quarto filho
- **WHEN** o responsável tenta cadastrar o quarto filho
- **THEN** o cadastro é recusado com orientação

### Requirement: Teste grátis
Todo novo plano Família SHALL ter 14 dias de teste grátis.

#### Scenario: Assinatura nova
- **WHEN** o responsável assina pela primeira vez
- **THEN** os primeiros 14 dias não são cobrados

### Requirement: Compra só para o responsável
Telas de compra SHALL aparecer apenas no modo Responsável.

#### Scenario: Modo Criança
- **WHEN** a criança usa o app
- **THEN** nenhuma tela de compra é exibida

### Requirement: Estado da assinatura
A API SHALL ler o estado da assinatura do RevenueCat e SHALL aplicar o acesso conforme esse estado.

#### Scenario: Assinatura vencida
- **WHEN** a assinatura expira
- **THEN** o chat da criança é suspenso com mensagem ao responsável
