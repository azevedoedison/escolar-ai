# Painel dos pais

## Purpose
Dar ao responsável visibilidade completa do uso da criança, com alertas e controles.

## ADDED Requirements

### Requirement: Linha do tempo por filho
O responsável SHALL ver, para cada filho da própria família, as perguntas e respostas em ordem cronológica, com a categoria e a decisão de segurança de cada item.

#### Scenario: Pergunta bloqueada
- **WHEN** uma pergunta da criança foi bloqueada
- **THEN** o item aparece destacado, com categoria e motivo

#### Scenario: Filho de outra família
- **WHEN** o responsável pede o histórico de um filho de outra família
- **THEN** a resposta é 404 e nenhum dado é retornado

### Requirement: Conteúdo exibido como texto
O painel SHALL renderizar perguntas e respostas como texto puro. HTML ou script enviado pela criança SHALL NOT ser executado.

#### Scenario: Pergunta com HTML
- **WHEN** a criança envia `<img src=x onerror=alert(1)>`
- **THEN** o painel mostra o texto literal e nada é executado

### Requirement: Filtros e busca
O responsável SHALL poder filtrar por data, só bloqueadas e só alertas, e buscar por texto.

#### Scenario: Só alertas
- **WHEN** o responsável ativa "só alertas"
- **THEN** a lista mostra apenas itens que geraram alerta

### Requirement: Alerta imediato de crise
Quando a decisão for `crisis`, o sistema SHALL criar um alerta e notificar o responsável por push e e-mail.

#### Scenario: Sinal de crise
- **WHEN** a criança envia um sinal pessoal de sofrimento
- **THEN** um alerta `new` é criado e as duas notificações são enviadas

### Requirement: Alertas por repetição
O sistema SHALL criar alerta quando houver 3 bloqueios na mesma categoria em 24 horas, ou tentativas de burlar o filtro.

#### Scenario: Três bloqueios em um dia
- **WHEN** ocorrem 3 bloqueios da categoria `drogas` em 24 horas
- **THEN** um alerta é criado para o responsável

### Requirement: Estado do alerta
O responsável SHALL poder marcar o alerta como visto ou resolvido. Eventos de crise SHALL ser mantidos até serem resolvidos.

#### Scenario: Limpeza por retenção
- **WHEN** a limpeza de retenção roda
- **THEN** alertas de crise não resolvidos não são apagados

### Requirement: Configurações da família
O responsável SHALL configurar o rigor (estrito ou padrão), o modo Lição de Casa e o limite diário. A configuração SHALL ser persistida no banco e valer após reinício.

#### Scenario: Limite diário
- **WHEN** o responsável define limite diário de 20 perguntas
- **THEN** a 21ª pergunta do dia recebe a resposta padrão de limite de uso
