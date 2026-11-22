# Isolamento entre famílias

## Purpose
Garantir que os dados de uma família nunca sejam lidos nem alterados por outra. A regra vale no banco (Row Level Security do Postgres), não só na API. Implementado em M-01 e M-06.

## Requirements

### Requirement: RLS em todas as tabelas de dados
Toda tabela com dados de família (`family`, `guardian`, `child`, `device`, `family_settings`, `conversation`, `message`, `safety_event`, `alert`, `audit_log`) SHALL ter Row Level Security ativo.

#### Scenario: Tabela nova sem RLS
- **WHEN** uma migração cria tabela com dados de família sem habilitar RLS
- **THEN** a revisão do PR SHALL recusar a migração

### Requirement: Responsável só enxerga a própria família
Um responsável autenticado SHALL ler e alterar apenas linhas ligadas à própria `family`.

#### Scenario: Leitura de filho de outra família
- **WHEN** o responsável A consulta um filho do responsável B
- **THEN** a consulta não retorna a linha

#### Scenario: Alteração de dados de outra família
- **WHEN** o responsável A tenta atualizar ou apagar um filho, aparelho ou configuração da família B
- **THEN** nenhuma linha é afetada

### Requirement: Testes de isolamento rodam em CI
O repositório SHALL manter testes automatizados de isolamento (`packages/db/test/isolation.test.ts` e `rls.test.ts`) que falham se a regra for quebrada.

#### Scenario: Regressão de RLS
- **WHEN** uma mudança permite que o responsável A leia dados da família B
- **THEN** a suíte de isolamento falha e o CI bloqueia o merge
