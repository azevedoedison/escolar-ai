## ADDED Requirements

### Requirement: Verificação por trechos
O sistema SHALL conferir a resposta em trechos durante o streaming, e nenhum trecho SHALL ser exibido antes de ser conferido.

#### Scenario: Trecho adequado
- **WHEN** o trecho é aprovado
- **THEN** ele é enviado ao app

### Requirement: Corte quando barrado
Se um trecho for barrado, o sistema SHALL interromper o fluxo e SHALL substituir o conteúdo pela resposta padrão.

#### Scenario: Trecho barrado
- **WHEN** o classificador bloqueia um trecho
- **THEN** a resposta padrão aparece e a decisão é registrada em `safety_event`

### Requirement: Tempo de início
O início da resposta SHALL ter p95 abaixo de 3 segundos com 50 usuários simultâneos.

#### Scenario: Carga leve
- **WHEN** 50 usuários conversam por 5 minutos
- **THEN** o p95 do início da resposta fica abaixo de 3 s
