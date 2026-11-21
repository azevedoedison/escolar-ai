# 08 · Provedores de modelo: OpenRouter, DeepSeek, NVIDIA, Xiaomi MiMo ou Anthropic

**Data:** 21/11/2026 · Complementa [02-arquitetura.md](02-arquitetura.md) e [07-capacidade-e-ritmo.md](07-capacidade-e-ritmo.md).

## 1. O que foi verificado e o que não foi

A primeira versão deste documento foi escrita sem acesso às páginas dos provedores. Na segunda rodada, a pesquisa foi feita pelo navegador do Edison. Os números abaixo foram lidos nas páginas oficiais em 21/11/2026, salvo quando marcado.

| Dado | Fonte | Situação |
|---|---|---|
| Claude Haiku 5.5 na Anthropic: US$ 0,10 entrada / US$ 0,50 saída por milhão | Tabela de modelos (03/11/2026) | Verificado na data anterior |
| DeepSeek V4.1 Flash (preço direto): cache miss US$ 0,15 fora de pico, US$ 0,30 em pico; saída US$ 0,60 / US$ 1,20 | api-docs.deepseek.com/quick_start/pricing | Verificado |
| DeepSeek V4 Pro: entrada US$ 0,66 / US$ 1,32; saída US$ 1,98 / US$ 3,96 | Mesma página | Verificado |
| Política de privacidade da DeepSeek: dados armazenados na República Popular da China; uso para "treinar e melhorar a tecnologia"; serviço "não é direcionado a crianças" | cdn.deepseek.com (atualizada em 10/02/2026) | Verificado |
| GPT-6 Luna no OpenRouter: US$ 0,10 entrada / US$ 0,50 saída; cache read US$ 0,01; Azure e Bedrock no mesmo preço | openrouter.ai/openai/gpt-6-luna | Verificado |
| MiMo 2.6 Flash (API internacional): cache hit US$ 0,0028; cache miss US$ 0,14; saída US$ 0,28. MiMo 2.6 Pro: US$ 0,435 / US$ 0,87. Versão "ultraspeed": US$ 4,35 / US$ 8,70 | platform.xiaomimimo.com (atualizada em 18/11/2026) | Verificado |
| NVIDIA: 39 modelos com endpoint gratuito; limite de 40 requisições por minuto. Preço de produção não aparece nessa página | build.nvidia.com/models | Parcial: sem preço de produção e sem política de dados |
| Ranking de uso no OpenRouter (20/11/2026): DeepSeek V4.1 Flash 1017 em 1º (62,4 T tokens); GPT-6 Luna em 4º; MiMo 2.6 Flash em 8º; Nemotron 3 Ultra (gratuito, NVIDIA) em 9º | openrouter.ai/rankings | Verificado |
| Política de retenção e treino do OpenRouter e da Xiaomi | — | **Não verificado** |
| Ranking de custo por sessão de agente (gráfico enviado pelo Edison) | Imagem | Lido a olho; mede sessão de programação, não pergunta de criança |

## 2. Comparação de preço (US$ por milhão de tokens, entrada sem cache / saída)

| Modelo | Entrada | Saída | Observação |
|---|---|---|---|
| Claude Haiku 5.5 (Anthropic) | 0,10 | 0,50 | Referência atual do projeto |
| GPT-6 Luna (OpenRouter) | 0,10 | 0,50 | Mesmo preço do Haiku; não é mais barato |
| MiMo 2.6 Flash (Xiaomi) | 0,14 | 0,28 | Saída mais barata; entrada um pouco mais cara |
| DeepSeek V4.1 Flash (direto) | 0,15 (fora de pico) / 0,30 (pico) | 0,60 / 1,20 | Cache hit bem mais barato |
| NVIDIA | — | — | Endpoint gratuito para teste; produção sem preço verificado |

## 3. Os caminhos possíveis

| Caminho | Vantagem | Problema para dados de criança |
|---|---|---|
| **A. OpenRouter como intermediário** | Uma chave, vários modelos; troca fácil | Mais uma empresa no caminho dos dados; política depende do provedor final de cada rota |
| **B. DeepSeek direto** | Preço baixo, cache barato | Dados na China e uso para treino por padrão; a própria DeepSeek diz que o serviço não é para crianças |
| **C. NVIDIA** | Muitos modelos abertos; endpoint gratuito para teste | Produção sem preço verificado; política de dados não lida |
| **D. Xiaomi MiMo direto** | Saída mais barata entre os verificados | Política de dados não lida |
| **E. Anthropic (Haiku 5.5)** | Termos comerciais conhecidos; qualidade já medida no projeto | Custo por sessão longa, conforme o gráfico |

## 4. Quanto custa a Anthropic na prática

A intuição de que a Anthropic é cara vale para uso de programação, com sessões de dezenas de turnos. Para a Tatá, uma pergunta escolar usa poucos milhares de tokens. Com os preços do Haiku 5.5 e o uso típico do doc 03 (10 perguntas por dia), a estimativa é de **uns US$ 0,20 por criança por mês**. Essa conta usa a premissa do doc 03 e ainda não foi medida.

## 5. Decisão aberta (registrada a pedido do Edison, 21/11/2026)

- **Treino e retenção de dados por provedor ficam em aberto.** O Edison decidiu que, por enquanto, aceita treino com os dados e que o modelo pode mudar depois. Essa decisão não autoriza uso com mensagens reais de criança.
- **Antes de qualquer uso com mensagens reais de criança**, o Edison precisa decidir de forma explícita, sabendo que dados já enviados a um provedor que treina não voltam atrás.
- **Compliance e contrato de provedor** ficam para depois, com orçamento limitado. O foco agora é a funcionalidade.

## 6. Recomendação técnica

1. **Dados reais de criança:** só provedor com contrato de dados e sem treino com as mensagens. O defeito S6 da auditoria (dados para OpenRouter com modelo gratuito de terceiro) precisa ser corrigido antes do beta.
2. **Desenvolvimento e testes com dado sintético:** qualquer provedor barato serve, inclusive MiMo 2.6 Flash via OpenRouter ou direto.
3. **Próximo teste:** rodar a suíte de guardrails (doc 06, casos em português) com MiMo 2.6 Flash e Claude Haiku 5.5 como referência, medindo latência e acerto. Critérios: crise em 100%, bloqueio indevido ≤ 3%, latência p50 e p95, custo por caso.
4. **Para o app em produção:** manter o Haiku 5.5 como padrão até o teste mostrar que o MiMo acerta tanto quanto. Só então decidir o modelo, com a questão de dados resolvida.
