# Exclusão no app

## Purpose
Permitir que o responsável apague os dados do filho e a própria conta pelo app.

## ADDED Requirements

### Requirement: Excluir filho
O app SHALL permitir excluir um filho só depois de o responsável digitar `EXCLUIR`, e SHALL apagar apenas os dados daquele filho.

#### Scenario: Confirmação incompleta
- **WHEN** o responsável abre a exclusão e não digita `EXCLUIR`
- **THEN** o botão de excluir fica desabilitado

#### Scenario: Exclusão confirmada
- **WHEN** o responsável digita `EXCLUIR` e confirma
- **THEN** o filho some da lista e os outros filhos permanecem

### Requirement: Excluir conta com filho ativo
O app SHALL mostrar a recusa do banco quando a conta ainda tem filhos e SHALL NOT apagar nada nesse caso.

#### Scenario: Conta com filho
- **WHEN** o responsável tenta excluir a conta e existe filho cadastrado
- **THEN** o app mostra "Exclua primeiro as contas dos filhos." e a conta continua ativa

### Requirement: Sem chave de serviço
O app SHALL chamar as funções de exclusão apenas com o login do responsável.

#### Scenario: Chamada
- **WHEN** o app exclui um filho ou a conta
- **THEN** usa o RPC autenticado e nenhuma chave de serviço
