## Decisões
- As funções do banco já validam o responsável dono da família; o app só chama o RPC com o login do responsável (nunca chave de serviço).
- Confirmação em duas etapas: o botão abre o aviso e só habilita "Excluir de vez" depois de digitar a palavra `EXCLUIR`. A ação não tem desfazer.
- Mensagens: `children_linked` vira "Exclua primeiro as contas dos filhos."; `confirmation_required` e outros erros viram "Não foi possível excluir. Tente de novo."
- Depois de excluir a conta, o app desloga e volta para a home.
- Registro de auditoria já é feito pelas funções do banco.
