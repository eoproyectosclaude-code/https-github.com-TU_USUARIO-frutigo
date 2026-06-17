@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title FRUTI GO - Gestor de actualizaciones

rem === Rutas ===
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%.." >nul
set "ROOT=%CD%"
set "STATE=node "%SCRIPT_DIR%state.mjs""

rem Asegura el archivo de estado
node "%SCRIPT_DIR%state.mjs" init >nul 2>&1

:MENU
cls
echo ============================================================
echo            FRUTI GO  -  Gestor de Actualizaciones
echo ============================================================
echo  Proyecto: %ROOT%
for /f "delims=" %%i in ('node "%SCRIPT_DIR%state.mjs" get lastStep 2^>nul') do set "LAST_STEP=%%i"
for /f "delims=" %%i in ('node "%SCRIPT_DIR%state.mjs" get lastRunAt 2^>nul') do set "LAST_AT=%%i"
if "!LAST_STEP!"=="" (set "LAST_STEP=ninguno")
echo  Ultimo checkpoint: !LAST_STEP!   !LAST_AT!
echo ------------------------------------------------------------
echo   1. Revision + actualizacion TOTAL y subir a GitHub (token)
echo   2. Revision + actualizacion LOCAL (CMD, sin push)
echo   3. Reanudar desde el ULTIMO checkpoint (no rehacer todo)
echo   ----------------------------------------------------------
echo   4. Configurar Google Custom Search en .env (imagenes)
echo   5. Asignar rol ADMIN a un usuario
echo   6. Ver estado (JSON)
echo   0. Salir
echo ============================================================
set /p "OPT=Elige una opcion: "

if "%OPT%"=="1" goto OPT1
if "%OPT%"=="2" goto OPT2
if "%OPT%"=="3" goto OPT3
if "%OPT%"=="4" goto OPT4
if "%OPT%"=="5" goto OPT5
if "%OPT%"=="6" goto OPT6
if "%OPT%"=="0" goto END
goto MENU

rem ============================================================
rem  OPCION 1: revision + actualizacion total + push a GitHub
rem ============================================================
:OPT1
cls
echo === 1) Revision y actualizacion TOTAL + GitHub ===
call :CHECK_GIT || goto PAUSE_MENU

rem --- Configurar repo/token si faltan ---
for /f "delims=" %%i in ('node "%SCRIPT_DIR%state.mjs" get repo 2^>nul') do set "REPO=%%i"
if "!REPO!"=="" (
  set /p "REPO=URL del repo (https://github.com/usuario/repo.git): "
  node "%SCRIPT_DIR%state.mjs" set repo "!REPO!" >nul
)
for /f "delims=" %%i in ('node "%SCRIPT_DIR%state.mjs" get branch 2^>nul') do set "BRANCH=%%i"
if "!BRANCH!"=="" set "BRANCH=main"
set /p "NEWBRANCH=Rama [!BRANCH!]: "
if not "!NEWBRANCH!"=="" set "BRANCH=!NEWBRANCH!"
node "%SCRIPT_DIR%state.mjs" set branch "!BRANCH!" >nul

set /p "GHUSER=Usuario de GitHub: "
echo  (El token NO se mostrara; se guarda en scripts\.secrets.json, ignorado por git)
set /p "GHTOKEN=GitHub Personal Access Token: "
node "%SCRIPT_DIR%state.mjs" secret-set githubUser "!GHUSER!" >nul
node "%SCRIPT_DIR%state.mjs" secret-set githubToken "!GHTOKEN!" >nul

call :REVIEW || goto PAUSE_MENU
node "%SCRIPT_DIR%state.mjs" set lastStep "review" >nul

call :GIT_COMMIT
node "%SCRIPT_DIR%state.mjs" set lastStep "commit" >nul

call :GIT_PUSH || goto PAUSE_MENU
node "%SCRIPT_DIR%state.mjs" set lastStep "push" >nul
echo.
echo ✅ Actualizacion total completada y enviada a GitHub.
goto PAUSE_MENU

rem ============================================================
rem  OPCION 2: revision + actualizacion local (sin push)
rem ============================================================
:OPT2
cls
echo === 2) Revision y actualizacion LOCAL (CMD) ===
call :CHECK_GIT || goto PAUSE_MENU
call :REVIEW || goto PAUSE_MENU
node "%SCRIPT_DIR%state.mjs" set lastStep "review" >nul
echo.
echo --- git status ---
git -C "%ROOT%" status --short
echo.
set /p "DOCOMMIT=Crear commit local con los cambios? (s/n): "
if /i "!DOCOMMIT!"=="s" (
  call :GIT_COMMIT
  node "%SCRIPT_DIR%state.mjs" set lastStep "commit" >nul
  echo ✅ Commit local creado (sin enviar a GitHub).
) else (
  echo  Revision completada. No se hizo commit.
)
goto PAUSE_MENU

rem ============================================================
rem  OPCION 3: reanudar desde el ultimo checkpoint
rem ============================================================
:OPT3
cls
echo === 3) Reanudar desde el ULTIMO checkpoint ===
for /f "delims=" %%i in ('node "%SCRIPT_DIR%state.mjs" get lastStep 2^>nul') do set "LAST_STEP=%%i"
echo  Ultimo paso completado: "!LAST_STEP!"
call :CHECK_GIT || goto PAUSE_MENU

