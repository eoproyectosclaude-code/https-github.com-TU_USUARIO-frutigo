#!/usr/bin/env bash
# Equivalente del menú para macOS / Linux. En Windows usa frutigo.bat.
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE() { node "$SCRIPT_DIR/state.mjs" "$@"; }

node "$SCRIPT_DIR/state.mjs" init >/dev/null 2>&1

check_git() {
  command -v git >/dev/null || { echo "❌ Git no está instalado."; return 1; }
  [ -d "$ROOT/.git" ] || { echo "Inicializando git..."; git -C "$ROOT" init >/dev/null; git -C "$ROOT" branch -M main >/dev/null 2>&1; }
}

review() {
  echo "--- Revisión: deps, typecheck, lint ---"
  [ -d "$ROOT/node_modules" ] || npm install --prefix "$ROOT"
  npm run typecheck --prefix "$ROOT" || { read -rp "Typecheck con errores. ¿Continuar? (s/n): " a; [ "$a" = s ] || return 1; }
  npm run lint --prefix "$ROOT" 2>/dev/null || true
}

git_commit() {
  git -C "$ROOT" add -A
  if git -C "$ROOT" commit -m "chore: actualizacion automatica FRUTI GO ($(date '+%F %T'))" >/dev/null 2>&1; then
    h=$(git -C "$ROOT" rev-parse --short HEAD); STATE set lastCommit "$h" >/dev/null
    echo "✅ Commit creado ($h)."
  else echo "No había cambios para commitear."; fi
}

git_push() {
  local branch; branch="$(STATE get branch)"; [ -n "$branch" ] || branch=main
  local url; url="$(STATE auth-url 2>/dev/null)" || { echo "❌ Configura repo/token (opción 1)."; return 1; }
  git -C "$ROOT" push "$url" "HEAD:$branch" && echo "✅ Push completado."
}

menu() {
  clear
  echo "=========================================="
  echo "   FRUTI GO - Gestor de Actualizaciones"
  echo "   Último checkpoint: $(STATE get lastStep)"
  echo "------------------------------------------"
  echo " 1) Revisión + actualización TOTAL + GitHub"
  echo " 2) Revisión + actualización LOCAL (sin push)"
  echo " 3) Reanudar desde el último checkpoint"
  echo " 4) Configurar Google Custom Search en .env"
  echo " 5) Asignar rol ADMIN a un usuario"
  echo " 6) Ver estado (JSON)   0) Salir"
  echo "=========================================="
  read -rp "Opción: " opt
  case "$opt" in
    1) check_git || return; r="$(STATE get repo)"; [ -n "$r" ] || { read -rp "URL repo: " r; STATE set repo "$r" >/dev/null; }
       read -rp "Rama [main]: " b; [ -n "$b" ] && STATE set branch "$b" >/dev/null
       read -rp "Usuario GitHub: " u; read -rsp "Token: " t; echo
       STATE secret-set githubUser "$u" >/dev/null; STATE secret-set githubToken "$t" >/dev/null
       review && STATE set lastStep review >/dev/null && git_commit && STATE set lastStep commit >/dev/null && git_push && STATE set lastStep push >/dev/null ;;
    2) check_git || return; review && STATE set lastStep review >/dev/null; git -C "$ROOT" status --short
       read -rp "¿Commit local? (s/n): " c; [ "$c" = s ] && { git_commit; STATE set lastStep commit >/dev/null; } ;;
    3) check_git || return; ls="$(STATE get lastStep)"; echo "Último: ${ls:-ninguno}"
       case "$ls" in
         "") review && git_commit && STATE set lastStep commit >/dev/null ;;
         review) git_commit && STATE set lastStep commit >/dev/null && git_push && STATE set lastStep push >/dev/null ;;
         commit) git_push && STATE set lastStep push >/dev/null ;;
         push) review; git -C "$ROOT" status --short ;;
       esac ;;
    4) read -rp "GOOGLE_CSE_API_KEY: " k; read -rp "GOOGLE_CSE_CX: " x
       [ -n "$k" ] && node "$SCRIPT_DIR/set-env.mjs" GOOGLE_CSE_API_KEY "$k"
       [ -n "$x" ] && node "$SCRIPT_DIR/set-env.mjs" GOOGLE_CSE_CX "$x" ;;
    5) read -rp "Correo a promover: " m; ( cd "$ROOT/apps/api" && npm run make-admin -- "$m" ) ;;
    6) STATE dump ;;
    0) exit 0 ;;
  esac
  read -rp "Enter para continuar..." _
}

while true; do menu; done
