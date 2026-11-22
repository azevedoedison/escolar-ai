## 1. Configuração
- [ ] 1.1 Esquema Zod das variáveis de ambiente, falha no boot se faltar
- [ ] 1.2 Teste ISO-08: servidor sobe sem `JWT_SECRET` e falha imediatamente

## 2. HTTP
- [ ] 2.1 CORS restrito a origens configuradas
- [ ] 2.2 Cabeçalhos de segurança
- [ ] 2.3 Validação Zod em cada rota, com erro padronizado

## 3. Tokens e logs
- [ ] 3.1 Teste ISO-09: token expirado ou com assinatura errada retorna 401
- [ ] 3.2 Logger sem conteúdo de mensagem, com teste que falha se o texto aparecer
