#!/usr/bin/env bash
# Prueba la app FRUTI GO en un celular (Expo Go). macOS / Linux.
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================="
echo "   FRUTI GO - Probar en tu celular"
echo "   1) Instala Expo Go en el telefono"
echo "   2) Telefono y PC en la MISMA WiFi"
echo "   3) Escanea el QR final"
echo "=========================================="

LANIP="$(node "$SCRIPT_DIR/lan-ip.mjs")"
echo "IP LAN detectada: $LANIP"
read -rp "Usar esta IP? Enter para aceptar u otra: " NEWIP
[ -n "$NEWIP" ] && LANIP="$NEWIP"

node "$SCRIPT_DIR/set-api-url.mjs" "http://$LANIP:3000"

[ -d "$ROOT/node_modules" ] || npm install --prefix "$ROOT"

read -rp "Conexion L)AN o T)unnel? [L]: " MODE
FLAG="--lan"; [ "${MODE^^}" = "T" ] && FLAG="--tunnel"

echo "Iniciando API en segundo plano (http://$LANIP:3000)..."
( cd "$ROOT/apps/api" && npm run start:dev ) &
API_PID=$!
trap 'kill $API_PID 2>/dev/null' EXIT

echo "Iniciando Expo... escanea el QR con Expo Go."
( cd "$ROOT/apps/mobile" && npx expo start $FLAG )
