@echo off
setlocal

set SERVER=mm@192.168.100.190
set GIT_BRANCH=main
set LOGFILE=deploy.log

if "%~1"=="" (
    set COMMIT_MSG=chore: deploy update
) else (
    set COMMIT_MSG=%~1
)

echo. > %LOGFILE%
echo VIRBOX DEPLOY - %DATE% %TIME% >> %LOGFILE%
echo.

echo ===================================================
echo   DESPLIEGUE VIRBOX  /  %SERVER%
echo   Log: %CD%\%LOGFILE%
echo ===================================================
echo.

REM ── 1. Git ───────────────────────────────────────────
echo [1/4] Git push...
git add -A >> %LOGFILE% 2>&1
git commit -m "%COMMIT_MSG%" >> %LOGFILE% 2>&1
git push origin %GIT_BRANCH% >> %LOGFILE% 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo FALLO en git push. Ver %LOGFILE%
    goto :error
)
echo       OK

REM ── 2. SCP ───────────────────────────────────────────
echo.
echo [2/4] Copiando script al servidor...
echo       (puede pedir contrasena SSH)
echo [2/4] SCP >> %LOGFILE%
scp deploy_server.sh %SERVER%:/tmp/vb.sh
echo ERRORLEVEL_SCP=%ERRORLEVEL% >> %LOGFILE%
if %ERRORLEVEL% NEQ 0 (
    echo FALLO en scp.
    echo Codigo de error: %ERRORLEVEL%
    goto :error
)
echo       OK

REM ── 3. SSH sed ───────────────────────────────────────
echo.
echo [3/4] Limpiando saltos de linea Windows...
echo [3/4] SSH sed >> %LOGFILE%
ssh %SERVER% "sed -i 's/\r//' /tmp/vb.sh"
echo ERRORLEVEL_SED=%ERRORLEVEL% >> %LOGFILE%

REM ── 3b. SSH bash ─────────────────────────────────────
echo.
echo [3/4] Ejecutando script en servidor...
echo       (puede pedir contrasena SSH)
echo [3b] SSH bash >> %LOGFILE%
ssh %SERVER% "bash /tmp/vb.sh" >> %LOGFILE% 2>&1
echo ERRORLEVEL_BASH=%ERRORLEVEL% >> %LOGFILE%
if %ERRORLEVEL% NEQ 0 (
    echo FALLO en el servidor. Abriendo log...
    goto :error
)
echo       OK

REM ── 4. PM2 ───────────────────────────────────────────
echo.
echo [4/4] Estado PM2...
ssh %SERVER% "pm2 list" >> %LOGFILE% 2>&1

echo.
echo ===================================================
echo   COMPLETADO - http://192.168.100.190:5001
echo ===================================================
echo COMPLETADO %TIME% >> %LOGFILE%
start notepad %LOGFILE%
goto :end

:error
echo.
echo ===================================================
echo   ERROR - Ver log para detalles
echo ===================================================
echo ERROR %TIME% >> %LOGFILE%
echo.
type %LOGFILE%
echo.
start notepad %LOGFILE%
pause
exit /b 1

:end
endlocal
pause
