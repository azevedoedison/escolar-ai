## Decisões
- Modelo: Claude Haiku 5.5, esforço `medium`, saída estruturada (decisão do Edison em 21/11/2026). O cliente de modelo é injetável, como no classificador de saída, para testar sem rede.
- Entrada do classificador: a mensagem atual e as últimas mensagens da conversa, para pegar escalada ao longo da conversa.
- Saída: `categoria`, `intencao` (escolar, curiosidade, pessoal, busca_de_dano, teste_de_limites), `sinal_de_risco` (nenhum, baixo, alto, crise) e `decisao` (responder, responder_com_cuidado, redirecionar, bloquear, crise).
- Falha fecha: se o modelo falhar, a pergunta não é respondida (mesma regra do classificador de saída).
- A tabela de política por categoria (arquitetura 3.3) é a fonte de verdade e vira arquivo versionado em `packages/safety`.
- `safety_event` guarda decisão, categoria, risco, modelo e latência; o conteúdo da mensagem fica em `message`, nunca em log.
