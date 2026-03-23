# 📋 Proposal: Sistema de Guard Rails

## Resumo
Implementar sistema de proteção de 6 camadas que garante que crianças (6-14 anos) só recebem respostas sobre conteúdo escolar, bloqueando conteúdo inadequado e notificando pais.

## Contexto
- O Escolar AI usa WhatsApp para crianças fazerem perguntas escolares
- Sem proteção, LLMs podem responder conteúdo inadequado para menores
- LGPD e ECA Digital exigem proteção ativa de dados de crianças
- Controle parental é o diferencial competitivo do produto

## Problema
1. Crianças podem perguntar sobre conteúdo inadequado
2. LLM pode ser manipulado via prompt injection
3. Pais precisam saber o que filhos estão pesquisando
4. Sistema precisa ser resiliente a spam/abuso

## Mudanças Propostas

### O que MUDA
- Adicionar sistema de 6 camadas de proteção antes e após LLM
- Logging de todas as interações para auditoria
- Sistema de notificações para pais
- Rate limiting por usuário

### o que NÃO MUDA
- WhatsApp como canal principal
- OpenAI GPT-4o-mini como LLM
- Interface simples com emojis

## Impacto
- **Usuários:** Crianças protegidas, pais informados
- **Negócio:** Diferencial competitivo, compliance LGPD
- **Técnico:** +3 dependências (Redis, OpenAI Moderation, sanitize-html)

## Alternativas Consideradas

### Alternativa 1: Sem Guard Rails
- ❌ Risco legal (LGPD/ECA)
- ❌ Sem diferencial competitivo
- ❌ Exposição a conteúdo inadequado

### Alternativa 2: Apenas filtro de palavras
- ❌ Fácil de burlar
- ❌ Não detecta prompt injection
- ❌ Sem proteção de output

### Alternativa 3: Sistema completo (escolhido)
- ✅ 6 camadas de proteção
- ✅ Compliance LGPD
- ✅ Controle parental
- ✅ Diferencial competitivo

## Decisões Pendentes
1. **OpenAI Moderation vs Llama Guard:** Qual usar para classificação?
2. **Redis:** Self-hosted ou serviço gerenciado?
3. **Threshold de bloqueio:** 0.7 ou 0.8 de confiança?

## Critério de Sucesso
- [ ] 100% de conteúdo inadequado bloqueado (false negative < 1%)
- [ ] < 5% false positives (conteúdo permitido bloqueado)
- [ ] < 500ms tempo de processamento dos guard rails
- [ ] Notificação de pai em < 5 minutos após threshold

## Referências
- [OpenAI Moderation API](https://platform.openai.com/docs/guides/moderation)
- [NVIDIA NeMo Guardrails](https://developer.nvidia.com/nemo-guardrails)
- [Lei 15.211/2025 - ECA Digital](https://www.planalto.gov.br/ccivil_03/_ato2025-2028/2025/lei/l15211.htm)
