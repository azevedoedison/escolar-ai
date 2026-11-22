# Provedor de IA

## Purpose
Controlar para onde vão os dados de crianças e como a IA é chamada.

## ADDED Requirements

### Requirement: Dado real só com provedor contratado
Dado real de criança SHALL ser enviado apenas a provedor de IA com contrato de dados que proíba o treino com as mensagens. Provedores sem esse contrato SHALL receber apenas dado sintético.

#### Scenario: Produção
- **WHEN** a API envia a pergunta de uma criança ao modelo
- **THEN** a chamada vai ao provedor contratado (Anthropic)

#### Scenario: Teste ou avaliação
- **WHEN** a suíte de avaliação roda com um provedor alternativo
- **THEN** todos os casos são sintéticos

### Requirement: Camada de IA isolada
Todas as chamadas a modelo SHALL passar por uma interface própria em `packages/safety`, de modo que o provedor possa ser trocado sem alterar a pipeline de segurança.

#### Scenario: Provedor falso
- **WHEN** testes de integração rodam
- **THEN** usam um cliente falso com respostas fixas, sem rede

### Requirement: Modelo padrão
O modelo de geração e de classificação SHALL ser Claude Haiku 5.5 com esforço `medium`, até que a suíte de avaliação justifique outra escolha.

#### Scenario: Mudança de modelo
- **WHEN** o modelo padrão é trocado
- **THEN** a suíte de avaliação completa roda e as metas de aceite são atendidas antes do merge

### Requirement: Limite de gasto
A conta de API SHALL ter um limite de gasto mensal configurado.

#### Scenario: Limite atingido
- **WHEN** o limite mensal é atingido
- **THEN** a API para de gerar e a criança recebe a mensagem de "não consegui responder agora"
