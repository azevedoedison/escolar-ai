# Escolas

## Purpose
Piloto B2B2C com escolas particulares.

## ADDED Requirements

### Requirement: Escola só vê dados agregados
A escola SHALL receber apenas dados agregados e SHALL NOT ler conversas individuais.

#### Scenario: Relatório da escola
- **WHEN** a escola consulta o relatório
- **THEN** vê contagens e temas agregados, sem texto de conversas

### Requirement: Consentimento do responsável
O uso por aluno SHALL continuar dependendo do consentimento do responsável.

#### Scenario: Aluno de escola piloto
- **WHEN** o aluno é cadastrado
- **THEN** existe consentimento do responsável registrado

### Requirement: Início tardio
O piloto SHALL começar apenas depois de seis meses de produto estável.

#### Scenario: Planejamento
- **WHEN** o piloto é agendado
- **THEN** o produto cumpre o critério de estabilidade definido
