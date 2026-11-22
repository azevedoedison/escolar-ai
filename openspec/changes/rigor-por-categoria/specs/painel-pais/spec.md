## ADDED Requirements

### Requirement: Rigor por categoria
O responsável SHALL poder deixar cada categoria da política mais estrita ou mais aberta que o padrão.

#### Scenario: Categoria mais estrita
- **WHEN** o responsável marca "drogas" como estrita
- **THEN** perguntas de prevenção passam a receber decisão mais restritiva para esse filho

### Requirement: Crise e abuso não ajustáveis
As categorias de crise, abuso e aliciamento SHALL NOT ser abertas pelo responsável.

#### Scenario: Tentativa de abrir crise
- **WHEN** o responsável tenta reduzir o rigor de crise
- **THEN** a alteração é recusada

### Requirement: Temas extras bloqueados
O responsável SHALL poder listar temas extras a bloquear, tratados pelo classificador como dado.

#### Scenario: Tema extra
- **WHEN** a criança pergunta sobre um tema da lista
- **THEN** a decisão é bloquear
