## ADDED Requirements

### Requirement: Privacidade pelo painel
O responsável autenticado SHALL poder, pela API e pelo app, ver e mudar a retenção da família, exportar os dados da família, apagar conversas e excluir a conta de um filho. A família SHALL vir sempre da sessão do responsável. Alvo de outra família SHALL responder como alvo inexistente.

#### Scenario: Mudar a retenção
- **WHEN** o responsável escolhe 45 dias
- **THEN** a retenção da família passa a 45, a mudança fica em `audit_log` e a limpeza automática usa o novo valor só para essa família

#### Scenario: Retenção fora da faixa
- **WHEN** o pedido traz menos de 30 ou mais de 365 dias, ou um valor que não é inteiro
- **THEN** a API responde 400 e nada muda

#### Scenario: Exportar
- **WHEN** o responsável pede a exportação
- **THEN** recebe um arquivo JSON só com a própria família, sem hash de PIN, e o ato fica em `audit_log`

#### Scenario: Alvo de outra família
- **WHEN** o responsável tenta apagar a conversa, as conversas ou a conta de um filho de outra família
- **THEN** a resposta é 404, igual à de um id inexistente, e nada é apagado

#### Scenario: Excluir filho sem confirmação
- **WHEN** o pedido de exclusão de filho não traz a confirmação explícita
- **THEN** a API responde 400 e nada é apagado

#### Scenario: Sem sessão
- **WHEN** a chamada não traz sessão válida do responsável
- **THEN** a API responde 401 e não toca no banco

### Requirement: Exclusão da conta do responsável fora da API
A API SHALL NOT expor a exclusão da conta do responsável até haver decisão sobre o login do segundo responsável.

#### Scenario: Rota inexistente
- **WHEN** alguém chama uma rota de exclusão de conta do responsável
- **THEN** a API responde 404
