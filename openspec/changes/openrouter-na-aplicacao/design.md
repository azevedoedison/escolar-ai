## Decisões
- **Papéis separados.** Produção e buscas da aplicação: OpenRouter. Desenvolvimento: Anthropic (agentes e eventual suíte paga). O código de produção não lê `ANTHROPIC_API_KEY`.
- **Variáveis (só ambiente, nunca em arquivo):** `OPENROUTER_API_KEY` (obrigatória), `TATA_MODEL` (opcional), `OPENROUTER_ALLOW_REAL_DATA` (opcional, ver abaixo). O cliente anterior da Anthropic permanece no repositório para uso de desenvolvimento, sem ser ligado ao servidor.
- **Modelo padrão: `xiaomi/mimo-v2.6-flash`**, o único medido na suíte de guardrails (100 a 104 de 114 acertos; doc 08 §7), com a saída mais barata dos verificados (US$ 0,14 entrada, US$ 0,28 saída por milhão de tokens). Trocar é só mudar `TATA_MODEL`.
- **Lacuna de segurança conhecida.** O MiMo não atingiu "crise em 100%". Por isso, antes de qualquer criança real usar, as camadas determinísticas de crise (`packages/safety`) permanecem como estão, sem afrouxar, e a avaliação deve ser repetida com o modelo escolhido para o beta. Os limiares de AGENTS.md não mudam.
- **Dado de criança.** O Edison aceita treino com dados por ora, mas o doc 08 veta mensagem real de criança com provedor sem contrato de dados e sem treino. Esta change respeita os dois: a API envia a cada chamada `provider: { data_collection: "deny", zdr: true }` do OpenRouter (só rotas que não guardam nem treinam; a existência e o efeito desses parâmetros devem ser confirmados na documentação do OpenRouter antes de implementar) e **recusa subir em produção** com dado real a menos que `OPENROUTER_ALLOW_REAL_DATA=1` seja definido de propósito pelo Edison. Sem a trava, o servidor roda só em ambiente de desenvolvimento/teste.
- **Registro.** Os logs guardam provedor, modelo, latência e código de erro; nunca o texto da mensagem nem a chave.
- **Falha do provedor.** Erro ou resposta vazia vira mensagem de falha ao usuário, nunca resposta inventada; sem troca silenciosa de provedor.
- **Custo.** Teto de tokens de saída mantido (1024); o limite de uso por criança segue a change existente.

## Pendências para o Edison
1. Confirmar o modelo padrão (MiMo 2.6 Flash) ou escolher outro.
2. Confirmar a trava `OPENROUTER_ALLOW_REAL_DATA` e que ela só é ligada depois da questão de dados resolvida.
3. Autorizar a execução da suíte de guardrails com o modelo escolhido, se for diferente do MiMo.
