## 1. Banco
- [x] 1.1 Migração: `google_email`, `google_sub`, `set_child_google`, `child_login_google`
- [x] 1.2 Testes: vínculo, primeiro login grava `sub`, contador compartilhado, isolamento entre famílias

## 2. API
- [x] 2.1 Cliente OAuth do Google lido do ambiente (`google.ts`) e rotas `/child/google/config` e `/child/login/google`
- [x] 2.2 Testes com Google simulado e ponta a ponta com banco local

## 3. App
- [x] 3.1 Botão "Entrar com Google" na tela de entrada, oculto sem credenciais
- [x] 3.2 `setChildGoogle` para a tela do responsável

## 4. Pendente (fora desta change)
- [ ] 4.1 Cadastrar o cliente OAuth no Google Cloud e definir as variáveis no ambiente (Edison)
- [ ] 4.2 Campo "conta Google da criança" na tela do responsável (change `painel-pais`)
