Write-Host "Iniciando Totalcap Local..." -ForegroundColor Cyan

Write-Host "-> Iniciando Backend (FastAPI)..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command `"cd backend; .\venv\Scripts\Activate.ps1; uvicorn main:app --host 0.0.0.0 --port 8000 --reload`""

Write-Host "-> Iniciando Frontend (React Vite)..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command `"cd frontend; npm run dev -- --host 0.0.0.0`""

Write-Host "Tudo pronto! O sistema está rodando em sua rede local." -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend API Docs: http://localhost:8000/docs" -ForegroundColor White
