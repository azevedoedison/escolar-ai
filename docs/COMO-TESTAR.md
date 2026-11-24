# Como testar a Tatá IA (computador e celular)

## 1. Antes de subir
Precisa de cinco variáveis de ambiente (nunca em arquivo):

| Variável | Onde pegar |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase › Project Settings › API (a URL do projeto) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mesma tela, a chave publicável (`sb_publishable_...`) |
| `DATABASE_URL` | Supabase › Project Settings › Database › Connection string. As migrações de `supabase/migrations/` precisam estar aplicadas |
| `OPENROUTER_API_KEY` | openrouter.ai › Keys |
| `CHILD_TOKEN_SECRET` | Gere com `openssl rand -hex 32` |

Modelo de IA: `TATA_MODEL` (padrão `z-ai/glm-5.3-flash`). Dados reais de criança só depois de resolver a política de dados (`docs/tata-ia/08-provedores-de-modelo.md`).

## 2. Subir
No terminal, na raiz do repositório:

```bash
export EXPO_PUBLIC_SUPABASE_URL=...
export EXPO_PUBLIC_SUPABASE_ANON_KEY=...
export DATABASE_URL=...
export OPENROUTER_API_KEY=...
export CHILD_TOKEN_SECRET=$(openssl rand -hex 32)
./scripts/dev.sh
```

O script avisa o que faltar. Ele sobe a API em `http://localhost:3000` e o app em `http://localhost:8081`.

**No celular (mesma rede Wi-Fi):** descubra o IP do computador (`ipconfig getifaddr en0`) e rode `SEU_IP=192.168.x.x ./scripts/dev.sh`. Abra `http://192.168.x.x:8081` no navegador do celular.

## 3. Roteiro por tela
Use uma conta de teste, nunca dados reais de criança.

1. **Cadastro do responsável** (`/signup`): preencha nome, e-mail e senha de 8+ caracteres, ative o consentimento e toque em Criar conta. Se o Supabase pedir confirmação por e-mail, abra o link recebido.
2. **Login** (`/login`): entre com o e-mail e a senha. Com senha errada deve aparecer "E-mail ou senha incorretos."
3. **Cadastrar filho** (`/children/new`): apelido, ano de nascimento, avatar e PIN de 4 a 6 números.
4. **Meus filhos** (`/children`): o filho aparece na lista; toque em "Parear aparelho".
5. **Código de pareamento** (`/pairing/new`): aparece um código de 6 números que vale 10 minutos.
6. **Conectar aparelho** (`/pair`): no aparelho da criança, digite o código. Código errado ou usado mostra erro.
7. **Entrada da criança** (`/child-login`): entre com o PIN.
8. **Chat** (`/chat`): faça uma pergunta de biologia, depois uma de matemática com várias mensagens. O aviso "Seus pais podem ver as suas conversas" aparece no topo.
9. **Pergunta indevida**: pergunte algo sobre drogas ou machucar alguém; a Tatá deve recusar ou tratar como crise, conforme a política.
10. **Aparelhos** (`/devices`): veja o aparelho pareado e toque em "Desconectar".
11. **Excluir filho** (`/children`): toque em Excluir, digite `EXCLUIR`.
12. **Minha conta** (`/account`): com filho cadastrado, excluir conta deve ser recusado.
13. **Recuperar senha** (`/forgot`): e-mail inválido mostra erro; e-mail válido mostra "Pedido enviado".

## 4. Testes automáticos
Com o app rodando: `cd apps/mobile && pnpm exec playwright test` (precisa do `@playwright/test` instalado) roda `e2e/smoke.spec.ts`. A lista completa de fluxos e o estado de cada um está em `apps/mobile/e2e/ROTEIRO.md`.

Sem chave de IA: `pnpm --filter @tata/mobile e2e:build && pnpm --filter @tata/mobile e2e` roda os casos 4, 5 e 8 com um modelo simulado (precisa de Postgres local; veja `apps/mobile/e2e/ROTEIRO.md`).
