# 🔐 SDD - Autenticação de Pais (PAI-001 a PAI-012)

## Visão Geral
Este módulo implementa o fluxo completo de autenticação para pais/tutores, incluindo registro, login, logout e validações de segurança.

## Casos de Uso - Alta Prioridade 🔴

### PAI-001: Registrar com dados válidos
**Descrição:** Usuário consegue criar conta com informações válidas
**Pré-condições:**
- Navegador aberto em localhost:3000
- Sistema limpo (sem conta existente)

**Fluxo:**
1. Usuário acessa página inicial
2. Clica em "Criar conta"
3. Preencha:
   - Nome: "João Silva"
   - Email: "joao@test.com" 
   - Senha: "Test@123456"
4. Clica em "Criar Conta"
5. Sistema valida campos
6. Cria usuário no banco
7. Redireciona para dashboard OU tela de login

**Pós-condições:**
- Conta criada com sucesso
- Usuário logado ou redirecionado para login
- Dados salvos no banco de dados

---

### PAI-002: Registrar com email já existente
**Descrição:** Sistema bloqueia registro com email duplicado
**Pré-condições:**
- Conta "joao@test.com" já existe
- Usuário tenta registrar com mesmo email

**Fluxo:**
1. Usuário preenche formulário de registro
2. Insere email "joao@test.com" (existente)
3. Preenche outros campos válidos
4. Clica em "Criar Conta"
5. Sistema valida email
6. Exibe erro: "Email já cadastrado"
7. Mantém formulário preenchido

**Pós-condições:**
- Conta não duplicada
- Mensagem de erro exibida
- Dados do usuário preservados no formulário

---

### PAI-004: Registrar com campos vazios
**Descrição:** Sistema valida campos obrigatórios
**Pré-condições:**
- Página de registro aberta

**Fluxo:**
1. Usuário deixa campos obrigatórios vazios
2. Clica em "Criar Conta"
3. Sistema valida cada campo
4. Exibe erros específicos:
   - Nome: "Nome é obrigatório"
   - Email: "Email é obrigatório"  
   - Senha: "Senha é obrigatória"
5. Não permite prosseguir

**Pós-condições:**
- Registro bloqueado
- Mensagens de erro visíveis
- Campos destacados em vermelho

---

### PAI-006: Login com credenciais válidas
**Descrição:** Usuário consegue acessar com dados corretos
**Pré-condições:**
- Conta "joao@test.com" existe
- Senha correta: "Test@123456"

**Fluxo:**
1. Usuário clica em "Entrar" (modo pai)
2. Insere email "joao@test.com"
3. Insere senha "Test@123456"
4. Clica em "Entrar"
5. Sistema valida credenciais
6. Cria sessão
7. Redireciona para dashboard

**Pós-condições:**
- Usuário autenticado
- Sessão ativa
- Dashboard acessível

---

### PAI-007: Login com senha incorreta
**Descrição:** Sistema bloqueia acesso com senha errada
**Pré-condições:**
- Conta "joao@test.com" existe
- Senha incorreta fornecida

**Fluxo:**
1. Usuário insere email correto
2. Insere senha incorreta
3. Clica em "Entrar"
4. Sistema valida senha
5. Exibe erro: "Senha incorreta"
6. Mantém email no campo

**Pós-condições:**
- Acesso bloqueado
- Mensagem de erro exibida
- Email preservado para correção

---

### PAI-008: Login com email inexistente
**Descrição:** Sistema trata email não cadastrado
**Pré-condições:**
- Email "naoexiste@test.com" não existe

**Fluxo:**
1. Usuário insere email inexistente
2. Insere qualquer senha
3. Clica em "Entrar"
4. Sistema valida email
5. Exibe erro genérico: "Email ou senha incorretos"
6. Não revela se email existe ou não

**Pós-condições:**
- Acesso bloqueado
- Mensagem ambígua exibida
- Proteção contra enumeração de emails

---

