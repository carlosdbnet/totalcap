@echo off
echo =================================
echo   Iniciando Backend Totalcap 
echo =================================

echo - Ativando ambiente virtual...
if exist ".\.venv\Scripts\activate.bat" (
    call ".\.venv\Scripts\activate.bat"
) else (
    if exist ".\backend\venv\Scripts\activate.bat" (
        call ".\backend\venv\Scripts\activate.bat"
    ) else (
        echo Aviso: Nao foi possivel encontrar o ambiente virtual automatico.
    )
)

echo - Subindo servidor Uvicorn (FastAPI)...
cd backend
if exist "..\.venv\Scripts\python.exe" (
    "..\.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) else (
    if exist ".\venv\Scripts\python.exe" (
        ".\venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ) else (
        python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    )
)

pause
