## 1. API
- [x] 1.1 Rota `/chat` autenticada só por token de criança
- [x] 1.2 Montagem do prompt da Tatá por idade, série e configurações
- [x] 1.3 Pipeline: pré-filtro, entrada, geração, saída, gravação
- [x] 1.4 Modo Lição de Casa no prompt
- [x] 1.5 Testes de integração: token de pai é rejeitado, `childId` de outra família não grava nada

## 2. App
- [ ] 2.1 Tela de chat para celular e tablet, com aviso "seus pais podem ver"
- [ ] 2.2 Sugestões de perguntas
- [ ] 2.3 Efeito de digitação
- [ ] 2.4 Lista "minhas perguntas" com conversas anteriores

> Notas da etapa da API: o token de criança é verificado em `apps/api/src/auth.ts`, mas quem o emite é a change `pareamento-e-login-crianca` (ainda não implementada). O classificador de entrada mínimo (`packages/safety/src/input-classifier.ts`) foi criado aqui para o pipeline não ficar sem a camada; a política por categoria continua na change `classificador-entrada-e-registro` (tarefas 1.x e 4.1 seguem abertas). A rota `/chat` aceita `ANTHROPIC_API_KEY`, `DATABASE_URL`, `CHILD_TOKEN_SECRET` e `TATA_MODEL` só pelo ambiente.
