## ADDED Requirements

### Requirement: Cache de prompt
O prompt de sistema SHALL usar cache de prompt do provedor quando disponível.

#### Scenario: Segunda pergunta da sessão
- **WHEN** a criança envia outra pergunta
- **THEN** a parte fixa do prompt é lida do cache

### Requirement: Roteamento por complexidade
Perguntas classificadas como complexas SHALL ser enviadas ao Sonnet 5.5 somente se a configuração de roteamento estiver ativa.

#### Scenario: Roteamento desligado
- **WHEN** o roteamento está desligado
- **THEN** todas as perguntas usam o Haiku 5.5

### Requirement: Custo medido
O sistema SHALL registrar o custo de IA por família por mês.

#### Scenario: Fim do mês
- **WHEN** o mês termina
- **THEN** o custo por família está disponível para consulta interna
