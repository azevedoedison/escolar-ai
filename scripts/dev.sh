#!/usr/bin/env bash
# Sobe a API (porta 3000) e o app web (porta 8081) para testar no computador ou no celular.
# Segredos: só por variável de ambiente (nada é gravado em arquivo). Uso: veja docs/COMO-TESTAR.md
set -euo pipefail
cd "$(dirname "$0")/.."

faltando=()
for v in OPENROUTER_API_KEY DATABASE_URL CHILD_TOKEN_SECRET EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY; do
  [ -n "${!v:-}" ] || faltando+=("$v")
done
if [ "${#faltando[@]}" -gt 0 ]; then
  echo "Faltam variáveis de ambiente: ${faltando[*]}" >&2
  echo "CHILD_TOKEN_SECRET pode ser gerado com: export CHILD_TOKEN_SECRET=\$(openssl rand -hex 32)" >&2
  exit 1
fi

# Para abrir pelo celular na mesma rede, use SEU_IP=192.168.x.x ./scripts/dev.sh
host="${SEU_IP:-localhost}"
export EXPO_PUBLIC_API_URL="http://$host:3000"
export WEB_ORIGINS="${WEB_ORIGINS:-http://$host:8081,http://localhost:8081}"

pnpm install --frozen-lockfile
pnpm --filter @tata/api dev &
api_pid=$!
trap 'kill "$api_pid" 2>/dev/null || true' EXIT
pnpm --filter @tata/mobile exec expo start --web --port 8081
