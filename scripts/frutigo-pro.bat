@echo off
setlocal EnableExtensions EnableDelayedExpansion
REM ============================================================
REM  FRUTI GO - Panel Profesional
REM  1) Actualizar (carpeta + GitHub) y compilar app Android/iOS
REM  2) Analisis de seguridad completo
REM  3) Descargar app Android (APK)
REM  4) Descargar app iOS (IPA)
REM ============================================================

REM Ir a la raiz del proyecto (este .bat vive en \scripts)
cd /d "%~dp0.."
set "ROOT=%CD%"
title FRUTI GO - Panel Pro

:menu
cls
echo ============================================================
echo                FRUTI GO - PANEL PROFESIONAL
echo ============================================================
echo.
echo   1. Actualizar  (guardar cambios + subir a GitHub + compilar app)
echo   2. Analisis de seguridad completo
echo   3. Descargar app version ANDROID (APK)
echo   4. Descargar app version iOS (IPA)
echo.
echo   0. Salir
echo ============================================================
set "op="
set /p "op=Elige una opcion (0-4): "

if "%op%"=="1" goto actualizar
if "%op%"=="2" goto seguridad
if "%op%"=="3" goto android
if "%op%"=="4" goto ios
if "%op%"=="0" exit /b 0
goto menu

REM ------------------------------------------------------------
:actualizar
cls
echo === 1) ACTUALIZAR ===========================================
echo.
echo [1/3] Guardando y subiendo cambios a GitHub...
cd /d "%ROOT%"
git add -A
git commit -m "update FRUTI GO %DATE% %TIME%"
if errorlevel 1 echo   (no habia cambios nuevos que confirmar)
git push
echo.
echo [2/3] Verificando la app...
set "BUILD="
set /p "BUILD=Compilar tambien los instaladores Android e iOS ahora? (S/N): "
if /I not "%BUILD%"=="S" goto :upd_done

call :ensure_eas
if errorlevel 1 goto :upd_done
cd /d "%ROOT%\apps\mobile"
echo.
echo    --- Compilando ANDROID (APK) en la nube de EAS ---
call npx eas-cli build -p android --profile preview
echo.
echo    --- Compilando iOS (IPA) en la nube de EAS ---
echo    (iOS requiere una cuenta de Apple Developer)
call npx eas-cli build -p ios --profile preview
cd /d "%ROOT%"

:upd_done
echo.
echo [3/3] Listo. Los enlaces de descarga aparecen arriba (y en expo.dev).
echo.
pause
goto menu

REM ------------------------------------------------------------
:seguridad
cls
echo === 2) ANALISIS DE SEGURIDAD ================================
echo.
echo [1/4] Vulnerabilidades en PRODUCCION (backend / API):
cd /d "%ROOT%\apps\api"
call npm audit --omit=dev
echo.
echo [2/4] Vulnerabilidades TOTALES del monorepo:
cd /d "%ROOT%"
call npm audit
echo.
echo [3/4] Pruebas del dominio (logica de negocio):
cd /d "%ROOT%\packages\shared"
call npm test
echo.
echo [4/4] Pruebas de integracion del API (auth, pagos, salud):
cd /d "%ROOT%\apps\api"
call npm run test:e2e
cd /d "%ROOT%"
echo.
echo ============================================================
echo  Resumen: revisa arriba las lineas "critical" y "high".
echo  Recuerda: solo las CRITICAS de produccion bloquean el CI.
echo  Para arreglos seguros:  npm audit fix   (sin --force)
echo ============================================================
pause
goto menu

REM ------------------------------------------------------------
:android
cls
echo === 3) DESCARGAR APP ANDROID (APK) =========================
echo.
echo Se compila en la nube de EAS y obtienes un enlace de descarga.
echo El APK se instala directo en cualquier telefono Android
echo (activa "Instalar apps de origen desconocido").
echo.
call :ensure_eas
if errorlevel 1 goto :and_done
cd /d "%ROOT%\apps\mobile"
call npx eas-cli build -p android --profile preview
cd /d "%ROOT%"
:and_done
echo.
echo Cuando termine, copia el enlace del APK y abrelo desde tu telefono,
echo o escanea el QR que muestra EAS. Tambien queda en https://expo.dev
echo.
pause
goto menu

REM ------------------------------------------------------------
:ios
cls
echo === 4) DESCARGAR APP iOS (IPA) =============================
echo.
echo IMPORTANTE: iOS exige una cuenta de Apple Developer (99 USD/ano)
echo para generar un IPA instalable. EAS te guiara con las credenciales.
echo La distribucion en iPhone se hace via TestFlight o Ad Hoc.
echo.
set "GO="
set /p "GO=Continuar con la compilacion iOS? (S/N): "
if /I not "%GO%"=="S" goto :ios_done
call :ensure_eas
if errorlevel 1 goto :ios_done
cd /d "%ROOT%\apps\mobile"
call npx eas-cli build -p ios --profile preview
cd /d "%ROOT%"
:ios_done
echo.
echo Cuando termine, sube el IPA a TestFlight o instalalo via Ad Hoc.
echo El build tambien queda en https://expo.dev
echo.
pause
goto menu

REM ------------------------------------------------------------
REM  Subrutina: asegura que EAS este disponible y con sesion.
:ensure_eas
where npx >nul 2>&1
if errorlevel 1 (
  echo   ERROR: No se encontro Node/npx. Instala Node 20+ desde nodejs.org
  pause
  exit /b 1
)
echo   Verificando sesion de Expo...
call npx eas-cli whoami >nul 2>&1
if errorlevel 1 (
  echo   No hay sesion de Expo. Necesitas una cuenta gratis en expo.dev
  echo   Iniciando login...
  call npx eas-cli login
  if errorlevel 1 (
    echo   No se pudo iniciar sesion. Cancela y reintenta.
    pause
    exit /b 1
  )
)
REM Asegura que el proyecto este vinculado a EAS (crea eas project si falta).
exit /b 0
