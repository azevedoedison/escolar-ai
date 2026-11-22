## Decisões
- Código de pareamento: 6 dígitos, validade curta (10 minutos), uso único, gerado só por responsável autenticado.
- Sessão da criança: token de curta duração mais token de dispositivo revogável. Revogar o dispositivo derruba as sessões.
- PIN: já guardado só como hash (M-03). Tentativas erradas são contadas no banco, não em memória, para sobreviver a reinício (teste ISO-10 do plano de testes).
- Modo Responsável no aparelho da criança: exige a senha do responsável (biometria do responsável é opcional, fica para depois).

- Login alternativo: o responsável pode definir e-mail e senha da criança. Vale só em aparelho já pareado; usa o mesmo contador de tentativas do PIN.
- Modo Responsável: e-mail e senha de um responsável da mesma família, conferidos contra `auth.users`; 5 erros em 5 min bloqueiam por 15 min; sessão de 15 min, encerrada ao sair.
- Tokens e funções da API ficam fora do alcance do papel `authenticated`; falhas retornam status (não exceção) para o contador sobreviver ao commit.

## Limite conhecido
O app não impede a criança de abrir outro navegador ou outro chatbot. A mitigação é o Google Family Link / Tempo de Uso, descrita no guia para os pais (M-42).
