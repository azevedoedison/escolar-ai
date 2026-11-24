## Decisões
- A família nunca vem do cliente. A API passa só o id do responsável (já validado por `verify_guardian`) e o banco tira a família dele. Alvo de outra família responde 404, igual a alvo que não existe, para não revelar ids.
- A regra continua num lugar só. As funções internas (`_set_retention`, `_export_family`, `_delete_*`) recebem família e ator; o RPC antigo e o `api_*` chamam a mesma. Assinaturas do RPC não mudam e os testes antigos seguem valendo.
- O ator da auditoria é o id do login do responsável, o mesmo texto que o RPC grava, então a trilha fica uniforme.
- `api_*` e funções internas não têm grant para `authenticated`: só API e dono do banco executam.
- Exportação sai como download JSON (`content-disposition`), com `no-store` e `nosniff`. Não inclui hash de PIN nem dados de outra família.
- Excluir filho exige `{"confirm": true}` no corpo; no app, exige segundo toque. Excluir conversas também pede segundo toque.
- Retenção: faixa de 30 a 365 dias validada na API, no RPC e no banco (check). O app oferece 30, 60, 90, 180 e 365.
- Sem rota de exclusão da conta do responsável (ver proposta).
