## Decisões
- Usa `supabase.auth.resetPasswordForEmail`, sem API própria.
- Resposta igual para e-mail existente ou não (anti-enumeração), como o login do responsável.
- A mensagem de sucesso diz "pedido enviado", que no teste e2e aparece como estado pendente até o responsável abrir o e-mail.
- Limites de envio ficam nas configurações do Supabase (confirmar antes do beta).
- Nova senha pelo link do e-mail: fora do escopo; vira change própria.
