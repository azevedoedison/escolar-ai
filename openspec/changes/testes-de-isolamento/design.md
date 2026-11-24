## Decisões
- Os testes da API usam o store real e um banco temporário, não a memória. Assim o filtro por dono (`child_id`) do SQL é o que está sob teste.
- Cada teste de recusa confere também que nada foi gravado, em nenhuma das duas famílias.
- Os testes foram validados por mutação: remover o filtro de dono em `ownsConversation` ou aceitar token de responsável no `/chat` derruba a suíte.
- A lista de funções executáveis por `authenticated` é fixa no teste de catálogo. Função nova obriga quem a criou a revisar o isolamento e atualizar a lista.
- Funções de extensões (pgcrypto no banco de teste) ficam fora do catálogo: no Supabase vivem no schema `extensions`.
