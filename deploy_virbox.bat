@echo off
setlocal

set SERVER=mm@192.168.100.190
set GIT_BRANCH=main

if "%~1"=="" (
    set COMMIT_MSG=chore: deploy update
) else (
    set COMMIT_MSG=%~1
)

echo.
echo ===================================================
echo   DESPLIEGUE VIRBOX  /  %SERVER%
echo ===================================================
echo.

echo [1/4] Subiendo cambios a GitHub...
git add -A
git commit -m "%COMMIT_MSG%"
git push origin %GIT_BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: git push fallo.
    goto :error
)
echo     OK

echo.
echo [2/4] Copiando script al servidor...
scp deploy_server.sh %SERVER%:/tmp/vb.sh
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: scp fallo.
    goto :error
)
echo     OK

echo.
echo [3/4] Ejecutando en el servidor...
ssh %SERVER% "sed -i 's/\r//' /tmp/vb.sh"
ssh %SERVER% "bash /tmp/vb.sh"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: fallo en el servidor.
    echo Conectate con: ssh %SERVER%
    echo Ejecuta:       bash -x /tmp/vb.sh
    goto :error
)

echo.
echo [4/4] Estado PM2...
ssh %SERVER% "pm2 list"

echo.
echo ===================================================
echo   COMPLETADO - http://192.168.100.190:5001
echo ===================================================
goto :end

:error
echo.
echo ===================================================
echo   ERROR - Revisa la salida anterior
echo ===================================================
exit /b 1

:end
endlocal
pause
