## 1. Política
- [x] 1.1 Escrever a política por categoria (`packages/safety/src/policy.ts` + `openspec/project/politica-por-categoria.md`); aguarda revisão do Edison
- [ ] 1.2 Ajustar rigor padrão para 11 anos e definir o que os pais podem mudar

## 2. Classificador de entrada
- [ ] 2.1 Definir o schema Zod da saída estruturada em `packages/shared`
- [x] 2.2 Implementar o classificador com cliente de modelo injetável e falha fechada
- [x] 2.3 Testes unitários com modelo falso: cada decisão, saída malformada, modelo indisponível

## 3. Registro
- [x] 3.1 (entrada e saída; pré-filtro já gravava) Gravar `safety_event` para cada camada (pré-filtro, entrada, saída)
- [x] 3.2 (política `safety_event_select` já existe e é testada em packages/db) Garantir RLS: responsável só lê eventos da própria família

## 4. Limite de uso
- [ ] 4.1 Mover o contador por minuto/dia do pré-filtro para o banco
