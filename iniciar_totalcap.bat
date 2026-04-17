@echo off
title Totalcap - Dashboard de Inicialização
color 0B

:: Verifica se o ambiente virtual existe
if not exist .venv (
    echo [ERRO] Ambiente virtual .venv nao encontrado!
    echo Por favor, crie o ambiente antes de continuar.
    pause
    exit
)

:: Verifica se o node_modules existe
if not exist node_modules (
    echo [AVISO] Pasta node_modules nao encontrada.
    echo Tentando instalar dependencias do frontend...
    npm install
)

cls
echo ==========================================================
echo               SISTEMA TOTALCAP - INICIALIZADOR
echo ==========================================================
echo.
echo [1] Iniciar Backend + Frontend (Recomendado)
echo [2] Iniciar apenas Backend (Porta 8000)
echo [3] Iniciar apenas Frontend (Porta 5173)
echo [0] Sair
echo.
set /p choice="Escolha uma opcao: "

if "%choice%"=="1" goto all
if "%choice%"=="2" goto backend
if "%choice%"=="3" goto frontend
if "%choice%"=="0" exit

:backend
cls
echo [BACKEND] Iniciando servidor FastAPI...
.venv\Scripts\uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
pause
goto menu

:frontend
cls
echo [FRONTEND] Iniciando servidor Vite...
npm run dev
pause
goto menu

:all
cls
echo [INFO] Abrindo janelas separadas para Backend e Frontend...

:: Inicia o Backend
start "Totalcap - Backend" cmd /c ".venv\Scripts\uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

:: Inicia o Frontend
start "Totalcap - Frontend" cmd /c "npm run dev"

echo.
echo ==========================================================
echo   BACKEND:  http://localhost:8000
echo   FRONTEND: http://localhost:5173
echo ==========================================================
echo.
echo Pressione qualquer tecla para fechar este menu (servicos continuarao rodando).
pause >nul
exit
