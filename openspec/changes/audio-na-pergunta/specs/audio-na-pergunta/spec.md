# Áudio na pergunta

## Purpose
Permitir perguntar por voz sem guardar áudio.

## ADDED Requirements

### Requirement: Fala vira texto
O chat SHALL oferecer um botão de microfone que transforma a fala em texto na caixa de pergunta, editável antes do envio.

#### Scenario: Pergunta falada
- **WHEN** a criança toca no microfone e fala
- **THEN** o texto aparece na caixa de pergunta e só é enviado quando ela confirma

### Requirement: Sem armazenar áudio
O app e a API SHALL NOT enviar, gravar ou guardar arquivos de áudio da criança.

#### Scenario: Pergunta enviada
- **WHEN** a pergunta falada é enviada
- **THEN** a API recebe apenas o texto, que passa pelos mesmos filtros de uma pergunta digitada

### Requirement: Aparelho sem suporte
Quando o aparelho não reconhecer voz, o chat SHALL esconder o botão de microfone.

#### Scenario: Navegador sem reconhecimento
- **WHEN** o navegador não oferece reconhecimento de voz
- **THEN** o botão não aparece e o chat funciona por texto