if "!LAST_STEP!"=="" (
  echo  No hay checkpoint previo. Ejecutando proceso completo local...
  call :REVIEW || goto PAUSE_MENU
  call :GIT_COMMIT
  node "%SCRIPT_DIR%state.mjs" set lastStep "commit" >nul
  echo  Hecho. Usa la opcion 1 si quieres subir a GitHub.
  goto PAUSE_MENU
)
if "!LAST_STEP!"=="review" (
  echo  Continuando desde: commit ^> push
  call :GIT_COMMIT
  node "%SCRIPT_DIR%state.mjs" set lastStep "commit" >nul
  call :GIT_PUSH && node "%SCRIPT_DIR%state.mjs" set lastStep "push" >nul
  goto PAUSE_MENU
)
if "!LAST_STEP!"=="commit" (
  echo  Continuando desde: push
  call :GIT_PUSH && node "%SCRIPT_DIR%state.mjs" set lastStep "push" >nul
  goto PAUSE_MENU
)
if "!LAST_STEP!"=="push" (
  echo  Todo estaba al dia. Revisando cambios nuevos...
  call :REVIEW
  git -C "%ROOT%" status --short
)
goto PAUSE_MENU

rem ============================================================
rem  OPCION 4: configurar Google Custom Search en .env
rem ============================================================
:OPT4
cls
echo === 4) Configurar Google Custom Search (imagenes reales) ===
echo  Guia detallada: scripts\GOOGLE_SETUP.md
echo.
set /p "CSE_KEY=GOOGLE_CSE_API_KEY: "
set /p "CSE_CX=GOOGLE_CSE_CX (ID del buscador): "
if not "!CSE_KEY!"=="" node "%SCRIPT_DIR%set-env.mjs" GOOGLE_CSE_API_KEY "!CSE_KEY!"
if not "!CSE_CX!"=="" node "%SCRIPT_DIR%set-env.mjs" GOOGLE_CSE_CX "!CSE_CX!"
echo  Listo. Reinicia la API para aplicar los cambios.
goto PAUSE_MENU

rem ============================================================
rem  OPCION 5: asignar rol ADMIN
rem ============================================================
:OPT5
cls
echo === 5) Asignar rol ADMIN a un usuario ===
set /p "ADMINMAIL=Correo del usuario a promover: "
if "!ADMINMAIL!"=="" goto PAUSE_MENU
pushd "%ROOT%\apps\api" >nul
call npm run make-admin -- "!ADMINMAIL!"
popd >nul
goto PAUSE_MENU

:OPT6
cls
echo === Estado actual (JSON) ===
node "%SCRIPT_DIR%state.mjs" dump
goto PAUSE_MENU

rem ============================================================
rem  Subrutinas
rem ============================================================
:CHECK_GIT
where git >nul 2>&1
if errorlevel 1 (
  echo ❌ Git no esta instalado o no esta en PATH. Instala Git para Windows.
  exit /b 1
)
if not exist "%ROOT%\.git" (
  echo  Inicializando repositorio git...
  git -C "%ROOT%" init >nul
  git -C "%ROOT%" branch -M main >nul 2>&1
)
exit /b 0

:REVIEW
echo  --- Revision: dependencias, typecheck y lint ---
if not exist "%ROOT%\node_modules" (
  echo  Instalando dependencias (npm install)...
  call npm install --prefix "%ROOT%"
)
echo  Typecheck...
call npm run typecheck --prefix "%ROOT%"
if errorlevel 1 (
  echo ⚠️  Typecheck reporto errores. Revisa antes de continuar.
  set /p "IGN=Continuar de todas formas? (s/n): "
  if /i not "!IGN!"=="s" exit /b 1
)
echo  Lint...
call npm run lint --prefix "%ROOT%" 2>nul
exit /b 0

:GIT_COMMIT
for /f "tokens=1-5 delims=/: " %%a in ("%date% %time%") do set "STAMP=%date% %time%"
git -C "%ROOT%" add -A
git -C "%ROOT%" commit -m "chore: actualizacion automatica FRUTI GO (%STAMP%)" >nul 2>&1
if errorlevel 1 (
  echo  No habia cambios para commitear.
) else (
  for /f "delims=" %%h in ('git -C "%ROOT%" rev-parse --short HEAD') do node "%SCRIPT_DIR%state.mjs" set lastCommit "%%h" >nul
  echo ✅ Commit creado.
)
exit /b 0

:GIT_PUSH
for /f "delims=" %%i in ('node "%SCRIPT_DIR%state.mjs" get branch 2^>nul') do set "BRANCH=%%i"
if "!BRANCH!"=="" set "BRANCH=main"
for /f "delims=" %%u in ('node "%SCRIPT_DIR%state.mjs" auth-url 2^>nul') do set "PUSHURL=%%u"
if "!PUSHURL!"=="" (
  echo ❌ No hay token/repo configurado. Usa la opcion 1 primero.
  exit /b 1
)
echo  Enviando a GitHub (rama !BRANCH!)...
git -C "%ROOT%" push "!PUSHURL!" HEAD:!BRANCH!
if errorlevel 1 (
  echo ❌ Push fallo. Revisa token, permisos del repo o conflictos.
  exit /b 1
)
echo ✅ Push completado.
exit /b 0

:PAUSE_MENU
echo.
pause
goto MENU

:END
popd >nul
echo Hasta luego.
endlocal
