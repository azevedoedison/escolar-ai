## Decisões
- Sessão opaca de 7 dias. Só o hash fica no banco e sair apaga a linha. É mais longa que a do modo Responsável (15 minutos) porque o responsável usa o próprio aparelho.
- Mesma proteção das outras entradas: 5 erros em 5 minutos bloqueiam por 15, contados por e-mail (existente ou não), então a resposta não revela quais e-mails têm conta.
- A senha é a da conta do cadastro (`auth.users`). Nenhuma senha nova.
- O login é registrado em `audit_log`.
- `verify_guardian` aceita a sessão do login direto e a do modo Responsável. O painel passa a chamar esta função.
- Sem login com Google para o responsável nesta change.
