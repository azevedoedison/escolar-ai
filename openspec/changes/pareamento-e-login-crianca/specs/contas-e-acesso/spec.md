## ADDED Requirements

### Requirement: Pareamento por código
O responsável SHALL poder gerar um código de 6 dígitos (ou QR) para um filho. O código SHALL expirar em 10 minutos e SHALL valer para um único uso. O aparelho que usar o código SHALL ficar vinculado àquele filho.

#### Scenario: Pareamento bem-sucedido
- **WHEN** o aparelho envia um código válido e não expirado
- **THEN** o aparelho é registrado em `device` para aquele filho e o código deixa de valer

#### Scenario: Código expirado ou já usado
- **WHEN** o aparelho envia um código expirado ou já usado
- **THEN** o pareamento é recusado

### Requirement: Login da criança por PIN
A criança SHALL entrar no aparelho pareado com o PIN, sem e-mail. A sessão SHALL usar token de curta duração.

#### Scenario: PIN correto
- **WHEN** a criança digita o PIN correto em um aparelho pareado e não revogado
- **THEN** a sessão da criança é aberta

#### Scenario: PIN errado repetido
- **WHEN** ocorrem 6 tentativas erradas de PIN em 5 minutos
- **THEN** o login é bloqueado por um período e o bloqueio persiste mesmo se o servidor reiniciar

### Requirement: Modo Responsável protegido
A troca para o modo Responsável em um aparelho de criança SHALL exigir a senha do responsável.

#### Scenario: Senha errada
- **WHEN** a criança tenta trocar para o modo Responsável sem a senha correta
- **THEN** a troca é recusada e nenhum dado do painel é carregado

### Requirement: Desconectar aparelho
O responsável SHALL poder ver os aparelhos pareados e desconectar qualquer um. Um aparelho desconectado SHALL perder o acesso imediatamente.

#### Scenario: Aparelho desconectado
- **WHEN** o responsável desconecta um aparelho
- **THEN** o token do aparelho é revogado (`revoked_at`) e as próximas chamadas dele retornam 401
