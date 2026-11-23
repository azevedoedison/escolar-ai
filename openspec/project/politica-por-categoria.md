# Política de uso por categoria (decidida pelo Edison em 22/11/2026)

Espelha `packages/safety/src/policy.ts`, que é a fonte de verdade e alimenta o prompt do classificador de entrada. Valores padrão para 11 anos, que valem para todas as faixas por enquanto. **Os pais não ajustam a política**: sexualidade, drogas e violência são definidas pelo próprio app. Mudar qualquer linha exige PR e a suíte de avaliação (≥ 500 perguntas) antes do merge.

**Decisões:** responder · responder com cuidado · redirecionar · bloquear · crise. Em caso de falha do classificador a pergunta não é respondida.

| Categoria | Pergunta legítima/escolar | Pedido de risco | Sinal pessoal |
|---|---|---|---|
| Dúvida comum | responder | — | — |
| Morte, doença, guerra, desastres | responder | responder com cuidado | acolhimento (com cuidado) |
| Suicídio e autolesão | responder com cuidado (curto, sem método) | bloquear | **crise** |
| Abuso, aliciamento, violência sofrida | responder com cuidado | **crise** | **crise** |
| Sexualidade | responder com cuidado (nível do currículo de Ciências) | bloquear (explícito) | redirecionar |
| Drogas, álcool, cigarro, vape | responder com cuidado (prevenção, saúde) | bloquear (obter, usar, esconder) | redirecionar |
| Violência e armas | responder com cuidado (história, atualidades) | bloquear (ferir, fabricar) | **crise** (ameaça ou bullying sofrido: alerta imediato aos pais) |
| Desafios perigosos, transtornos alimentares | redirecionar | bloquear | redirecionar + alerta |
| Apostas, golpes, hacking, burlar regras | redirecionar (com explicação educativa) | bloquear | — |
| Estranhos, encontros, fotos | responder com cuidado (segurança digital) | redirecionar | redirecionar + alerta |
| Ódio e discriminação | responder com cuidado (dúvida sincera) | bloquear | — |
| Dado pessoal da criança | redirecionar | redirecionar | — |
| Fora do papel da Tatá | redirecionar | bloquear | — |

## Decisões do Edison (22/11/2026)

1. Os pais não ajustam a política por categoria; ela é definida pelo app.
2. Ameaça ou bullying sofrido pela criança vira **crise** (acolhimento e alerta imediato aos pais).
3. O padrão de 11 anos vale para todas as faixas por enquanto.
