## MODIFIED Requirements

### Requirement: Contador em memória nesta etapa
O contador de limite de uso SHALL ficar no banco, de modo que sobreviva a reinício do processo e funcione com mais de uma instância da API.

#### Scenario: Reinício do processo
- **WHEN** o processo reinicia
- **THEN** os contadores continuam valendo
