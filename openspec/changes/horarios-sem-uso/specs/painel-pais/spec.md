## ADDED Requirements

### Requirement: Horários sem uso
O responsável SHALL poder definir horários em que a criança não usa a Tatá.

#### Scenario: Horário bloqueado
- **WHEN** a criança envia uma pergunta dentro de um horário sem uso
- **THEN** a pergunta não vai ao modelo e a criança recebe a resposta padrão de horário

### Requirement: Regra no servidor
A regra de horário SHALL ser aplicada pela API, não pelo app.

#### Scenario: App adulterado
- **WHEN** um cliente ignora a regra
- **THEN** a API ainda recusa a pergunta
