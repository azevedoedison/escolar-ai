# Operação e infraestrutura

## Purpose
Onde o produto roda, com quais contas e limites.

## ADDED Requirements

### Requirement: Dados no Brasil
O banco e a API SHALL ficar na região de São Paulo.

#### Scenario: Criação do banco
- **WHEN** o projeto Supabase é criado
- **THEN** a região é São Paulo

### Requirement: Limite de gasto nos provedores
Toda conta de provedor pago SHALL ter limite de gasto mensal configurado.

#### Scenario: Conta de API nova
- **WHEN** a conta é criada
- **THEN** o limite mensal é definido antes de qualquer chave ser usada em produção

### Requirement: Erros sem conteúdo de conversa
O monitoramento de erros SHALL NOT receber texto de perguntas ou respostas das crianças.

#### Scenario: Erro no chat
- **WHEN** uma exceção é enviada ao Sentry
- **THEN** o relatório não contém o texto da conversa

### Requirement: Nome e domínio verificados
O nome "Tatá IA" e o domínio SHALL ser verificados antes do lançamento público.

#### Scenario: Antes do beta aberto
- **WHEN** o beta fechado termina
- **THEN** existe registro da verificação de nome, domínio e pedido de marca
