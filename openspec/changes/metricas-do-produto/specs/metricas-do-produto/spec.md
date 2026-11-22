# Métricas do produto

## Purpose
Medir o produto sem expor conversas.

## ADDED Requirements

### Requirement: Métricas agregadas
O sistema SHALL calcular uso semanal por criança, perguntas por sessão, taxa de bloqueio por categoria, bloqueios contestados, alertas de crise com tempo até visualização e custo de IA por família.

#### Scenario: Consulta semanal
- **WHEN** a equipe abre o painel interno
- **THEN** vê as métricas da semana

### Requirement: Sem conteúdo de conversa
As métricas SHALL NOT incluir o texto de perguntas ou respostas.

#### Scenario: Consulta de métricas
- **WHEN** uma métrica é calculada
- **THEN** o resultado contém apenas contagens, categorias e tempos

### Requirement: Sem analytics de terceiros
O app da criança SHALL NOT enviar dados de uso a serviços de analytics de terceiros.

#### Scenario: Uso do app
- **WHEN** a criança usa o app
- **THEN** nenhum evento sai para serviço de analytics de terceiros
