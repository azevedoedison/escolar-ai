## Decisões
- **Corte claro com o legado.** Reescrever rotas, autenticação e guardrails. Aproveitar como referência: modelo Pai → Filho → Conversa, testes de injection e format, padrões de prompt injection, política de privacidade.
- **Guardrail como camada de classificação** (Haiku 5.5), com palavras-chave só no pré-filtro.
- **Banco com RLS** (Supabase) em vez de filtro de dono em cada rota. Resolve S2 e S3 na raiz.
- **Front trocado por Expo.** O HTML antigo vai para `legacy/`.
- **Removidos da v1:** bot de WhatsApp, Android/Capacitor, RAG, Ollama, OpenRouter.

## Mapa dos defeitos para as specs
| Defeito | Onde é tratado |
|---|---|
| S1 chat sem login, S9 histórico do cliente | change `chat-crianca` |
| S2 e S3 isolamento entre famílias | spec `isolamento-familias` |
| S4 XSS no painel | change `painel-pais` e `seguranca-da-aplicacao` |
| S5 segredos padrão, S7 CORS, E10 logs com conteúdo | change `seguranca-da-aplicacao` |
| S6 provedor sem contrato | change `provedor-de-ia-com-contrato` |
| S8 limite de tentativas em memória | changes `pareamento-e-login-crianca` e `classificador-entrada-e-registro` |
| F3, F4 guardrail por palavra-chave, alerta aos pais | specs `guardrails-*` e change `painel-pais` |
| F5 retenção em memória | change `privacidade-e-retencao` |
