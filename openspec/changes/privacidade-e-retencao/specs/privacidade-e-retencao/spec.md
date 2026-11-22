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

### Requirement: Apagar conversas e excluir conta
O responsável SHALL poder apagar conversas e excluir a conta. Excluir a conta SHALL remover todos os dados da família.

#### Scenario: Exclusão de conta
- **WHEN** o responsável confirma a exclusão da conta
- **THEN** família, filhos, aparelhos, conversas, mensagens, eventos e alertas são removidos

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
