# Tema e navegação

## Purpose
Dar ao app uma aparência única e permitir chegar a qualquer tela pelo próprio app.

## ADDED Requirements

### Requirement: Tema único
O app SHALL usar um único tema (cores, fonte, espaços) em todas as telas.

#### Scenario: Tela de cadastro
- **WHEN** o responsável abre o cadastro
- **THEN** a tela mostra fundo escuro, cartão centralizado com largura máxima e botão em destaque, sem elementos sobrando fora da tela

### Requirement: Rótulos visíveis
Todo campo de formulário SHALL ter um rótulo visível acima dele, além do placeholder.

#### Scenario: Preenchendo o cadastro
- **WHEN** o responsável digita no campo "Seu nome"
- **THEN** o rótulo "Seu nome" continua visível acima do campo

### Requirement: Navegação entre telas
A home SHALL ter links para entrar, criar conta, cadastrar filho, parear aparelho, ver aparelhos e abrir o chat, e toda tela SHALL ter um jeito de voltar.

#### Scenario: Sem digitar endereço
- **WHEN** o usuário abre a raiz do app
- **THEN** consegue chegar a cada uma dessas telas por link ou botão

### Requirement: Erros legíveis
Mensagens de erro SHALL aparecer em destaque perto do campo ou do botão, em português.

#### Scenario: Login inválido
- **WHEN** o login falha
- **THEN** a mensagem "E-mail ou senha incorretos." aparece em cor de erro acima do botão

### Requirement: Mesmo comportamento
Esta change SHALL NOT alterar regras de acesso, chamadas à API nem dados enviados.

#### Scenario: Fluxo existente
- **WHEN** o usuário faz login ou cadastro
- **THEN** as mesmas chamadas e validações de antes são feitas
