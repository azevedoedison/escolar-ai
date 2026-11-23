## Why
As telas atuais do app web (cadastro, login, filho, pareamento, chat) não têm estilo, rótulos nem navegação entre si. Só dá para chegar nelas digitando o endereço, o que torna o app inavegável para testar. O legado (`legacy/src/web/public/index.html`) já tem uma identidade visual (tema escuro, roxo e rosa, fonte Poppins) que o Edison quer manter.

## What Changes
- Tema único em `apps/mobile` com as cores e a fonte do legado, usado como valores novos (nada de `legacy/` é importado nem editado).
- Componentes básicos: tela, cartão, título, campo com rótulo visível, botão, link, mensagem de erro.
- Rótulo fixo acima de cada campo de cadastro e login.
- Navegação: a home deixa de ser um esqueleto e passa a ter links para entrar, criar conta, cadastrar filho, parear aparelho, aparelhos e chat; as telas de autenticação ligam entre si e voltam para a home.
- Aplicação nas telas de cadastro e login primeiro; filho, pareamento, aparelhos e chat na segunda etapa.

## Capabilities
- New: `tema-e-navegacao`

## Impact
`apps/mobile` (tema, componentes, telas, layout raiz). Sem mudança em API, banco ou `packages/safety`. Relaciona-se a `identidade-da-tata` (tarefa 2.1, aplicar tema no app).
