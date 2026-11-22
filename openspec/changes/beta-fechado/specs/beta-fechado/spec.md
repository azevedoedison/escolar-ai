# Beta fechado

## Purpose
Validação com famílias antes do lançamento pago.

## ADDED Requirements

### Requirement: Entrevistas
Cada família do beta SHALL ser entrevistada no início e no fim.

#### Scenario: Família no beta
- **WHEN** a família entra e quando sai
- **THEN** há registro das duas entrevistas

### Requirement: Consentimento antes de dado real
Nenhuma família SHALL usar o beta antes de aceitar o termo de consentimento revisado.

#### Scenario: Família nova
- **WHEN** a família se cadastra
- **THEN** o consentimento é registrado antes do primeiro uso

### Requirement: Metas do beta
O beta SHALL medir 20 famílias ativas, uso semanal de 60% das crianças após 4 semanas e nota de confiança dos pais de pelo menos 8 em 10.

#### Scenario: Fim do beta
- **WHEN** o beta termina
- **THEN** o relatório informa se cada meta foi atingida

### Requirement: Casos anonimizados
Conversas reais SHALL entrar na suíte de avaliação apenas depois de anonimizadas.

#### Scenario: Caso real do beta
- **WHEN** um caso real é proposto para a suíte
- **THEN** dados pessoais são removidos antes da inclusão
