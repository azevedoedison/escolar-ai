# 📋 Proposal: Prompt Injection Defense

**Change ID:** prompt-injection-spec
**Data:** 2026-03-23
**Autor:** Robert
**Status:** PROPOSED → Pending Aprovação

---

## Resumo

Proteção completa contra prompt injection no Escolar AI, cobrindo 7 tipos de ataque identificados.

## Justificativa

- Usuários são crianças que testam limites
- System prompt define comportamento do tutor — se comprometido, resposta inadequada
- Risco legal se IA ensina conteúdo perigoso por injection
- Sem proteção, um ataque bem-sucedido destrói credibilidade do produto

## Escopo

| Incluído | Excluído |
|----------|----------|
| Detecção no input (6 camadas) | Proteção de modelo no nível API |
| System prompt protection | Criptografia de prompts |
| Logging e alertas | Anomaly detection com ML |
| 12h de implementação estimada | |
