@echo off
setlocal enabledelayedexpansion
title Totalcap - Gerador de APK
color 0E

echo ==========================================================
echo               Gerador de APK Totalcap (Android)
echo ==========================================================
echo.

:: --- Configuração Automática do Ambiente Java ---
echo Configurando ambiente Java...
set "AS_JAVA=C:\Program Files\Android\Android Studio\jbr"
if exist "%AS_JAVA%\bin\javac.exe" (
    set "JAVA_HOME=%AS_JAVA%"
    set "PATH=%AS_JAVA%\bin;%PATH%"
    echo [OK] Usando JDK do Android Studio.
) else (
    javac -version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [AVISO] JDK nao encontrado no PATH nem no Android Studio.
        echo O build pode falhar se o JAVA_HOME nao estiver configurado corretamente.
    ) else (
        echo [OK] JDK ja configurado no sistema.
    )
)

:: --- Configuração Automática do Android SDK ---
set "SDK_PATH=%LOCALAPPDATA%\Android\Sdk"
if not exist "!SDK_PATH!" (
    set "SDK_PATH=C:\Android\Sdk"
)

if exist "!SDK_PATH!" (
    set "ANDROID_HOME=!SDK_PATH!"
    set "PATH=!SDK_PATH!\platform-tools;%PATH%"
    echo [OK] Android SDK encontrado em: !SDK_PATH!
    
    :: Cria ou atualiza o local.properties para garantir que o Gradle encontre o SDK
    set "PROPS_FILE=mobile\android\local.properties"
    if exist "!PROPS_FILE!" del /f /q "!PROPS_FILE!"
    
    echo # Gerado automaticamente pelo script de build>"!PROPS_FILE!"
    
    set "SDK_PATH_PROP=!SDK_PATH:\=/!"
    echo sdk.dir=!SDK_PATH_PROP!>>"!PROPS_FILE!"
    
    echo [OK] Arquivo local.properties atualizado.
) else (
    echo [AVISO] Android SDK nao encontrado. O build provavelmente falhara.
)

echo.
echo Verificando arquivos do projeto...
if not exist "mobile\android\gradlew.bat" (
    echo [ERRO] Pasta 'mobile\android' nao encontrada ou sem gradlew.bat.
    echo Certifique-se de que o projeto Android foi inicializado. Execute: npx expo prebuild
    pause
    exit /b 1
)

echo.
echo Iniciando o processo de build...
echo Isso pode levar alguns minutos dependendo do seu computador.
echo.

cd mobile\android

echo [1/2] Limpando builds anteriores...
call gradlew clean

echo.
echo [2/2] Compilando APK (Release)...
:: Forçamos a versão do NDK via parâmetro para tentar resolver conflitos de bibliotecas
call gradlew assembleRelease -Pandroid.ndkVersion=27.1.12297006

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo ERRO: Falha ao gerar o APK. Verifique as mensagens acima.
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    cd ..\..
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==========================================================
echo Build concluida com sucesso!
echo ==========================================================
echo.

set SOURCE_APK=app\build\outputs\apk\release\app-release.apk
set DEST_APK=..\..\Totalcap_Mobile.apk

if exist "%SOURCE_APK%" (
    echo Copiando APK para a raiz do projeto...
    copy "%SOURCE_APK%" "%DEST_APK%" > nul
    echo.
    echo APK disponivel em: %DEST_APK%
) else (
    echo.
    echo O arquivo APK nao foi encontrado no local esperado:
    echo %SOURCE_APK%
)

cd ..\..
echo.
echo Pressione qualquer tecla para sair.
pause > nul
endlocal
