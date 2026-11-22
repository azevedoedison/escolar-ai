## 1. Pareamento
- [x] 1.1 Migração: código de pareamento (hash, validade, uso único) e campos de `device`
- [x] 1.2 Rota para o responsável gerar código/QR para um filho
- [x] 1.3 Rota do aparelho para trocar o código por token de dispositivo
- [x] 1.4 Tela do responsável com o código; tela do aparelho para digitar o código (QR fica para depois)

## 2. Login da criança
- [x] 2.1 Rota de login por PIN com token de curta duração
- [x] 2.2 Contador de tentativas erradas persistido no banco (6 erros em 5 min bloqueiam)
- [x] 2.3 Tela de PIN no app

## 3. Modo Responsável
- [x] 3.1 Troca de modo exige a senha do responsável
- [x] 3.2 Sessão do modo Responsável expira ao sair

## 4. Dispositivos
- [x] 4.1 Lista de aparelhos pareados e botão "desconectar" (revoga token)
- [x] 4.2 Testes de isolamento: aparelho de uma família nunca acessa outra

## 5. Acréscimo pedido pelo Edison
- [x] 5.1 Responsável define e-mail e senha da criança (`set_child_credentials`); a criança também pode entrar com e-mail e senha no aparelho pareado
