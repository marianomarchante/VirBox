@echo off
REM ============================================================
REM  deploy_virbox.bat
REM  Despliega los cambios en el servidor VirBox
REM  Servidor: mm@192.168.100.190
REM  Uso: Ejecutar desde la raiz del proyecto VirBox
REM       deploy_virbox.bat ["mensaje de commit opcional"]
REM ============================================================

setlocal enabledelayedexpansion

set SERVER=mm@192.168.100.190
set APP_DIR=/home/mm/VirBox
set GIT_BRANCH=main
set PM2_APP_NAME=virbox

REM Mensaje de commit: usar el argumento pasado o uno generico
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

REM ── PASO 1: Commit y push de los cambios locales ─────────────
echo [1/5] Preparando y subiendo cambios locales...
echo.

git add -A
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: git add fallo.
    goto :error
)

git commit -m "%COMMIT_MSG%"
if %ERRORLEVEL% NEQ 0 (
    echo AVISO: No habia nada nuevo que commitear, continuando...
)

git push origin %GIT_BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: git push fallo. Comprueba la conexion y credenciales de GitHub.
    goto :error
)
echo     OK - Cambios subidos a GitHub.

REM ── PASO 2: Actualizar codigo en el servidor ─────────────────
echo.
echo [2/5] Actualizando codigo en el servidor...

ssh %SERVER% "bash -lc 'cd %APP_DIR% && git pull origin %GIT_BRANCH%'"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudo hacer git pull en el servidor.
    echo        Verifica que el servidor tenga acceso a GitHub.
    goto :error
)
echo     OK - Codigo actualizado en el servidor.

REM ── PASO 3: Instalar dependencias ────────────────────────────
echo.
echo [3/5] Instalando dependencias npm en el servidor...

REM bash -lc carga .bashrc/.bash_profile -> nvm/node/npm quedan en PATH
REM --include=dev reemplaza al obsoleto --production=false (npm v7+)
REM --legacy-peer-deps evita fallos por conflictos de peer dependencies
ssh %SERVER% "bash -lc 'node -v && npm -v'"
ssh %SERVER% "bash -lc 'cd %APP_DIR% && npm install --include=dev --legacy-peer-deps'"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install fallo en el servidor.
    echo        Posibles causas:
    echo          - Node.js no esta en el PATH del servidor
    echo          - Sin conexion a internet en el servidor
    echo          - Permisos insuficientes en node_modules
    echo        Intenta conectarte manualmente y ejecutar:
    echo          bash -lc 'cd %APP_DIR% ^&^& npm install --include=dev --legacy-peer-deps'
    goto :error
)
echo     OK - Dependencias instaladas.

REM ── PASO 4: Compilar el servidor (esbuild) ───────────────────
echo.
echo [4/5] Compilando el servidor...

ssh %SERVER% "bash -lc 'cd %APP_DIR% && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist'"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: La compilacion del servidor fallo.
    echo        Revisa los errores de TypeScript/esbuild en el servidor.
    goto :error
)
echo     OK - Servidor compilado correctamente.

REM ── PASO 5: Reiniciar la aplicacion ──────────────────────────
echo.
echo [5/5] Reiniciando la aplicacion con PM2...

ssh %SERVER% "bash -lc 'pm2 restart %PM2_APP_NAME% 2>/dev/null || pm2 restart all 2>/dev/null || sudo systemctl restart virbox 2>/dev/null || echo AVISO: reinicia el servidor manualmente'"

echo.
echo ============================================================
echo   DESPLIEGUE COMPLETADO CON EXITO
echo ============================================================
echo.
echo   URL del servidor: http://192.168.100.190:5001
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
