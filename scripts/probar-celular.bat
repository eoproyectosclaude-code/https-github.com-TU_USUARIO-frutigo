@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title FRUTI GO - Probar en celular

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%.." >nul
set "ROOT=%CD%"

echo ============================================================
echo        FRUTI GO  -  Probar la app en tu celular
echo ============================================================
echo  1) Instala Expo Go en tu telefono (App Store / Play Store)
echo  2) Conecta el telefono y la PC a la MISMA red WiFi
echo  3) Escanea el codigo QR que aparecera al final
echo ------------------------------------------------------------

rem --- Detectar IP LAN ---
for /f "delims=" %%i in ('node "%SCRIPT_DIR%lan-ip.mjs"') do set "LANIP=%%i"
echo  IP LAN detectada: !LANIP!
set /p "NEWIP=Usar esta IP? Enter para aceptar, o escribe otra: "
if not "!NEWIP!"=="" set "LANIP=!NEWIP!"

rem --- Configurar apiBaseUrl para que el telefono alcance la API ---
node "%SCRIPT_DIR%set-api-url.mjs" "http://!LANIP!:3000"

rem --- Dependencias ---
if not exist "%ROOT%\node_modules" (
  echo  Instalando dependencias (npm install)...
  call npm install --prefix "%ROOT%"
)

echo.
echo  Modo de conexion:
echo    L) LAN (misma WiFi, mas rapido) [por defecto]
echo    T) Tunnel (si la WiFi bloquea, funciona por internet)
set /p "MODE=Elige L o T: "
set "EXPOFLAG=--lan"
if /i "!MODE!"=="T" set "EXPOFLAG=--tunnel"

rem --- Levantar la API en otra ventana ---
echo  Iniciando API en una ventana nueva (http://!LANIP!:3000)...
start "FRUTI GO API" cmd /k "cd /d "%ROOT%\apps\api" && npm run start:dev"

rem --- Levantar Expo (genera el QR) ---
echo  Iniciando Expo... escanea el QR con Expo Go.
pushd "%ROOT%\apps\mobile" >nul
call npx expo start !EXPOFLAG!
popd >nul

popd >nul
endlocal
