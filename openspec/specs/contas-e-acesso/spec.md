# Contas e acesso

## Purpose
Define como o responsável e as crianças entram no produto. Estado atual: cadastro e login do responsável (M-02) e cadastro de filho com PIN (M-03). Pareamento de aparelho e login da criança por PIN estão na change `pareamento-e-login-crianca`.

## Requirements

### Requirement: Cadastro do responsável com consentimento parental
O sistema SHALL permitir que um responsável crie conta com nome, e-mail e senha, e SHALL exigir o aceite do termo de consentimento parental (LGPD, art. 14) antes de concluir o cadastro. O sistema SHALL registrar a data do aceite e a versão do termo (`CONSENT_VERSION`).

#### Scenario: Cadastro válido
- **WHEN** o responsável informa nome com 2 ou mais caracteres, e-mail válido, senha com 8 ou mais caracteres e aceita o termo
- **THEN** a conta e a família são criadas e o consentimento é registrado com data e versão

#### Scenario: Cadastro sem consentimento
- **WHEN** o responsável tenta se cadastrar sem aceitar o termo
- **THEN** o cadastro é recusado com a mensagem "É preciso aceitar o termo de consentimento."

#### Scenario: Senha curta ou e-mail inválido
- **WHEN** a senha tem menos de 8 caracteres ou o e-mail é inválido
- **THEN** o cadastro é recusado com erro no campo correspondente

### Requirement: Login do responsável
O sistema SHALL autenticar o responsável por e-mail e senha usando o Supabase Auth.

#### Scenario: Campos obrigatórios
- **WHEN** o e-mail é inválido ou a senha está vazia
- **THEN** o login é recusado com erro no campo correspondente

### Requirement: Cadastro de filho
O responsável SHALL poder cadastrar filhos da própria família informando apelido, ano de nascimento, série, avatar e PIN. O sistema SHALL NOT pedir nome completo, escola ou cidade. O PIN SHALL ser guardado apenas como hash.

#### Scenario: Filho válido
- **WHEN** o apelido não está vazio, a idade (ano atual menos ano de nascimento) está entre 5 e 17 anos e o PIN tem de 4 a 6 dígitos
- **THEN** o filho é criado na família do responsável

#### Scenario: Idade fora da faixa
- **WHEN** a idade calculada é menor que 5 ou maior que 17
- **THEN** o cadastro é recusado com a mensagem "A idade deve ficar entre 5 e 17 anos."

#### Scenario: PIN inválido
- **WHEN** o PIN não tem de 4 a 6 números
- **THEN** o cadastro é recusado com a mensagem "O PIN precisa ter de 4 a 6 números."

### Requirement: Avatares permitidos
O sistema SHALL aceitar apenas os avatares da lista fixa: raposa, coruja, gato, panda, dino e astronauta.

#### Scenario: Avatar fora da lista
- **WHEN** o cadastro traz um avatar que não está na lista
- **THEN** o cadastro é recusado
