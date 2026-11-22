# Chat da criança

## Purpose
Conversa da criança com a Tatá, com segurança em camadas e histórico no servidor.

## ADDED Requirements

### Requirement: Chat só para criança autenticada
A rota de chat SHALL aceitar apenas token de criança. Token de responsável ou requisição sem token SHALL ser rejeitada.

#### Scenario: Token de responsável
- **WHEN** um token de responsável chama o chat
- **THEN** a resposta é 401 e nada é gravado

#### Scenario: `childId` de outra família
- **WHEN** a requisição traz o `childId` de outra família sem token de criança válido
- **THEN** a resposta é 401 e nada é gravado

### Requirement: Histórico no servidor
O histórico da conversa SHALL vir do banco. O app SHALL enviar apenas a mensagem nova e o id da conversa.

#### Scenario: Histórico adulterado no app
- **WHEN** o app envia mensagens anteriores no corpo da requisição
- **THEN** o servidor ignora esse conteúdo e usa o histórico do banco

### Requirement: Segurança em todas as respostas
Toda mensagem da criança SHALL passar pelo pré-filtro e pelo classificador de entrada, e toda resposta gerada SHALL passar pelo classificador de saída antes de ser exibida.

#### Scenario: Resposta barrada na saída
- **WHEN** o classificador de saída bloqueia a resposta gerada
- **THEN** a criança vê a resposta padrão e a decisão é registrada em `safety_event`

### Requirement: Prompt montado no servidor
O prompt de sistema SHALL ser montado no servidor com idade, série, configurações da família e decisão do classificador de entrada. O app SHALL NOT enviar nem alterar o prompt.

#### Scenario: Criança de 8 anos
- **WHEN** a criança tem 8 anos
- **THEN** o prompt pede linguagem e profundidade adequadas a essa idade

### Requirement: Modo Lição de Casa
Quando o modo Lição de Casa estiver ativo, a Tatá SHALL guiar a criança com perguntas e explicações, sem entregar a resposta final pronta.

#### Scenario: Pergunta de exercício
- **WHEN** a criança cola uma questão de matemática com o modo ativo
- **THEN** a Tatá explica o método e faz perguntas, sem dar o resultado direto

### Requirement: Aviso de supervisão
A tela de chat SHALL informar à criança que os pais podem ver as conversas.

#### Scenario: Abertura do chat
- **WHEN** a criança abre o chat
- **THEN** o aviso "seus pais podem ver" está visível

### Requirement: Minhas perguntas
A criança SHALL ver a lista das próprias conversas e abrir qualquer uma. A criança SHALL NOT ver conversas de outro filho.

#### Scenario: Lista de conversas
- **WHEN** a criança abre "minhas perguntas"
- **THEN** vê apenas as conversas do próprio perfil, da mais recente para a mais antiga
