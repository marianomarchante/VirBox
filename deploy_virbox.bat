@echo off
REM ============================================================
REM  deploy_virbox.bat
REM  Despliega los cambios en el servidor VirBox
REM  Servidor: mm@192.168.100.190
REM  Uso: deploy_virbox.bat ["mensaje de commit opcional"]
REM ============================================================

setlocal enabledelayedexpansion

set SERVER=mm@192.168.100.190
set GIT_BRANCH=main

REM Mensaje de commit
if "%~1"=="" (
    set COMMIT_MSG=chore: deploy update
) else (
    set COMMIT_MSG=%~1
)

echo.
echo ============================================================
echo   DESPLIEGUE VIRBOX
echo   Rama: %GIT_BRANCH%   Servidor: %SERVER%
echo ============================================================
echo.

REM ── PASO 1: Commit y push ────────────────────────────────────
echo [1/4] Subiendo cambios a GitHub...
echo.

git add -A
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: git add fallo.
    goto :error
)

git commit -m "%COMMIT_MSG%"
if %ERRORLEVEL% NEQ 0 (
    echo AVISO: Nada nuevo que commitear, continuando...
)

git push origin %GIT_BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: git push fallo. Comprueba la conexion con GitHub.
    goto :error
)
echo     OK - Cambios en GitHub.

REM ── PASO 2: Copiar script al servidor ────────────────────────
REM  Se copia con scp para evitar el conflicto de stdin que
REM  ocurre con "ssh bash -s < script.sh" (SSH no puede leer
REM  la contrasena si stdin esta redirigido desde un fichero).
echo.
echo [2/4] Copiando script de despliegue al servidor...
echo       (Introduce la contrasena SSH cuando se pida)
echo.

scp deploy_server.sh %SERVER%:/tmp/virbox_deploy.sh
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudo copiar el script al servidor.
    echo        Comprueba que el servidor esta accesible.
    goto :error
)
echo     OK - Script copiado.

REM ── PASO 3: Ejecutar script en el servidor ───────────────────
echo.
echo [3/4] Ejecutando despliegue en el servidor...
echo       (Introduce la contrasena SSH cuando se pida)
echo.

ssh %SERVER% "bash /tmp/virbox_deploy.sh"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: El despliegue en el servidor fallo.
    echo        Conéctate manualmente para ver el error:
    echo          ssh %SERVER%
    echo          bash /tmp/virbox_deploy.sh
    goto :error
)

REM ── PASO 4: Estado PM2 ───────────────────────────────────────
echo.
echo [4/4] Estado de PM2...
ssh %SERVER% "command -v pm2 >/dev/null 2>&1 && pm2 list || echo '(pm2 no disponible)'"

echo.
echo ============================================================
echo   DESPLIEGUE COMPLETADO CON EXITO
echo ============================================================
echo.
echo   URL: http://192.168.100.190:5001
echo.
goto :end

:error
echo.
echo ============================================================
echo   ERROR EN EL DESPLIEGUE
echo ============================================================
echo   Revisa los mensajes anteriores para identificar el problema.
echo.
exit /b 1

:end
endlocal
pause
