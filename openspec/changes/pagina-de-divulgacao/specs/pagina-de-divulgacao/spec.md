# Página de divulgação

## Purpose
Captação de interesse antes do lançamento.

## ADDED Requirements

### Requirement: Lista de espera
A página SHALL permitir que um responsável entre na lista de espera informando e-mail e consentimento para contato.

#### Scenario: Inscrição
- **WHEN** o visitante envia e-mail e marca o consentimento
- **THEN** o e-mail entra na lista

### Requirement: Sem rastreadores
A página SHALL NOT carregar rastreadores de terceiros.

#### Scenario: Carregamento
- **WHEN** a página abre
- **THEN** nenhuma requisição a rastreador de terceiros é feita

### Requirement: Descadastro
Todo e-mail enviado à lista SHALL permitir o descadastro.

#### Scenario: E-mail da lista
- **WHEN** o inscrito pede para sair
- **THEN** é removido da lista
