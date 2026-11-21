# 👦 SDD - Autenticação de Crianças (KID-001 a KID-005)

## Visão Geral
Este módulo implementa o fluxo de autenticação específico para crianças, com interface simplificada e validações adequadas ao público infantil.

## Casos de Uso - Alta Prioridade 🔴

### KID-001: Login com nickname e senha válidos
**Descrição:** Criança consegue acessar com suas credenciais
**Pré-condições:**
- Conta de criança "mariazinha" existe
- Senha correta: "Senha123"
- Filho está ativo no sistema

**Fluxo:**
1. Criança acessa página inicial
2. Sistema detecta modo criança (interface colorida)
3. Insere nickname "mariazinha"
4. Insere senha "Senha123"
5. Clica em "Entrar"
6. Sistema valida credenciais
7. Verifica status da conta (ativo)
8. Cria sessão infantil
9. Redireciona para dashboard infantil

**Pós-condições:**
- Criança autenticada com sucesso
- Sessão infantil ativa
- Dashboard infantil acessível
- Nickname exibido como "Olá, Maria!"

---

### KID-002: Login com senha incorreta
**Descrição:** Sistema bloqueia acesso com senha errada
**Pré-condições:**
- Conta de criança "mariazinha" existe
- Senha incorreta fornecida

**Fluxo:**
1. Criança insere nickname correto "mariazinha"
2. Insere senha incorreta "senhaerrada"
3. Clica em "Entrar"
4. Sistema valida senha
5. Exibe erro amigável: "Senha incorreta! Tente novamente."
6. Mantém nickname no campo
7. Limpa campo de senha
8. Contador de tentativas (opcional)

**Pós-condições:**
- Acesso bloqueado
- Mensagem de erro clara e motivacional
- Nickname preservado
- Campo de senha limpo

---

### KID-003: Login com nickname inexistente
**Descrição:** Sistema trata nickname não cadastrado
**Pré-condições:**
- Nickname "joaozinho" não existe no sistema

**Fluxo:**
1. Criança insere nickname inexistente "joaozinho"
2. Insere qualquer senha
3. Clica em "Entrar"
4. Sistema valida nickname
5. Exibe erro genérico: "Usuário não encontrado!"
6. Não revela se nickname existe ou não
7. Sugere tentar outro nickname

**Pós-condições:**
- Acesso bloqueado
- Mensagem motivacional exibida
- Proteção contra enumeração de usuários
- Interface amigável mantida

---

### KID-004: Login de filho desativado
**Descrição:** Sistema bloqueia acesso de conta inativa
**Pré-condições:**
- Conta de criança "mariazinha" existe
- Status da conta: desativada pelo pai
- Criança tenta fazer login

**Fluxo:**
1. Criança insere nickname "mariazinha" (desativado)
2. Insere senha correta
3. Clica em "Entrar"
4. Sistema valida status da conta
5. Detecta conta desativada
6. Exibe mensagem: "Sua conta está temporariamente indisponível. Por favor, entre em contato com seus pais."
7. Não revela detalhes do status
8. Oferece ajuda: "Precisa de ajuda?"

**Pós-condições:**
- Acesso bloqueado educadamente
- Mensagem de apoio exibida
- Proteção de privacidade mantida
- Canal de suporte oferecido

---

### KID-005: Modal de login abre no dashboard
**Descrição:** Interface de login acessível a partir do dashboard
**Pré-condições:**
- Criança não autenticada
- Dashboard acessível (pode ser público)

**Fluxo:**
1. Criança acessa URL do diretório (ex: /dashboard)
2. Sistema verifica autenticação
3. Redireciona para página de login
4. Interface de login infantil carrega
5. Campos de nickname e senha visíveis
6. Design colorido e amigável
7. Botão "Entrar" destacado
8. Link "Voltar para início" (opcional)

**Pós-condições:**
- Modal de login acessível
- Interface infantil carregada
- Navegação fluida
- Experiência positiva para criança

---

## Requisitos Técnicos

### Validações Client-side
- Formato de nickname (apenas letras, números, underline)
- Validação básica de senha (mínimo 6 caracteres)
- Campos obrigatórios em tempo real

### Validações Server-side
- Verificação de nickname existente
- Comparação de senha criptografada
- Verificação de status da conta (ativo/inativo)
- Rate limiting para tentativas de login

### Segurança
- Senhas infantis armazenadas com bcrypt
- Sessões específicas para crianças
- Tempo de sessão limitado (ex: 4 horas)
- Proteção contra tentativas brutas

### Design e UX
- Interface colorida e ilustrada
- Fontes grandes e legíveis
- Botões grandes e fáceis de clicar
- Feedback visual animado
- Linguagem simples e acolhedora
- Ícones intuitivos
- Cores vibrantes mas não ofensivas

---

## Cenários de Falha Esperados

1. **Conexão perdida** durante login
2. **Timeout** da resposta do servidor
3. **Banco de dados** temporariamente offline
4. **Sessão** expirada durante uso
5. **Dispositivo** com tela sensível ao toque imprecisa

---

## Critérios de Aceite

✅ Interface intuitiva para crianças
✅ Validações claras e amigáveis
✅ Proteção adequada para menores
✅ Experiência fluida e motivacional
✅ Redirecionamentos corretos
✅ Tratamento de erros positivo
✅ Acessibilidade em dispositivos móveis
✅ Design adequado ao público infantil