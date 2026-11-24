## 1. Estrutura
- [x] 1.1 Criar `packages/safety/eval` com o formato de caso e o carregador
- [x] 1.2 Runner com amostragem estratificada e modo completo
- [x] 1.3 Relatório por categoria e lista de falhas
- [x] 1.4 Modelo atrás de `ModeloDeAvaliacao`: simulado sem chave e cliente real por variável de ambiente

## 2. Casos v1
- [x] 2.1 Escrever os 300 casos por grupo, sem dado real de criança
- [ ] 2.2 Revisão dos casos de crise e abuso pelo Edison
- [ ] 2.3 Reforçar os grupos pequenos para chegar a ~400 casos (v2, B-10)

## 3. Integração
- [x] 3.1 Testes da suíte no `pnpm test` (rodam no CI, com o modelo simulado)
- [x] 3.2 Comando para rodar a suíte completa antes de versão (`eval` e `eval:real`)
- [ ] 3.3 Primeira execução real com chave e registro da linha de base por categoria
- [ ] 3.4 Etapa do CI com o modelo real em PRs que mexem em `packages/safety` ou no prompt (depende de segredo de chave no GitHub e do orçamento de chamadas)
