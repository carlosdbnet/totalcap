@echo off
title Totalcap - Painel de Inicializacao
color 0B
:menu
cls
echo ==========================================================
echo               Gestor de Servicos Totalcap
echo ==========================================================
echo.
echo [1] Iniciar apenas o Backend (Python/FastAPI)
echo [2] Iniciar apenas o Frontend (Vite/React)
echo [3] Iniciar AMBOS (Frontend e Backend simultaneamente)
echo [0] Sair
echo.
set /p choice="Digite o numero da opcao desejada e aperte ENTER: "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto all
if "%choice%"=="0" exit

echo Opcao invalida. Tente novamente.
timeout /t 2 >nul
goto menu

:backend
cls
echo Iniciando apenas o Backend na aba atual...
cd backend
..\.venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
exit

:frontend
cls
echo Iniciando apenas o Frontend na aba atual...
cd frontend
npm run dev -- --host
pause
exit

:all
cls
echo Iniciando os servicos em janelas separadas...
start "Totalcap - Backend" cmd /c "cd backend && ..\.venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000"
start "Totalcap - Frontend" cmd /c "cd frontend && npm run dev -- --host"
echo Servicos iniciados! Pressione qualquer tecla para fechar este menu.
pause >nul
exit
