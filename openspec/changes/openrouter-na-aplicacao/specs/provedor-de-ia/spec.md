## MODIFIED Requirements

### Requirement: Provedor de produção
A API SHALL usar o OpenRouter como provedor do chat e das buscas da aplicação, com a chave lida só de `OPENROUTER_API_KEY` e o modelo de `TATA_MODEL` (padrão `xiaomi/mimo-v2.6-flash`). A API SHALL NOT usar a Anthropic em produção.

#### Scenario: Servidor sobe com a chave
- **WHEN** `OPENROUTER_API_KEY` está definida
- **THEN** o chat e as buscas chamam o OpenRouter com o modelo configurado

#### Scenario: Chave ausente
- **WHEN** `OPENROUTER_API_KEY` não está definida
- **THEN** o servidor falha ao iniciar com mensagem que nomeia a variável

### Requirement: Dado real de criança
A API SHALL enviar ao OpenRouter apenas rotas que não retêm nem treinam com as mensagens e SHALL recusar uso com dado real de criança, em produção, sem `OPENROUTER_ALLOW_REAL_DATA=1`.

#### Scenario: Produção sem a trava liberada
- **WHEN** o ambiente é de produção e a trava não está definida
- **THEN** o servidor não inicia

#### Scenario: Chamada ao modelo
- **WHEN** a API chama o OpenRouter
- **THEN** a requisição inclui a preferência de não coletar dados

### Requirement: Registro sem conteúdo
Os logs SHALL conter provedor, modelo, latência e código de erro, e SHALL NOT conter o texto das mensagens nem a chave.

#### Scenario: Erro do provedor
- **WHEN** o OpenRouter responde com erro
- **THEN** o log tem o status e o modelo, sem texto de mensagem

### Requirement: Falha sem invenção
Quando o provedor falhar ou devolver resposta vazia, a API SHALL informar falha ao usuário e SHALL NOT inventar resposta nem trocar de provedor em silêncio.

#### Scenario: Resposta vazia
- **WHEN** o modelo devolve texto vazio
- **THEN** a API responde com erro tratável e nada é mostrado como resposta da Tatá
