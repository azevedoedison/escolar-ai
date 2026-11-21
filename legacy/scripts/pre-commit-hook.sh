#!/bin/bash
# Pre-commit hook: impede commit de chaves de API, secrets e tokens

echo "🔍 Verificando commits..."

# Padrões perigosos
PATTERNS=(
    "sk-[a-zA-Z0-9]"
    "sk-or-v1-[a-zA-Z0-9]"
    "ghp_[a-zA-Z0-9]"
    "OPENAI_API_KEY"
    "OPENROUTER_API_KEY"
    "WHATSAPP_API_KEY"
    "DATABASE_URL"
    "password=.*@"
)

STASHED=$(git stash -q --include-untracked)

if git diff --cached --name-only -r | while read file; do
    for pattern in "${PATTERNS[@]}"; do
        if grep -Eq "$pattern" "$file" 2>/dev/null; then
            echo "🚨 BLOQUEADO: $file contém algo sensível (pattern: $pattern)"
            git stash pop -q 2>/dev/null
            exit 1
        fi
    done
done; then
    git stash pop -q 2>/dev/null
    echo "✅ Commit liberado!"
    exit 0
else
    git stash pop -q 2>/dev/null
    echo "❌ Commit bloqueado. Remove secrets antes de commitar."
    exit 1
fi
