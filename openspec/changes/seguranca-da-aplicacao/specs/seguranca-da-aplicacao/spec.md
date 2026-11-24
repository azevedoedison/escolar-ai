# Segurança da aplicação

## Purpose
Requisitos básicos de segurança da API: segredos, CORS, cabeçalhos, validação e logs.

## ADDED Requirements

### Requirement: Segredos obrigatórios
A API SHALL exigir `ANTHROPIC_API_KEY`, `DATABASE_URL` e `CHILD_TOKEN_SECRET` (mínimo de 32 caracteres) por variável de ambiente e SHALL NOT ter valor padrão para eles.

#### Scenario: Sem `CHILD_TOKEN_SECRET`
- **WHEN** o servidor inicia sem `CHILD_TOKEN_SECRET`
- **THEN** o processo encerra com erro antes de aceitar requisições

### Requirement: CORS restrito
A API SHALL aceitar requisições de navegador apenas das origens configuradas.

#### Scenario: Origem desconhecida
- **WHEN** uma página de origem não configurada chama a API
- **THEN** a resposta não inclui cabeçalhos CORS de permissão. Sem `CORS_ORIGINS`, nenhuma origem é aceita

### Requirement: Limite de corpo
A API SHALL recusar corpos acima de 64 KB com 413.

#### Scenario: Corpo grande
- **WHEN** a requisição traz corpo maior que o limite
- **THEN** a resposta é 413 e nada é gravado

### Requirement: Cabeçalhos de segurança
Toda resposta HTTP SHALL incluir cabeçalhos de segurança padrão, como `X-Content-Type-Options` e `Strict-Transport-Security` em produção.

#### Scenario: Resposta da API
- **WHEN** qualquer rota responde
- **THEN** os cabeçalhos estão presentes, inclusive em erros e rotas inexistentes

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
- **THEN** a resposta é 500 genérica e o log traz rota e tipo do erro, sem a mensagem do erro nem o texto da pergunta
