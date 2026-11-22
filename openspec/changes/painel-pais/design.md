## Decisões
- O painel lê apenas por rotas protegidas por RLS da família. Nenhuma rota recebe `childId` sem verificar o dono.
- Conteúdo de conversa é sempre renderizado como texto, nunca como HTML (defeito S4).
- Alertas: crise sempre; 3 bloqueios na mesma categoria em 24 horas; tentativas de burlar o filtro. Estado do alerta: novo, visto, resolvido.
- Eventos de crise ficam até os pais resolverem, mesmo com retenção menor.
- O botão "isso era para a escola" cria um item de revisão para os pais e, se aprovado, vira caso na suíte de avaliação.
- Resumo semanal gerado por IA com o mesmo modelo, usando só dados da própria família.
