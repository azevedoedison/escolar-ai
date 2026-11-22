## 1. Retenção
- [x] 1.1 Configuração de retenção persistida (30 a 365 dias, padrão 90)
- [x] 1.2 Rotina de limpeza por família, com teste de que não toca outra família
- [x] 1.3 Preservar alertas de crise não resolvidos

## 2. Direitos do titular
- [x] 2.1 Exportar dados da família
- [x] 2.2 Apagar conversas
- [x] 2.3 Excluir conta e todos os dados
- [x] 2.4 Registrar em `audit_log` ver, apagar e exportar

## 3. Família
- [ ] 3.1 Convite de segundo responsável por e-mail

## 4. Jurídico
- [ ] 4.1 Revisão jurídica de termos, política de privacidade e consentimento (B-01)
- [ ] 4.2 Declarar a transferência internacional na política de privacidade

## Notas de implementação (B-02, parte do banco)
- Migração `20261122120000_privacy_retention.sql`; funções chamadas por RPC pelo painel: `set_retention_days`, `export_family_data`, `delete_conversation`, `delete_child_conversations`, `delete_account`, `audit_view`. A rota HTTP e a tela do painel ficam com a thread do painel dos pais.
- A limpeza (`purge_expired_all`) roda de hora em hora na API (`apps/api/src/retention.ts`). Conta como "atividade" a última mensagem da conversa.
- Famílias já cadastradas mantêm a retenção atual, ajustada à faixa de 30 a 365; só as novas nascem com 90.
- Excluir conta apaga também a trilha de auditoria da família (ela é por família). Se a política exigir guardar um registro mínimo da exclusão, é decisão jurídica (4.1).
