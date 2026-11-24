## ADDED Requirements

### Requirement: Confirmação de e-mail do responsável
O sistema SHALL enviar ao e-mail do cadastro um link de uso único, válido por 24 horas, que confirma a conta. Enquanto o e-mail não estiver confirmado, o sistema SHALL recusar o login do responsável, direto ou pelo modo Responsável.

#### Scenario: Link válido
- **WHEN** o responsável abre o link de confirmação dentro do prazo
- **THEN** o e-mail passa a confirmado, o link deixa de valer e a confirmação é registrada na auditoria

#### Scenario: Link usado, vencido ou inventado
- **WHEN** o link já foi usado, venceu ou não existe
- **THEN** a confirmação é recusada com a mesma resposta nos três casos

#### Scenario: Login sem confirmar
- **WHEN** o responsável entra com e-mail e senha corretos antes de confirmar
- **THEN** o login é recusado com a orientação de confirmar o e-mail

#### Scenario: Reenviar confirmação
- **WHEN** o responsável pede novo envio
- **THEN** a resposta é a mesma exista a conta ou não, e o link anterior deixa de valer

### Requirement: Recuperação de senha do responsável
O sistema SHALL permitir que o responsável redefina a senha por um link enviado ao e-mail da conta. O link SHALL ser de uso único e valer por 1 hora. A resposta ao pedido SHALL ser sempre a mesma, exista a conta ou não. O sistema SHALL limitar os pedidos a 3 por e-mail por hora.

#### Scenario: Pedido para conta existente
- **WHEN** o responsável informa o e-mail de uma conta
- **THEN** recebe o link e a resposta é a mesma de um e-mail sem conta

#### Scenario: Troca de senha
- **WHEN** o responsável abre o link dentro do prazo e informa uma senha nova com 8 ou mais caracteres
- **THEN** a senha é trocada, o link deixa de valer, todas as sessões do responsável são encerradas e a troca é registrada na auditoria

#### Scenario: Link usado ou vencido
- **WHEN** o link já foi usado ou passou de 1 hora
- **THEN** a troca é recusada e a senha continua a mesma

#### Scenario: Senha curta
- **WHEN** a senha nova tem menos de 8 caracteres
- **THEN** a troca é recusada e o link continua valendo

#### Scenario: Novo pedido invalida o anterior
- **WHEN** o responsável pede um segundo link
- **THEN** só o mais recente funciona

#### Scenario: Pedidos em excesso
- **WHEN** há mais de 3 pedidos para o mesmo e-mail em 1 hora
- **THEN** os seguintes são ignorados, sem e-mail, e a resposta continua igual

### Requirement: Envio de e-mail desacoplado
O sistema SHALL enviar e-mails por uma interface única. Sem provedor configurado, o envio SHALL ser simulado e imprimir o link no console.

#### Scenario: Envio simulado
- **WHEN** não há provedor real configurado e um link é gerado
- **THEN** o link aparece no console da API e nenhum e-mail sai
