@echo off
echo.
echo ======================================
echo 🚀 STEPS BOT - DEPLOY A FLY.IO
echo ======================================
echo.

echo ✅ Verificando configuracion...
if not exist "index.js" (
    echo ❌ Error: index.js no encontrado
    pause
    exit /b 1
)

if not exist "Dockerfile" (
    echo ❌ Error: Dockerfile no encontrado
    pause
    exit /b 1
)

if not exist "fly.toml" (
    echo ❌ Error: fly.toml no encontrado
    pause
    exit /b 1
)

echo ✅ Archivos de configuracion encontrados
echo.

echo 🔧 Configurando variables de entorno...
echo.
echo IMPORTANTE: Necesitas configurar tus secretos ANTES del deploy:
echo.
echo fly secrets set OPENROUTER_API_KEY="tu_api_key_aqui"
echo fly secrets set SITE_URL="https://steps-2gbo8a.fly.dev"
echo fly secrets set SITE_NAME="STEPS WhatsApp Bot"
echo fly secrets set PRODUCTION="true"
echo.

set /p continue="¿Ya configuraste los secretos? (s/n): "
if /i "%continue%" neq "s" (
    echo.
    echo ⚠️  Configura los secretos primero y vuelve a ejecutar este script
    pause
    exit /b 1
)

echo.
echo 🚀 Iniciando deploy...
fly deploy

echo.
echo ✅ Deploy completado!
echo.
echo 🌐 Dashboard: https://steps-2gbo8a.fly.dev
echo 📊 Status: https://steps-2gbo8a.fly.dev/status
echo 📱 Para conectar WhatsApp, visita el dashboard y escanea el QR
echo.
echo 📋 Comandos utiles:
echo   fly status    - Ver estado
echo   fly logs      - Ver logs
echo   fly restart   - Reiniciar bot
echo.
pause 