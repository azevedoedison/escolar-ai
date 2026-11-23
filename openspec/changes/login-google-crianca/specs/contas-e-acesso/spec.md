## ADDED Requirements

### Requirement: Login da criança com Google
A criança SHALL poder entrar no aparelho pareado com a conta Google vinculada pelo responsável, como opção ao lado do PIN e do e-mail e senha. A opção SHALL aparecer somente quando a API tiver as credenciais do Google configuradas. A sessão SHALL ser a mesma do login por PIN e SHALL usar o mesmo contador de tentativas.

#### Scenario: Conta vinculada
- **WHEN** a criança entra com a conta Google cujo e-mail o responsável vinculou, em aparelho pareado e não revogado
- **THEN** a sessão da criança é aberta e o identificador da conta Google fica gravado

#### Scenario: Conta não vinculada
- **WHEN** a criança entra com uma conta Google diferente da vinculada, ou o filho não tem conta vinculada
- **THEN** o login é recusado e a tentativa conta no bloqueio

#### Scenario: Sem credenciais do Google
- **WHEN** a API não tem as credenciais do Google no ambiente
- **THEN** o botão não aparece e a rota de login com Google responde 404

#### Scenario: Conta de outro filho
- **WHEN** a conta vinculada a um filho é usada no aparelho de outro filho
- **THEN** o login é recusado

### Requirement: Vínculo da conta Google pelo responsável
O responsável SHALL poder vincular, trocar ou remover o e-mail Google de um filho da própria família. Trocar o e-mail SHALL invalidar o vínculo anterior da conta. O mesmo e-mail SHALL NOT vincular dois filhos.

#### Scenario: E-mail já em uso
- **WHEN** o responsável tenta vincular um e-mail Google já vinculado a outro filho
- **THEN** o vínculo é recusado
