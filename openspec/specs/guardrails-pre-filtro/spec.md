# Guardrails: camada 0, pré-filtro

## Purpose
Filtro determinístico que roda antes de qualquer chamada a modelo: sem rede, sem custo, em milissegundos. Implementado em M-21 (`packages/safety/src/prefilter.ts`).

## Requirements

### Requirement: Tamanho da mensagem
O pré-filtro SHALL bloquear mensagens vazias e mensagens com mais de 500 caracteres (após remover espaços nas pontas).

#### Scenario: Mensagem vazia
- **WHEN** a mensagem está vazia ou só tem espaços
- **THEN** a decisão é `block` com categoria `vazio`

#### Scenario: Mensagem longa demais
- **WHEN** a mensagem tem mais de 500 caracteres
- **THEN** a decisão é `block` com categoria `tamanho`

### Requirement: Tentativa de burlar instruções
O pré-filtro SHALL bloquear padrões conhecidos de prompt injection em português (ignorar regras, revelar o prompt, assumir outro papel, "modo desenvolvedor").

#### Scenario: Pedido para ignorar regras
- **WHEN** a mensagem pede "ignore as suas instruções"
- **THEN** a decisão é `block` com categoria `injecao`

### Requirement: Dados pessoais
O pré-filtro SHALL redirecionar mensagens que contenham e-mail, telefone, CPF, CEP ou endereço com número, antes de enviá-las ao modelo.

#### Scenario: Mensagem com telefone
- **WHEN** a mensagem contém um telefone brasileiro
- **THEN** a decisão é `redirect` com categoria `dado_pessoal`

### Requirement: Limite de uso
O pré-filtro SHALL limitar mensagens por usuário por minuto e por dia, com limites configuráveis.

#### Scenario: Limite por minuto excedido
- **WHEN** o usuário atinge o limite por minuto
- **THEN** a decisão é `block` com categoria `limite_uso`

#### Scenario: Janela deslizante
- **WHEN** passa a janela de um minuto
- **THEN** o usuário volta a poder enviar mensagens, respeitando o limite diário

### Requirement: Contador em memória nesta etapa
O contador de limite de uso SHALL ficar em memória nesta etapa. A persistência no banco para produção é pendente e SHALL ser tratada na change `classificador-entrada-e-registro`.

#### Scenario: Reinício do processo
- **WHEN** o processo reinicia
- **THEN** os contadores zeram (limitação conhecida, a ser removida)
