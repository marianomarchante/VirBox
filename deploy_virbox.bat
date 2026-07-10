@echo off
setlocal

set SERVER=mm@192.168.100.190
set GIT_BRANCH=main
set LOGFILE=%~dp0deploy.log

if "%~1"=="" (
    set COMMIT_MSG=chore: deploy update
) else (
    set COMMIT_MSG=%~1
)

REM Iniciar log
echo. > "%LOGFILE%"
echo DESPLIEGUE VIRBOX - %DATE% %TIME% >> "%LOGFILE%"
echo Servidor: %SERVER% >> "%LOGFILE%"
echo. >> "%LOGFILE%"

echo.
echo ===================================================
echo   DESPLIEGUE VIRBOX  /  %SERVER%
echo   Log: %LOGFILE%
echo ===================================================
echo.

REM ── 1. Git ───────────────────────────────────────────
echo [1/4] Subiendo cambios a GitHub...
echo [1/4] Git >> "%LOGFILE%"

git add -A >> "%LOGFILE%" 2>&1
git commit -m "%COMMIT_MSG%" >> "%LOGFILE%" 2>&1

git push origin %GIT_BRANCH% >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: git push fallo. Ver detalles en %LOGFILE%
    echo ERROR: git push >> "%LOGFILE%"
    goto :error
)
echo     OK

REM ── 2. SCP ───────────────────────────────────────────
echo.
echo [2/4] Copiando script al servidor...
echo [2/4] SCP >> "%LOGFILE%"

scp "%~dp0deploy_server.sh" %SERVER%:/tmp/vb.sh >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: scp fallo. Ver detalles en %LOGFILE%
    echo ERROR: scp >> "%LOGFILE%"
    goto :error
)
echo     OK

REM ── 3. SSH - limpiar CRLF ────────────────────────────
echo.
echo [3/4] Ejecutando en el servidor...
echo [3/4] SSH sed >> "%LOGFILE%"

ssh %SERVER% "sed -i 's/\r//' /tmp/vb.sh" >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: sed fallo. Ver detalles en %LOGFILE%
    goto :error
)

REM ── 3b. SSH - ejecutar script ─────────────────────────
echo [3/4] SSH bash >> "%LOGFILE%"

ssh %SERVER% "bash /tmp/vb.sh" >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: el script fallo en el servidor. Ver detalles en %LOGFILE%
    echo ERROR: bash /tmp/vb.sh >> "%LOGFILE%"
    goto :error
)
echo     OK

REM ── 4. PM2 status ─────────────────────────────────────
echo.
echo [4/4] Estado PM2...
echo [4/4] PM2 >> "%LOGFILE%"
ssh %SERVER% "pm2 list" >> "%LOGFILE%" 2>&1

echo.
echo ===================================================
echo   COMPLETADO - http://192.168.100.190:5001
echo ===================================================
echo COMPLETADO %TIME% >> "%LOGFILE%"
echo.
echo Abriendo log...
start notepad "%LOGFILE%"
goto :end

:error
echo.
echo ===================================================
echo   ERROR - Abriendo log para ver detalles...
echo ===================================================
echo ERROR %TIME% >> "%LOGFILE%"
echo.
start notepad "%LOGFILE%"
echo.
pause
exit /b 1

:end
endlocal
pause
