# Distribuição mobile

## Purpose
Como o app chega aos aparelhos da família.

## ADDED Requirements

### Requirement: Android e tablet
O app SHALL ser instalável em celular e tablet Android por build interno antes do beta.

#### Scenario: Instalação
- **WHEN** o responsável instala o build interno
- **THEN** o app abre e permite o pareamento

### Requirement: Versão web
O mesmo app SHALL estar disponível na web em domínio próprio.

#### Scenario: Acesso pelo navegador
- **WHEN** o responsável abre o domínio
- **THEN** consegue entrar e usar o painel

### Requirement: Guia para os pais
O produto SHALL oferecer um guia para instalar, parear e configurar Family Link ou Tempo de Uso, deixando a Tatá como IA permitida.

#### Scenario: Primeiro uso
- **WHEN** o responsável conclui o cadastro
- **THEN** encontra o guia

### Requirement: iOS
O app SHALL ter build iOS distribuído por TestFlight no beta.

#### Scenario: Beta iOS
- **WHEN** uma família usa iPhone ou iPad
- **THEN** instala pelo TestFlight

### Requirement: Lojas
A publicação nas lojas SHALL seguir as regras de apps para famílias e SHALL NOT incluir SDK de anúncio nem analytics de terceiros no app da criança.

#### Scenario: Envio para revisão
- **WHEN** o app é enviado à loja
- **THEN** a declaração de dados reflete a coleta mínima
