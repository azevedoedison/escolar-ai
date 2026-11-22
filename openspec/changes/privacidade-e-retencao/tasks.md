## 1. Retenção
- [x] 1.1 Configuração de retenção persistida (30 a 365 dias, padrão 90)
- [x] 1.2 Rotina de limpeza por família, com teste de que não toca outra família
- [x] 1.3 Preservar alertas de crise não resolvidos

## 2. Direitos do titular
- [x] 2.1 Exportar dados da família
- [x] 2.2 Apagar conversas
- [x] 2.3 Excluir conta do filho (só os dados dele) e do responsável (recusada com filhos; sem filhos apaga a família)
- [x] 2.4 Registrar em `audit_log` ver, apagar e exportar

## 3. Família
- [x] 3.1 Convite de segundo responsável por e-mail

## 4. Jurídico
- [ ] 4.1 Revisão jurídica de termos, política de privacidade e consentimento (B-01)
- [ ] 4.2 Declarar a transferência internacional na política de privacidade

## Notas de implementação (B-02, parte do banco)
- Migração `20261122120000_privacy_retention.sql`; funções chamadas por RPC pelo painel: `set_retention_days`, `export_family_data`, `delete_conversation`, `delete_child_conversations`, `delete_account`, `audit_view`. A rota HTTP e a tela do painel ficam com a thread do painel dos pais.
- A limpeza (`purge_expired_all`) roda de hora em hora na API (`apps/api/src/retention.ts`). Conta como "atividade" a última mensagem da conversa.
- Famílias já cadastradas mantêm a retenção atual, ajustada à faixa de 30 a 365; só as novas nascem com 90.
- Excluir filho (`delete_child`) apaga só os dados dele. Excluir responsável (`delete_account`) é recusada com `children_linked` enquanto houver filhos; sem filhos apaga família, configurações, alertas, auditoria e o login. Sobram só dados sem vínculo pessoal (escolas e contadores de tentativa por hash, que expiram). A API/painel deve traduzir `children_linked` em mensagem ("exclua primeiro as contas dos filhos"). Guardar registro mínimo da exclusão da família é decisão jurídica (4.1).

## Notas de implementação (B-03)
- Migração `20261122130000_guardian_invite.sql`; RPC: `create_guardian_invite(email)`, `list_guardian_invites()`, `revoke_guardian_invite(id)` (só o dono) e `accept_guardian_invite(token, nome, consentimento, versão)` (o convidado já logado, com o mesmo e-mail). O convidado entra como `member` na família do convite; o consentimento é registrado como no cadastro.
- O token (24 bytes aleatórios) só existe no e-mail; o banco guarda o hash SHA-256. Validade de 7 dias. Máximo de 2 responsáveis por família, contando convites pendentes. Códigos de erro para a API/painel traduzir: `invalid_email`, `already_guardian`, `invite_pending`, `family_full`, `owner_required`, `invite_invalid`, `invite_revoked`, `invite_used`, `invite_expired`, `already_registered`, `consent_required`.
- Envio: o convite entra na fila `email_outbox`; a API (`apps/api/src/mailer.ts`) entrega e apaga o token da fila. O envio é SIMULADO (imprime o link no console de desenvolvimento). Falta ligar um provedor real de e-mail e definir `INVITE_BASE_URL` (link do app) — fica para depois.
- A tela do painel (convidar, listar, revogar) e a tela de aceite ficam com a thread do painel dos pais; o `member` já vê os mesmos dados da família pelas políticas existentes.
- Em aberto: `delete_account` (só o dono) apaga também o login do segundo responsável quando a família não tem filhos. Decidir se exige removê-lo antes (4.1).
