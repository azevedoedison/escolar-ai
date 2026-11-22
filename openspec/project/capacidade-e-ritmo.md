# 07 · Capacidade, consumo e ritmo diário

**Data:** 21/11/2026 · Complementa [backlog.md](backlog.md) e [plano-de-testes.md](plano-de-testes.md).

## 1. O que ainda não sabemos

Os limites exatos do plano de R$ 110 não estão disponíveis para mim. Não vou inventar números. Para fechar esta seção, o Edison precisa confirmar:

1. **Tipo de limite:** cota por janela (ex.: uma janela de 5 horas e uma cota semanal) ou crédito em dólares por mês?
2. **Tamanho da janela ou cota** em tokens, mensagens ou sessões, e se ela é compartilhada entre o Claude Code na web, no terminal e no app.
3. **Modelo usado:** nesta thread o modelo foi trocado para Haiku 5.5. Modelos maiores gastam cota mais rápido, então o ritmo abaixo assume Haiku 5.5.

Enquanto isso, a seção 2 mede o consumo em **unidades relativas**, para ser convertida assim que os limites forem confirmados.

## 2. Consumo por tarefa (estimativa em unidades)

Uma **unidade** = uma sessão de trabalho de cerca de 30 minutos com leitura de arquivos, escrita de código e rodada de testes. Os valores são estimativas de ordem de grandeza.

| Tipo de tarefa | Unidades por item | Observação |
|---|---|---|
| Documento de planejamento (como os desta PR) | 0,5 | Maior parte é escrita, pouca leitura |
| Tarefa pequena de código (1 tela ou 1 rota, com teste) | 1 | Inclui tentativa e correção |
| Tarefa média (fluxo com banco e autenticação) | 2 a 3 | Mais leitura e rodadas de teste |
| Tarefa de segurança com teste de isolamento ou de avaliação | 2 | Vale a pena dar mais tempo |
| Rodada da suíte de avaliação (400 casos, modelo real) | 0,5 | Consumo de API à parte; o plano de assinatura não cobre a chamada à Anthropic |
| Revisão de PR com resposta a comentários | 0,5 | Depende do número de comentários |
| Migração ou refatoração em muitos arquivos | 4 a 6 | Quebrar em PRs menores reduz o risco |

Importante: a **suíte de avaliação da Tatá usa a API da Anthropic**, cobrada por token, e é separada da cota do plano de desenvolvimento. Esse custo está estimado no doc 03.

## 3. Ritmo diário sugerido

Supondo uma cota útil de **3 a 4 unidades por dia** no plano (valor a confirmar):

| Dia | O que cabe | Unidades |
|---|---|---|
| Dia útil comum | 1 tarefa média + 1 pequena | 3 a 4 |
| Dia de revisão | Responder PR, decisões e documentação | 1 a 2 |
| Dia de teste | Rodar suítes, corrigir falhas | 2 a 3 |

Com esse ritmo, a **fase 0 + M-01 a M-06** (contas, banco, isolamento) leva cerca de **8 a 10 dias úteis**. A fase 1 inteira (MVP, cerca de 60 unidades de trabalho) leva **cerca de 4 a 6 semanas**, em linha com o backlog.

## 4. Ordem de prioridade para caber no ritmo

Ordem pensada para entregar valor de segurança cedo, sem depender de tudo estar pronto:

1. **Confirmações e base:** F0-01 a F0-05 (aprovação, limpeza do repo, monorepo, CI, contas). ~6 unidades.
2. **Isolamento primeiro:** testes ISO-01 a ISO-10 escritos e falhando, depois a correção de autenticação (M-02 a M-05, M-06). ~8 unidades.
3. **Política e avaliação:** M-20 (política aprovada pelo Edison) e M-25 (suíte v1 de 300 casos, começando pelas escolares legítimas e pela crise). ~6 unidades.
4. **Chat seguro:** M-21 a M-24 e M-12, M-13 (pré-filtro, classificadores, respostas padrão, rota de chat). ~10 unidades.
5. **Painel dos pais:** M-30 a M-32 (linha do tempo, filtros, alertas de crise). ~6 unidades.
6. **Chat da criança:** M-10 e M-11 (tela de chat e lista de conversas). ~5 unidades.
7. **Entrega:** M-40 a M-43 (APK interno, web, guia para os pais, segurança básica). ~4 unidades.
8. **Configurações e extras do MVP:** M-33, M-34. ~2 unidades.

Total do MVP: **cerca de 47 unidades**, dentro da estimativa de 4 a 6 semanas.

**Regra de corte:** se a cota acabar antes da semana 4, a ordem acima mostra o que fica pronto. Itens 1 a 4 nunca são cortados, porque são o que torna o produto seguro. Itens 5 a 8 podem ir para o beta.

## 5. Perguntas de confirmação para o Edison

- Quais são os limites do plano de R$ 110 (janela, cota semanal ou crédito)?
- A cota é compartilhada com o uso do Claude Code no terminal e no app?
- Você aceita que a suíte de avaliação use a API paga da Anthropic, com um limite de gasto mensal (sugestão: US$ 20)?
