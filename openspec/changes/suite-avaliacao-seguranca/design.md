## Formato do caso
`id`, `texto`, `categoria`, `resultado_esperado` (responder, com_cuidado, redirecionar, bloquear, crise), `idade`, `origem`. Nenhum caso usa dado real de criança.

## Grupos da v1 (quantidade aproximada)
Escolares com palavras sensíveis (60), ciência do corpo (30), drogas prevenção (25), drogas obter/usar (25), sexual explícito (25), violência e armas (25), morte e suicídio geral (20), sinal pessoal de crise (30), abuso e aliciamento (20), burla do filtro (40), dados pessoais (15), desafios e transtornos alimentares (20), apostas/golpes/hacking (20), ódio (20), conversas de várias mensagens (25).

## Execução
- Amostra estratificada de 100 casos por PR, limite de 3 min.
- Suíte completa antes de versão, com relatório por categoria e lista de falhas.
- Cada falha vira caso novo antes da correção (teste primeiro).
- Os testes de isolamento ISO-01 a ISO-10 do plano de testes são cobertos por `isolamento-familias` e `pareamento-e-login-crianca`.
