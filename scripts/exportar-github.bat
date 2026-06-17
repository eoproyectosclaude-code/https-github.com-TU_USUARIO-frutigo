@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title FRUTI GO - Exportar a GitHub

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%.." >nul
set "ROOT=%CD%"

echo ============================================================
echo            FRUTI GO  -  Exportar a GitHub
echo ============================================================

where git >nul 2>&1
if errorlevel 1 ( echo ❌ Git no esta instalado. & goto END )

node "%SCRIPT_DIR%state.mjs" init >nul 2>&1
if not exist "%ROOT%\.git" ( git -C "%ROOT%" init >nul & git -C "%ROOT%" branch -M main >nul 2>&1 )

rem --- Configurar repo si falta ---
for /f "delims=" %%i in ('node "%SCRIPT_DIR%state.mjs" get repo 2^>nul') do set "REPO=%%i"
if "!REPO!"=="" (
  set /p "REPO=URL del repo (https://github.com/usuario/repo.git): "
  node "%SCRIPT_DIR%state.mjs" set repo "!REPO!" >nul
)
for /f "delims=" %%i in ('node "%SCRIPT_DIR%state.mjs" get branch 2^>nul') do set "BRANCH=%%i"
if "!BRANCH!"=="" set "BRANCH=main"

rem --- Token (guardado en scripts\.secrets.json, ignorado por git) ---
node "%SCRIPT_DIR%state.mjs" auth-url >nul 2>&1
if errorlevel 1 (
  set /p "GHUSER=Usuario de GitHub: "
  set /p "GHTOKEN=GitHub Personal Access Token: "
  node "%SCRIPT_DIR%state.mjs" secret-set githubUser "!GHUSER!" >nul
  node "%SCRIPT_DIR%state.mjs" secret-set githubToken "!GHTOKEN!" >nul
)

rem --- Commit ---
set "MSG=%~1"
if "!MSG!"=="" set "MSG=chore: exportacion FRUTI GO %date% %time%"
git -C "%ROOT%" add -A
git -C "%ROOT%" commit -m "!MSG!" >nul 2>&1
if errorlevel 1 ( echo  No habia cambios nuevos para commitear. ) else ( echo ✅ Commit creado. )

rem --- Push con token ---
for /f "delims=" %%u in ('node "%SCRIPT_DIR%state.mjs" auth-url 2^>nul') do set "PUSHURL=%%u"
if "!PUSHURL!"=="" ( echo ❌ No se pudo construir la URL con token. & goto END )
echo  Enviando a GitHub (rama !BRANCH!)...
git -C "%ROOT%" push "!PUSHURL!" HEAD:!BRANCH!
if errorlevel 1 ( echo ❌ Push fallo. Revisa token/permisos/conflictos. ) else ( echo ✅ Exportado a GitHub. )

:END
echo.
pause
popd >nul
endlocal
