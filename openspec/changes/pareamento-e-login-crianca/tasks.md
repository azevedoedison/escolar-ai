## 1. Pareamento
- [ ] 1.1 Migração: código de pareamento (hash, validade, uso único) e campos de `device`
- [ ] 1.2 Rota para o responsável gerar código/QR para um filho
- [ ] 1.3 Rota do aparelho para trocar o código por token de dispositivo
- [ ] 1.4 Tela do responsável com o código e o QR; tela do aparelho para ler o código

## 2. Login da criança
- [ ] 2.1 Rota de login por PIN com token de curta duração
- [ ] 2.2 Contador de tentativas erradas persistido no banco (6 erros em 5 min bloqueiam)
- [ ] 2.3 Tela de PIN no app

## 3. Modo Responsável
- [ ] 3.1 Troca de modo exige a senha do responsável
- [ ] 3.2 Sessão do modo Responsável expira ao sair

## 4. Dispositivos
- [ ] 4.1 Lista de aparelhos pareados e botão "desconectar" (revoga token)
- [ ] 4.2 Testes de isolamento: aparelho de uma família nunca acessa outra
