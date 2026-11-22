## Fluxo da rota `/chat`
1. Exige token de criança (token de responsável é rejeitado).
2. Pré-filtro, depois classificador de entrada.
3. Se a decisão permitir, monta o prompt de sistema no servidor e gera a resposta com Claude Haiku 5.5, esforço `medium`.
4. Classificador de saída confere a resposta inteira; só então ela é enviada ao app, que mostra com efeito de digitação.
5. Grava mensagens e `safety_event`.

## Decisões
- O histórico da conversa vem do banco. O app só envia a mensagem nova e o id da conversa.
- O prompt de sistema usa idade, série, configurações da família e a decisão do classificador. A personalidade da Tatá: calorosa, curiosa, português do Brasil, linguagem para a idade, admite incerteza, sugere fontes confiáveis.
- Modo Lição de Casa: a Tatá guia com perguntas e explicações em vez de entregar a resposta pronta. Os pais escolhem se é obrigatório (configuração em `painel-pais`).
- Streaming por trechos fica fora desta etapa (L-04).
