#!/usr/bin/env bash
# Wgrywa zmienne srodowiskowe z .env.local do projektu na Vercel.
#
# Wymaga: Vercel CLI (npm i -g vercel), zalogowania (vercel login)
#         oraz podlinkowanego projektu (vercel link) — uruchom je raz przed tym skryptem.
#
# Uzycie:   bash scripts/vercel-env.sh
#
# Skrypt NIE zawiera sekretow — czyta je z .env.local w czasie dzialania.
# NEXTAUTH_URL celowo pomijamy: na Vercel host jest wykrywany automatycznie
# (trustHost: true), a wpisanie localhost zepsuloby logowanie na produkcji.

set -euo pipefail

ENV_FILE=".env.local"
TARGETS=(production preview)

# Zmienne, ktore wgrywamy na Vercel (bez NEXTAUTH_URL).
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
  echo "Brak Vercel CLI. Zainstaluj: npm i -g vercel" >&2
  exit 1
}
[ -f "$ENV_FILE" ] || { echo "Brak $ENV_FILE" >&2; exit 1; }

# Bezpieczne wczytanie .env.local (wartosci moga zawierac & i =).
declare -A ENV
while IFS='=' read -r k v; do
  case "$k" in ''|\#*) continue;; esac
  ENV["$k"]="$v"
done < "$ENV_FILE"

for key in "${KEYS[@]}"; do
  val="${ENV[$key]:-}"
  if [ -z "$val" ]; then
    echo "POMIJAM $key — pusty w $ENV_FILE" >&2
    continue
  fi
  for target in "${TARGETS[@]}"; do
    # Usun istniejaca wartosc, by skrypt byl powtarzalny (ignoruj brak).
    vercel env rm "$key" "$target" -y >/dev/null 2>&1 || true
    printf '%s' "$val" | vercel env add "$key" "$target" >/dev/null
    echo "OK  $key -> $target"
  done
done

echo "Gotowe. Uruchom redeploy: vercel --prod"
