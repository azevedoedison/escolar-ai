# 08 · Provedores de modelo: OpenRouter, DeepSeek, NVIDIA, Xiaomi MiMo ou Anthropic

**Data:** 21/11/2026 · Complementa [arquitetura.md](arquitetura.md) e [capacidade-e-ritmo.md](capacidade-e-ritmo.md).

## 1. O que foi verificado e o que não foi

Não foi possível abrir as páginas de preço nem de política de privacidade dos provedores a partir do ambiente de desenvolvimento: openrouter.ai, api-docs.deepseek.com, build.nvidia.com e mimo.mi.com estão bloqueados, e a busca devolveu só links. **Por isso, nenhum preço deste documento foi verificado nesta data.** Os números abaixo são de referência e precisam ser conferidos antes de qualquer decisão.

| Dado | Situação |
|---|---|
| Preço do Claude Haiku 5.5 na Anthropic (US$ 0,10 entrada / US$ 0,50 saída por milhão de tokens) | Verificado na tabela de modelos cacheada em 03/11/2026 |
| Ranking de custo por sessão de agente (gráfico enviado pelo Edison) | Lido a olho da imagem; mede sessão de programação, não pergunta de criança |
| Preços e política de retenção do DeepSeek, NVIDIA, Xiaomi e OpenRouter | **Não verificados** |

## 2. Os caminhos possíveis

| Caminho | Como funciona | Vantagem | Problema para dados de criança |
|---|---|---|---|
| **A. OpenRouter como intermediário** | Uma chave, vários modelos. O OpenRouter repassa a requisição a um provedor escolhido | Simples; troca de modelo sem mudar código; uma fatura | Mais uma empresa no caminho dos dados. A política de retenção depende do provedor final escolhido em cada rota, que pode variar |
| **B. DeepSeek direto** | API própria da DeepSeek | Em geral o preço por token mais baixo | Servidores e empresa na China. Transferência internacional (LGPD art. 33) e contrato de dados precisam ser avaliados por advogado antes de receber dados de menor |
| **C. NVIDIA (build.nvidia.com / NIM)** | Catálogo de modelos abertos com créditos de teste e API paga | Acesso a modelos abertos de vários fabricantes; créditos para desenvolvedor | Os créditos gratuitos são para teste. Confirmar se a política de uso permite produção e se os dados são usados para treino |
| **D. Xiaomi MiMo direto** | API da Xiaomi (modelos MiMo) | Mesma família do modelo que o código atual usa | Empresa e servidores na China; mesma análise de transferência internacional do item B |
| **E. Anthropic (Claude Haiku 5.5)** | API oficial, com termos comerciais de não treino | Termos de dados claros; qualidade já testada para este caso; 1 provedor | Custa mais por sessão longa, conforme o gráfico |

## 3. Quanto custa a Anthropic na prática (correção)

A intuição de que a Anthropic é cara vale para uso de programação, com sessões de dezenas de turnos e muito contexto. Para a Tatá, a conta é outra: uma pergunta escolar tem poucos milhares de tokens. Com os preços do Haiku 5.5 e o uso típico do doc 03 (10 perguntas por dia), a estimativa é de **uns US$ 0,20 por criança por mês**. Essa conta usa a premissa do doc 03 e ainda não foi medida. Ou seja, o custo de IA deve ficar pequeno mesmo sem trocar de provedor. Vale medir com a suíte de avaliação antes de descartar a opção mais segura.

## 4. Recomendação

1. **Dados reais de criança: só provedor com contrato de dados e sem treino com as mensagens.** Hoje o código manda as mensagens para o OpenRouter com um modelo gratuito de terceiro; isso é o defeito S6 da auditoria e precisa mudar antes do beta. Enquanto a análise jurídica não termina, não há provedor de baixo custo aprovado para dado real.
2. **Testes, suíte de avaliação e desenvolvimento com dado sintético:** qualquer provedor barato serve, inclusive o OpenRouter, desde que a entrada seja só dado sintético.
3. **Para o app em produção:** manter o Claude Haiku 5.5 como padrão até a suíte mostrar que um modelo mais barato acerta tanto em crise e em bloqueio. Só depois, comparar custo real.
4. **Pesquisa pendente (para o Edison ou para uma próxima rodada com acesso):** preço por milhão de tokens e política de dados de DeepSeek, NVIDIA, Xiaomi e OpenRouter, lidos nas páginas oficiais. Sem isso, qualquer comparação de custo é chute.

## 5. Como medir

Rodar a suíte de avaliação (doc 06, 400 casos) com três candidatos: Claude Haiku 5.5 (referência), um Flash barato via OpenRouter e um direto do fornecedor, se a política de dados permitir. Critérios: acerto por categoria, crise em 100%, bloqueio indevido ≤ 3%, custo por caso.
