@echo off
setlocal
:: ======================================================
:: CONFIGURACOES DE PRODUCAO - COM TOKEN DE ACESSO
:: ======================================================
set TOKEN=SEU_TOKEN_AQUI
set REPO_URL=https://%TOKEN%@github.com/suportedbnet-ux/totalcap-producao.git
set GIT_USER=suportedbnet-ux
set GIT_EMAIL=suporte.dbnet@gmail.com
set DIST_DIR=C:\Sistema\Totalcap_Producao
:: ======================================================

echo.
echo ======================================================
echo    TOTALCAP - DISTRIBUICAO AUTOMATICA (PRODUCAO)
echo ======================================================
echo.

:: 1. Limpeza e Preparacao
if exist "%DIST_DIR%" (
    echo [1/4] Limpando pasta de distribuicao antiga...
    rd /s /q "%DIST_DIR%"
)
mkdir "%DIST_DIR%"

:: 2. Filtragem de Arquivos
echo [2/4] Copiando arquivos (Backend + Frontend + Configs)...
robocopy backend "%DIST_DIR%\backend" /E /XD node_modules .venv venv __pycache__ .git /NFL /NDL /NJH /NJS /nc /ns /np
robocopy frontend "%DIST_DIR%\frontend" /E /XD node_modules .venv venv __pycache__ .git /NFL /NDL /NJH /NJS /nc /ns /np

:: COPIAS PARA A RAIZ (Para o Railway detectar o Python)
copy backend\requirements.txt "%DIST_DIR%\" >nul
copy nixpacks.toml "%DIST_DIR%\" >nul
copy Procfile "%DIST_DIR%\" >nul
copy .vercelignore "%DIST_DIR%\" >nul
copy .gitignore "%DIST_DIR%\" >nul

:: 3. Configuracao do Git de Producao
pushd "%DIST_DIR%"
echo [3/4] Configurando Git com identidade de producao: %GIT_USER%
git init
git config user.name "%GIT_USER%"
git config user.email "%GIT_EMAIL%"
git remote add origin %REPO_URL%

:: 4. Commit e Push
echo [4/4] Criando commit e enviando para GitHub...
git add .
git checkout -b main
git commit -m "Producao: Deploy Versao 01051000 - Login Fix"

echo.
echo Tentando enviar para o GitHub de producao...
git push -u origin main --force

if errorlevel 1 (
    echo.
    echo [!] O push falhou. Verifique o repositorio.
) else (
    echo.
    echo ======================================================
    echo    SISTEMA ENVIADO COM SUCESSO PARA PRODUCAO!
    echo ======================================================
)

popd
pause
