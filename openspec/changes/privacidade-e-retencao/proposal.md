## Why
LGPD (art. 14 e 33) e ECA Digital exigem consentimento, coleta mínima, transparência e direitos do titular. A retenção configurada no código antigo sumia a cada reinício (F5). Isto é obrigatório antes do beta com famílias de fora.

## What Changes
- Retenção de conversas configurável, com limpeza automática por família (B-02).
- Exportar dados e excluir conta pelo painel (B-02).
- Trilha de auditoria de quem viu, apagou ou exportou o quê.
- Segundo responsável na família, por convite (B-03).
- Revisão jurídica de termos, política de privacidade e ECA Digital (B-01), e declaração da transferência internacional para a IA.

## Capabilities
- New: `privacidade-e-retencao`

## Impact
`supabase` (`family_settings`, `audit_log`), `apps/api`, painel. Backlog: B-01 a B-03. Arquitetura: seção 4. A revisão jurídica não substitui advogado: o texto aqui orienta o produto.
