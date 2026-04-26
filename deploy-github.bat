@echo off
REM Script para commit e push das alteracoes para o GitHub

echo.
echo ================================
echo   Totalcap - Deploy para GitHub
echo ================================
echo.

REM adicionar todos os arquivos
echo [1] Adicionando arquivos...
git add -A
if errorlevel 1 (
    echo ERRO ao adicionar arquivos!
    pause
    exit /b 1
)

REM verificar se ha alteracoes
git status --porcelain >nul
if %errorlevel% equ 0 (
    echo.Nenhuma alteracao para commitar.
    echo.
    pause
    exit /b 0
)

echo.
echo Alteracoes detectadas:
git status --porcelain
echo.

REM pedir mensagem de commit
set /p commit_msg="Digite a mensagem do commit (ou Enter para padrao): "
if "%commit_msg%"=="" (
    set commit_msg=Atualizacao de codigo
)

echo.
echo [2] Fazendo commit...
git commit -m "%commit_msg%"
if errorlevel 1 (
    echo ERRO ao fazer commit!
    pause
    exit /b 1
)

echo.
echo [3] Enviando para GitHub...
git push origin main
if errorlevel 1 (
    echo ERRO ao enviar para GitHub!
    echo.
    echo Possivel necessidade de pull primeiro:
    echo Tente usar: git pull origin main --rebase
    pause
    exit /b 1
)

echo.
echo ================================
echo   Deploy concluido com sucesso!
echo ================================
echo.

pause