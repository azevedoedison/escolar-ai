## Why
O banco já tem `delete_child` e `delete_account` (change `privacidade-e-retencao`, tarefas 2.3), mas o app não tem tela para o responsável usá-las. Sem a tela, o direito de apagar os dados do filho e da conta (LGPD) não é exercível, e o roteiro e2e (passos 11 e 12) não roda.

## What Changes
- Tela `/children` com a lista de filhos e, para cada um, "Parear aparelho" e "Excluir filho(a)".
- Excluir filho pede confirmação escrita e chama `delete_child(p_child_id, true)`; só os dados daquele filho somem.
- Tela `/account` com "Excluir minha conta", que chama `delete_account(true)`; com filho cadastrado, o banco recusa (`children_linked`) e o app explica o motivo.
- Links na home.

## Capabilities
- New: `exclusao-no-app`

## Impact
`apps/mobile` (telas e `lib/children.ts`, `lib/account.ts`). Sem mudança de banco nem de API. Backlog: B-02 (parte do app).
