# Segurança da aplicação

## Purpose
Requisitos básicos de segurança da API: segredos, CORS, cabeçalhos, validação e logs.

## ADDED Requirements

### Requirement: Segredos obrigatórios
A API SHALL exigir todos os segredos por variável de ambiente e SHALL NOT ter valor padrão para eles.

#### Scenario: Sem `JWT_SECRET`
- **WHEN** o servidor inicia sem `JWT_SECRET`
- **THEN** o processo encerra com erro antes de aceitar requisições

### Requirement: CORS restrito
A API SHALL aceitar requisições de navegador apenas das origens configuradas.

#### Scenario: Origem desconhecida
- **WHEN** uma página de origem não configurada chama a API
- **THEN** a resposta não inclui cabeçalhos CORS de permissão

### Requirement: Cabeçalhos de segurança
Toda resposta HTTP SHALL incluir cabeçalhos de segurança padrão, como `X-Content-Type-Options` e `Strict-Transport-Security` em produção.

#### Scenario: Resposta da API
- **WHEN** qualquer rota responde
- **THEN** os cabeçalhos estão presentes

### Requirement: Validação de entrada
Toda rota SHALL validar corpo, parâmetros e consulta com Zod e SHALL recusar entrada inválida com erro 400.

#### Scenario: Corpo inválido
- **WHEN** a requisição traz campo com tipo errado
- **THEN** a resposta é 400 e nada é gravado

### Requirement: Tokens inválidos
Token expirado ou com assinatura inválida SHALL resultar em 401.

#### Scenario: Token adulterado
- **WHEN** a assinatura do token não confere
- **THEN** a resposta é 401

### Requirement: Logs sem conteúdo
Logs SHALL NOT conter o texto de perguntas ou respostas. Logs SHALL conter apenas ids, decisão, categoria e latência.

#### Scenario: Erro no chat
- **WHEN** ocorre erro ao processar uma pergunta
- **THEN** o log traz o id da conversa e o erro, sem o texto da pergunta
