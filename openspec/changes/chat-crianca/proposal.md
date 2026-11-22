## Why
É a tela principal do produto: a filha do Edison precisa conversar com a Tatá no celular e no tablet. O histórico e a decisão de segurança têm de morar no servidor, nunca no app (defeito do código antigo).

## What Changes
- Tela de chat com mensagens, indicador de digitação, sugestões de perguntas e aviso "seus pais podem ver" (M-10).
- Lista de conversas da criança, "minhas perguntas" (M-11).
- Rota `/chat` autenticada, histórico vindo do banco, resposta com efeito de digitação (M-12).
- Prompt da Tatá por idade e série, e modo Lição de Casa (M-13).

## Capabilities
- New: `chat-crianca`

## Impact
`apps/mobile`, `apps/api`, `packages/safety` (prompt), `packages/shared`. Depende de `pareamento-e-login-crianca` e `classificador-entrada-e-registro`. Backlog: M-10 a M-13. Arquitetura: seções 3.3 (camada 2) e 3.6.
