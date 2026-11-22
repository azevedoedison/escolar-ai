## ADDED Requirements

### Requirement: Login direto do responsável
O responsável SHALL poder entrar com e-mail e senha da própria conta em qualquer aparelho, sem passar pelo aparelho da criança. A sessão SHALL ser revogável ao sair.

#### Scenario: Login correto
- **WHEN** o responsável envia e-mail e senha corretos
- **THEN** recebe uma sessão que abre o painel da própria família

#### Scenario: Sair
- **WHEN** o responsável sai
- **THEN** a sessão deixa de valer na hora

#### Scenario: Dados errados
- **WHEN** o e-mail não existe ou a senha está errada
- **THEN** a resposta é a mesma nos dois casos

#### Scenario: Tentativas repetidas
- **WHEN** ocorrem 5 erros para o mesmo e-mail em 5 minutos
- **THEN** o login é bloqueado por 15 minutos, mesmo com a senha certa
