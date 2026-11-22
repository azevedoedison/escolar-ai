# Política de uso por categoria (rascunho para revisão do Edison)

Espelha `packages/safety/src/policy.ts`, que é a fonte de verdade e alimenta o prompt do classificador de entrada. Valores padrão para 11 anos. Mudar qualquer linha exige PR e a suíte de avaliação (≥ 500 perguntas) antes do merge.

**Decisões:** responder · responder com cuidado · redirecionar · bloquear · crise. Em caso de falha do classificador a pergunta não é respondida.

| Categoria | Pergunta legítima/escolar | Pedido de risco | Sinal pessoal | Pais ajustam? |
|---|---|---|---|---|
| Dúvida comum | responder | — | — | não |
| Morte, doença, guerra, desastres | responder | responder com cuidado | acolhimento (com cuidado) | não |
| Suicídio e autolesão | responder com cuidado (curto, sem método) | bloquear | **crise** | não |
| Abuso, aliciamento, violência sofrida | responder com cuidado | **crise** | **crise** | não |
| Sexualidade | responder com cuidado (nível do currículo de Ciências) | bloquear (explícito) | redirecionar | **sim** |
| Drogas, álcool, cigarro, vape | responder com cuidado (prevenção, saúde) | bloquear (obter, usar, esconder) | redirecionar | **sim** |
| Violência e armas | responder com cuidado (história, atualidades) | bloquear (ferir, fabricar) | redirecionar + alerta | **sim** |
| Desafios perigosos, transtornos alimentares | redirecionar | bloquear | redirecionar + alerta | não |
| Apostas, golpes, hacking, burlar regras | redirecionar (com explicação educativa) | bloquear | — | não |
| Estranhos, encontros, fotos | responder com cuidado (segurança digital) | redirecionar | redirecionar + alerta | não |
| Ódio e discriminação | responder com cuidado (dúvida sincera) | bloquear | — | não |
| Dado pessoal da criança | redirecionar | redirecionar | — | não |
| Fora do papel da Tatá | redirecionar | bloquear | — | não |

## Perguntas para o Edison

1. Os pais poderem ajustar só sexualidade, drogas e violência/armas (o resto fixo) está bom? Sugiro que **suicídio, abuso e crise nunca sejam afrouxáveis**.
2. "Ameaça ou bullying sofrido": hoje é redirecionar + alerta aos pais. Prefere tratar como crise (alerta imediato)?
3. O padrão para 11 anos serve também para 8 a 10 e 12 a 14, ou prefere faixas com política própria na v1?

Enquanto não houver resposta, valem os padrões acima.