### PAI-010: Redirecionamento após login
**Descrição:** Usuário é redirecionado após autenticação
**Pré-condições:**
- Usuário não autenticado
- Tentando acessar URL protegida

**Fluxo:**
1. Usuário acessa URL direta (ex: /dashboard)
2. Sistema redireciona para login
3. Usuário faz login com sucesso
4. Sistema redireciona para URL original solicitada
5. Dashboard carrega normalmente

**Pós-condições:**
- Redirecionamento correto
- URL preservada na sessão
- Fluxo de navegação mantido

---

## Casos de Uso - Média Prioridade 🟡

### PAI-003: Registrar com senha fraca
**Descrição:** Sistema valida força da senha
**Pré-condições:**
- Página de registro aberta

**Fluxo:**
1. Usuário preencha formulário
2. Insere senha fraca: "123456"
3. Sistema valida complexidade
4. Exibe erros:
   - "Mínimo 8 caracteres"
   - "Letra maiúscula"
   - "Letra minúscula"  
   - "Número"
   - "Caractere especial"
5. Não permite registro

**Pós-condições:**
- Registro bloqueado
- Regras de senha exibidas
- Feedback visual para correção

---

### PAI-005: Registrar com email inválido
**Descrição:** Sistema valida formato de email
**Pré-condições:**
- Página de registro aberta

**Fluxo:**
1. Usuário insere email inválido: "email@"
2. Sistema valida formato
3. Exibe erro: "Email inválido"
4. Não permite prosseguir

**Pós-condições:**
- Registro bloqueado
- Formato email destacado

---

### PAI-009: Login com campos vazios
**Descrição:** Sistema valida campos de login
**Pré-condições:**
- Página de login aberta

**Fluxo:**
1. Usuário deixa campos vazios
2. Clica em "Entrar"
3. Sistema valida obrigatoriedade
4. Exibe erros:
   - "Email é obrigatório"
   - "Senha é obrigatória"
5. Não permite login

**Pós-condições:**
- Login bloqueado
- Mensagens de erro visíveis

---

### PAI-011: Logout limpa sessão
**Descrição:** Logout remove dados de autenticação
**Pré-condições:**
- Usuário logado no dashboard

**Fluxo:**
1. Usuário clica em "Sair"
2. Sistema invalida sessão
3. Remove token de autenticação
4. Limpa dados do usuário
5. Redireciona para página inicial
6. Dashboard fica inacessível sem login

**Pós-condições:**
- Sessão encerrada
- Token removido
- Redirecionamento para home

---

### PAI-012: Redirecionamento após logout
**Descrição:** Usuário é redirecionado após logout
**Pré-condições:**
- Usuário autenticado
- Acessando página protegida

**Fluxo:**
1. Usuário clica em "Sair"
2. Sistema executa logout
3. Redireciona para página inicial
4. URL atualizada para "/"
5. Botão de login visível

**Pós-condições:**
- Redirecionamento correto
- Página inicial acessível
- Estado anterior perdido

---

## Requisitos Técnicos

### Validações Client-side
- Formato de email em tempo real
- Força de senha com indicador visual
- Validação de campos obrigatórios

### Validações Server-side  
- Verificação de email único no banco
- Hash e comparação de senha
- Rate limiting para tentativas de login

### Segurança
- Senhas armazenadas com bcrypt
- Tokens JWT com expiração
- Proteção contra CSRF
- HTTPS obrigatório

### UX/UI
- Mensagens de erro claras
- Feedback visual para campos inválidos
- Loading states durante operações
- Redirecionamentos suaves

---

## Cenários de Falha Esperados

1. **Conexão perdida** durante registro/login
2. **Timeout** da API
3. **Banco de dados** offline
4. **Validação** inconsistente client/server
5. **Conflito** de sessões simultâneas

---

## Critérios de Aceite

✅ Todos os campos validados
✅ Mensagens de erro claras
✅ Proteção contra ataques comuns
✅ Experiência fluida para o usuário
✅ Dados persistentes corretos
✅ Redirecionamentos funcionais
✅ Tratamento de edge cases