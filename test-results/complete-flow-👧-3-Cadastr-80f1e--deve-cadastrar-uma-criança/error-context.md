# Page snapshot

```yaml
- generic [ref=e1]:
  - navigation [ref=e2]:
    - heading "📚 Escolar AI" [level=1] [ref=e3]
  - generic [ref=e5]:
    - heading "Criar Conta" [level=2] [ref=e6]
    - paragraph [ref=e7]: Cadastre-se para usar o Escolar AI
    - generic [ref=e8]:
      - generic [ref=e9]: Nome completo
      - textbox "Seu nome" [ref=e10]: Pai Teste
    - generic [ref=e11]:
      - generic [ref=e12]: Email
      - textbox "seu@email.com" [ref=e13]: testepai1774399449677@email.com
    - generic [ref=e14]:
      - generic [ref=e15]: Telefone (opcional)
      - textbox "(41) 99999-9999" [ref=e16]
    - generic [ref=e17]:
      - generic [ref=e18]: Senha
      - textbox "Mínimo 6 caracteres" [active] [ref=e19]: Teste@123
      - generic [ref=e20]: Mínimo 6 caracteres
    - button "Criar Conta" [ref=e21] [cursor=pointer]
    - paragraph [ref=e22]:
      - text: Já tem conta?
      - link "Entrar" [ref=e23] [cursor=pointer]:
        - /url: "#"
```