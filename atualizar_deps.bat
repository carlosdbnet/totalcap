@echo off
echo Instalando dependencias no ambiente virtual ( .venv )...
".venv\Scripts\python.exe" -m pip install --upgrade pip
".venv\Scripts\pip.exe" install -r requirements.txt
echo.
echo Processo concluido!
pause
