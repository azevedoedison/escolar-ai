## Decisões
- A resposta é gerada em streaming e conferida em trechos. Se um trecho for barrado, o fluxo é cortado e a resposta padrão substitui o que já apareceu.
- O que a criança viu antes do corte deve ser mínimo; por isso o trecho inicial é conferido antes do primeiro envio.
- Meta de carga: p95 abaixo de 3 s para o início da resposta com 50 usuários simultâneos.
