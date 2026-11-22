## ADDED Requirements

### Requirement: Mesma política para imagem
O conteúdo extraído de uma imagem SHALL passar pelo pré-filtro e pelo classificador de entrada antes de qualquer resposta.

#### Scenario: Foto de exercício
- **WHEN** a criança envia a foto de um exercício
- **THEN** o texto extraído é avaliado como se tivesse sido digitado

### Requirement: Dado pessoal em imagem
Imagem com dado pessoal ou documento SHALL ser redirecionada, sem ser respondida.

#### Scenario: Foto de documento
- **WHEN** a foto mostra um documento
- **THEN** a decisão é `redirect` com categoria `dado_pessoal`

### Requirement: Retenção da imagem
Imagens SHALL seguir a retenção da família e SHALL ser apagadas junto com as conversas.

#### Scenario: Limpeza
- **WHEN** a limpeza de retenção roda
- **THEN** as imagens antigas são apagadas
