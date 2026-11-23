## Decisões
- Tema como módulo único `apps/mobile/lib/theme.ts` (cores, espaços, raios, fonte). Cores iniciais tiradas do legado: fundo `#0d0d12`, cartão `#1a1a23`, roxo `#8b5cf6`, rosa `#ec4899`, ciano `#06b6d4`, texto `#f8fafc`, texto suave `#94a3b8`, erro `#ef4444`, sucesso `#10b981`. Fonte Poppins via `expo-font` (dependência já do ecossistema Expo; se não houver, usa a fonte do sistema e avisa antes de adicionar).
- Sem biblioteca de UI nova: só `StyleSheet` do React Native. Nenhuma dependência nova sem aprovação.
- Largura máxima de 440 px, centralizada, para não estourar no navegador; no celular ocupa a tela.
- Contraste de texto mínimo AA sobre o fundo escuro; área de toque de pelo menos 44 px.
- Privacidade: a tela do chat mantém o aviso de que os pais veem as conversas, agora em destaque.
- Sem anúncios nem elementos de marketing (ver `identidade-da-tata`).
- Navegação por Expo Router já existente; sem mudar rotas nem regras de acesso nesta change.
- Testes: lint e typecheck; teste de renderização dos componentes se houver ambiente de teste no app; checagem visual manual no web em 390 px e 1280 px.
