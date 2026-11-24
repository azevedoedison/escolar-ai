## ADDED Requirements

### Requirement: A API recusa dados de outra família
As rotas da criança SHALL usar apenas a identidade do token e SHALL responder 404 a qualquer conversa que não seja da criança, sem gravar nada.

#### Scenario: Conversa de outra família
- **WHEN** a criança A abre ou continua a conversa da criança B
- **THEN** a resposta é 404, o conteúdo de B não aparece e nenhuma mensagem é gravada

#### Scenario: Identidade no corpo
- **WHEN** o corpo do chat traz `childId` ou `familyId` de outra família
- **THEN** os campos são ignorados e a mensagem pertence à criança do token

#### Scenario: Papel errado
- **WHEN** um token de responsável chama `/chat` ou `/conversations`
- **THEN** a resposta é 401

### Requirement: Funções do responsável recusam ids de outra família
Toda função de banco executável por `authenticated` que receba id de filho, aparelho ou conversa SHALL recusar o id de outra família, sem alterar dados.

#### Scenario: Revogar aparelho de outra família
- **WHEN** o responsável A chama `revoke_device` com um aparelho da família B
- **THEN** a função falha e o aparelho de B continua ativo

### Requirement: Superfície de funções revisada
A lista de funções de `public` executáveis por usuários finais SHALL ser fixa e revisada. Anon SHALL NOT executar nenhuma. Colunas de hash e token SHALL NOT ser legíveis por `authenticated`.

#### Scenario: Função nova
- **WHEN** uma migração cria função executável por `authenticated`
- **THEN** o teste de catálogo falha até a função ser revisada e listada
