@echo off
REM ============================================================
REM  deploy_virbox.bat
REM  Despliega los cambios del modulo de Socios en el servidor
REM  Servidor: mariano@192.168.100.27
REM  Uso: Ejecutar desde la raiz del proyecto VirBox
REM ============================================================

setlocal enabledelayedexpansion

set SERVER=mariano@192.168.100.27
set APP_DIR=/home/mariano/VirBox
set GIT_BRANCH=main

REM NOTA: Si el proceso pm2 tiene otro nombre, cambia este valor:
set PM2_APP_NAME=virbox

echo.
echo ============================================================
echo   DESPLIEGUE VIRBOX - Modulo de Socios
echo ============================================================
echo.

REM ── PASO 1: Commit y push de los cambios locales ─────────────
echo [1/5] Preparando cambios locales...
echo.

git add -A
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: git add fallo.
    goto :error
)

git commit -m "feat: Modulo de Socios para empresas tipo Asociacion

- Nuevo campo companyType en tabla companies (6 tipos)
- Nuevas tablas: member_types, seasons, members, member_fee_payments
- 17 nuevos endpoints REST para el modulo de Socios
- Paginas: MemberTypes, Seasons, Members, MemberFeePayments
- Sidebar condicional (solo visible para Asociaciones)
- Selector de tipo de empresa en formulario de Companies"

if %ERRORLEVEL% NEQ 0 (
    echo AVISO: No habia nada nuevo que commitear, continuando...
)

echo.
echo [2/5] Subiendo cambios a GitHub...
git push origin %GIT_BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: git push fallo. Comprueba la conexion y credenciales de GitHub.
    goto :error
)
echo     OK - Cambios subidos a GitHub.

REM ── PASO 2: Conectar al servidor y ejecutar actualizacion ─────
echo.
echo [3/5] Conectando al servidor y actualizando codigo...

ssh %SERVER% "cd %APP_DIR% && git pull origin %GIT_BRANCH%"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudo hacer git pull en el servidor.
    echo        Verifica que el servidor tenga acceso a GitHub.
    goto :error
)
echo     OK - Codigo actualizado en el servidor.

REM ── PASO 3: Instalar dependencias (por si hay nuevas) ─────────
echo.
echo [4/5] Instalando dependencias npm en el servidor...

ssh %SERVER% "cd %APP_DIR% && npm install --production=false"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install fallo en el servidor.
    goto :error
)
echo     OK - Dependencias instaladas.

REM ── PASO 4: Migrar la base de datos ──────────────────────────
echo.
echo [5/5] Aplicando migracion de base de datos (db:push)...
echo       Esto creara las nuevas tablas:
echo         - member_types
echo         - seasons
echo         - members
echo         - member_fee_payments
echo       Y el campo company_type en la tabla companies.
echo.

ssh %SERVER% "cd %APP_DIR% && npm run db:push"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: La migracion de base de datos fallo.
    echo        Comprueba que DATABASE_URL esta configurada en el servidor.
    goto :error
)
echo     OK - Base de datos migrada correctamente.

REM ── PASO 5: Reiniciar la aplicacion ──────────────────────────
echo.
echo [6/6] Reiniciando la aplicacion...

REM Intenta con pm2 primero, luego con systemctl
ssh %SERVER% "pm2 restart virbox 2>/dev/null || pm2 restart all 2>/dev/null || sudo systemctl restart virbox 2>/dev/null || echo 'AVISO: No se pudo reiniciar automaticamente. Reinicia el servidor manualmente.'"

echo.
echo ============================================================
echo   DESPLIEGUE COMPLETADO CON EXITO
echo ============================================================
echo.
echo   Cambios aplicados:
echo   - Nuevo campo tipo de empresa en Companies
echo   - Menu Socios visible para empresas tipo Asociacion
echo   - Tablas de BD creadas: member_types, seasons,
echo     members, member_fee_payments
echo.
echo   URL del servidor: http://192.168.100.27:5001
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
