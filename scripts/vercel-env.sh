#!/usr/bin/env bash
# Uploads environment variables from .env.local to the project on Vercel.
#
# Requires: Vercel CLI (npm i -g vercel), being logged in (vercel login)
#           and a linked project (vercel link) — run them once before this script.
#
# Usage:   bash scripts/vercel-env.sh
#
# The script does NOT contain secrets — it reads them from .env.local at runtime.
# NEXTAUTH_URL is deliberately skipped: on Vercel the host is detected automatically
# (trustHost: true), and entering localhost would break login in production.

set -euo pipefail

ENV_FILE=".env.local"
TARGETS=(production preview)

# Variables we upload to Vercel (without NEXTAUTH_URL).
KEYS=(
  GITHUB_CLIENT_ID
  GITHUB_CLIENT_SECRET
  NEXTAUTH_SECRET
  OPENAI_API_KEY
  DATABASE_URL
  DIRECT_URL
  CRON_SECRET
)

command -v vercel >/dev/null 2>&1 || {
  echo "Vercel CLI not found. Install: npm i -g vercel" >&2
  exit 1
}
[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE" >&2; exit 1; }

# Safe loading of .env.local (values may contain & and =).
declare -A ENV
while IFS='=' read -r k v; do
  case "$k" in ''|\#*) continue;; esac
  ENV["$k"]="$v"
done < "$ENV_FILE"

for key in "${KEYS[@]}"; do
  val="${ENV[$key]:-}"
  if [ -z "$val" ]; then
    echo "SKIPPING $key — empty in $ENV_FILE" >&2
    continue
  fi
  for target in "${TARGETS[@]}"; do
    # Remove the existing value so the script is repeatable (ignore if absent).
    vercel env rm "$key" "$target" -y >/dev/null 2>&1 || true
    printf '%s' "$val" | vercel env add "$key" "$target" >/dev/null
    echo "OK  $key -> $target"
  done
done

echo "Done. Run a redeploy: vercel --prod"
