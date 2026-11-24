## 1. Configuração
- [x] 1.1 Esquema Zod das variáveis de ambiente, falha no boot se faltar
- [x] 1.2 Teste ISO-08: servidor sobe sem `CHILD_TOKEN_SECRET` e falha imediatamente

## 2. HTTP
- [x] 2.1 CORS restrito a origens configuradas
- [x] 2.2 Cabeçalhos de segurança
- [ ] 2.3 Validação Zod em cada rota, com erro padronizado (pendente: as rotas validam à mão hoje; fica para uma change própria)
- [x] 2.4 Limite de corpo de 64 KB e erro interno genérico

## 3. Tokens e logs
- [x] 3.1 Teste ISO-09: token expirado ou com assinatura errada retorna 401
- [x] 3.2 Logger sem conteúdo de mensagem, com teste que falha se o texto aparecer
