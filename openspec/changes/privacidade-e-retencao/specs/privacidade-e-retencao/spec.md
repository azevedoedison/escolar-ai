# Privacidade e retenção

## Purpose
Cumprir LGPD e ECA Digital: coleta mínima, retenção controlada e direitos do titular pelo painel.

## ADDED Requirements

### Requirement: Retenção configurável por família
O sistema SHALL apagar conversas mais antigas que o período de retenção da família. O padrão SHALL ser 90 dias e o responsável SHALL poder escolher de 30 a 365 dias. A configuração SHALL ser persistida no banco.

#### Scenario: Conversa antiga
- **WHEN** a limpeza roda e uma conversa tem mais de 90 dias na família com o padrão
- **THEN** a conversa é apagada

#### Scenario: Limpeza não cruza famílias
- **WHEN** a limpeza roda para a família A
- **THEN** nenhuma conversa da família B é afetada

#### Scenario: Alerta de crise não resolvido
- **WHEN** a conversa antiga tem alerta de crise não resolvido
- **THEN** o alerta é mantido

### Requirement: Exportar dados
O responsável SHALL poder exportar os dados da própria família pelo painel.

#### Scenario: Exportação
- **WHEN** o responsável pede a exportação
- **THEN** recebe um arquivo com filhos, conversas e eventos da própria família e o ato é registrado em `audit_log`

### Requirement: Apagar conversas e excluir contas
O responsável SHALL poder apagar conversas, excluir a conta de um filho e excluir a própria conta. Excluir um filho SHALL remover só os dados dele. Excluir a conta do responsável SHALL ser recusada enquanto houver filhos vinculados; sem filhos, SHALL remover a família e todos os seus dados.

#### Scenario: Exclusão de filho
- **WHEN** o responsável confirma a exclusão de um filho
- **THEN** aparelhos, sessões, códigos de pareamento, conversas, mensagens, eventos e alertas dele são removidos, a família e os outros filhos ficam e o ato é registrado em `audit_log`

#### Scenario: Responsável com filhos
- **WHEN** o responsável pede a exclusão da própria conta e há filhos vinculados
- **THEN** a exclusão é recusada (`children_linked`), nada é apagado, e a mensagem orienta a excluir primeiro as contas dos filhos

#### Scenario: Responsável sem filhos
- **WHEN** o responsável sem filhos confirma a exclusão da conta
- **THEN** família, configurações, alertas, auditoria e o login do responsável são removidos

### Requirement: Trilha de auditoria
O sistema SHALL registrar em `audit_log` quem viu, apagou ou exportou dados de criança.

#### Scenario: Responsável apaga conversa
- **WHEN** o responsável apaga uma conversa
- **THEN** existe um registro com ator, ação e alvo

### Requirement: Coleta mínima
O sistema SHALL coletar apenas apelido, ano de nascimento e série opcional da criança, e SHALL NOT incluir SDK de anúncio nem de analytics de terceiros no app da criança.

#### Scenario: Cadastro de filho
- **WHEN** o responsável cadastra um filho
- **THEN** o formulário não pede nome completo, escola nem cidade

### Requirement: Segundo responsável
O responsável dono da família SHALL poder convidar um segundo responsável por e-mail, com acesso às mesmas informações da família.

#### Scenario: Convite aceito
- **WHEN** o convidado aceita
- **THEN** passa a ver os filhos da família e nenhuma outra
