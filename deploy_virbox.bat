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
echo [1/3] Preparando y subiendo cambios a GitHub...
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

REM ── PASO 2: Ejecutar script en el servidor via SSH stdin ─────
REM  Se usa "ssh ... bash -s < script.sh" para evitar cualquier
REM  problema de escape de caracteres especiales en Windows cmd.
echo.
echo [2/3] Ejecutando despliegue en el servidor...
echo       (Introduce la contrasena SSH cuando se pida)
echo.

ssh %SERVER% bash -s < deploy_server.sh
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: El despliegue en el servidor fallo.
    echo        Revisa la salida anterior para identificar el problema.
    echo.
    echo        Puedes conectarte manualmente y ejecutar:
    echo          ssh %SERVER%
    echo          cd /home/mm/VirBox
    echo          bash deploy_server.sh
    goto :error
)

REM ── PASO 3: Confirmacion ─────────────────────────────────────
echo.
echo [3/3] Verificando estado de PM2...
ssh %SERVER% bash -c "command -v pm2 &>/dev/null && pm2 list || echo '(pm2 no disponible)'"

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
