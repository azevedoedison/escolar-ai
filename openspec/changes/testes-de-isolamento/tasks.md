## 1. API
- [x] 1.1 Criança A não abre, não lista e não continua conversa da família B; nada é gravado (ISO-01, 02, 04)
- [x] 1.2 Token de responsável não usa o chat; token com família trocada, criança desativada e identidade no corpo são ignorados (ISO-05, 06, 07)
- [x] 1.3 Token expirado, adulterado ou de outro segredo retorna 401 em todas as rotas da criança (ISO-09)

## 2. Banco
- [x] 2.1 Funções RPC do responsável recusam ids de outra família sem efeito (pareamento, credenciais, Google, aparelho, conversas, auditoria, exclusão)
- [x] 2.2 Catálogo: lista fixa de funções executáveis, anon sem execução, colunas de hash e token ilegíveis

## 3. Pendências (fora desta change)
- [ ] 3.1 ISO-10: bloqueio de PIN persiste com reinício do processo (coberto no banco por `attempt_counter`; teste de reinício fica na change pareamento-e-login-crianca)
