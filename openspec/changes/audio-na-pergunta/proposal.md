## Why
O Edison quer que a criança possa perguntar por áudio (roteiro e2e, passo 6). Voz de criança é dado pessoal sensível e hoje não há nenhuma entrada de áudio no app nem rota na API.

## What Changes
- Botão de microfone no chat que transforma a fala em texto e preenche a pergunta, que passa pelos mesmos filtros do texto.
- Nenhum áudio é gravado, enviado ou guardado: só o texto resultante entra no histórico.

## Capabilities
- New: `audio-na-pergunta`

## Impact
`apps/mobile` (chat). Pode exigir dependência nova de reconhecimento de voz, que depende de aprovação. Relaciona-se a `chat-crianca` e a `privacidade-e-retencao`.
