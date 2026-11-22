## 1. Política
- [ ] 1.1 Escrever a política por categoria (arquivo versionado) e submeter ao Edison para revisão
- [ ] 1.2 Ajustar rigor padrão para 11 anos e definir o que os pais podem mudar

## 2. Classificador de entrada
- [ ] 2.1 Definir o schema Zod da saída estruturada em `packages/shared`
- [ ] 2.2 Implementar o classificador com cliente de modelo injetável e falha fechada
- [ ] 2.3 Testes unitários com modelo falso: cada decisão, saída malformada, modelo indisponível

## 3. Registro
- [ ] 3.1 Gravar `safety_event` para cada camada (pré-filtro, entrada, saída)
- [ ] 3.2 Garantir RLS: responsável só lê eventos da própria família

## 4. Limite de uso
- [ ] 4.1 Mover o contador por minuto/dia do pré-filtro para o banco
