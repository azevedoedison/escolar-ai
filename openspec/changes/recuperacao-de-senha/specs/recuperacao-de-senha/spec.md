# Recuperação de senha

## Purpose
Permitir ao responsável pedir a recuperação da senha.

## ADDED Requirements

### Requirement: Pedido de recuperação
O app SHALL permitir pedir o link de recuperação informando o e-mail.

#### Scenario: E-mail inválido
- **WHEN** o responsável envia um e-mail mal formado
- **THEN** o app mostra "E-mail inválido." e não faz o pedido

#### Scenario: Pedido enviado
- **WHEN** o responsável envia um e-mail válido
- **THEN** o app mostra "Se o e-mail existir, enviamos o link de recuperação."

### Requirement: Sem enumeração de contas
A resposta SHALL ser igual para e-mails com e sem conta.

#### Scenario: E-mail sem conta
- **WHEN** o e-mail não tem conta
- **THEN** a mensagem mostrada é a mesma do e-mail com conta
