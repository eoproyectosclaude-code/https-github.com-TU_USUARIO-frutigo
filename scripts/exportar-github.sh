#!/usr/bin/env bash
# Exporta el proyecto a GitHub de un comando. macOS / Linux.
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
S() { node "$SCRIPT_DIR/state.mjs" "$@"; }

command -v git >/dev/null || { echo "❌ Git no está instalado."; exit 1; }
S init >/dev/null 2>&1
[ -d "$ROOT/.git" ] || { git -C "$ROOT" init >/dev/null; git -C "$ROOT" branch -M main >/dev/null 2>&1; }

REPO="$(S get repo)"
[ -n "$REPO" ] || { read -rp "URL del repo: " REPO; S set repo "$REPO" >/dev/null; }
BRANCH="$(S get branch)"; [ -n "$BRANCH" ] || BRANCH=main

if ! S auth-url >/dev/null 2>&1; then
  read -rp "Usuario GitHub: " U; read -rsp "Token: " T; echo
  S secret-set githubUser "$U" >/dev/null
  S secret-set githubToken "$T" >/dev/null
fi

MSG="${1:-chore: exportacion FRUTI GO $(date '+%F %T')}"
git -C "$ROOT" add -A
if git -C "$ROOT" commit -m "$MSG" >/dev/null 2>&1; then echo "✅ Commit creado."; else echo "Sin cambios nuevos."; fi

URL="$(S auth-url)" || { echo "❌ No se pudo construir la URL con token."; exit 1; }
echo "Enviando a GitHub (rama $BRANCH)..."
git -C "$ROOT" push "$URL" "HEAD:$BRANCH" && echo "✅ Exportado a GitHub."
