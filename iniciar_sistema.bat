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
backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
pause
exit

:frontend
cls
echo Iniciando apenas o Frontend na aba atual...
cd frontend && npm run dev -- --host
pause
exit

:all
cls
echo ==========================================================
echo        Iniciando Servicos com Verificacao de Saude
echo ==========================================================
echo.
echo [1/2] Iniciando o Backend em nova janela...
start "Totalcap - Backend" cmd /c "backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Aguardando o Backend carregar (http://localhost:8000/api/v1/status)...
set counter=0

:wait_backend
timeout /t 2 >nul
curl.exe -s http://localhost:8000/api/v1/status | findstr "online" >nul
if errorlevel 1 (
    set /a counter+=1
    echo [tentativa %%counter%%] Ainda aguardando backend...
    if %%counter%% gtr 30 (
        echo.
        echo ERROR: O Backend demorou demais para responder. 
        echo Verifique a janela do Backend por erros.
        pause
        goto menu
    )
    goto wait_backend
)

echo.
echo [OK] Backend Online!
echo.
echo [2/2] Iniciando o Frontend em nova janela...
start "Totalcap - Frontend" cmd /c "cd frontend && npm run dev -- --host"

echo.
echo ==========================================================
echo    Tudo pronto! Voce pode fechar esta janela agora.
echo ==========================================================
pause >nul
exit
