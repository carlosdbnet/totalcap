import os
import sys
from contextlib import asynccontextmanager

# Garante que a raiz do projeto está no path para evitar ModuleNotFoundError
# Funciona tanto na raiz quanto dentro da pasta backend
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if os.getcwd() not in sys.path:
    sys.path.append(os.getcwd())

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base, get_db
from backend.config import settings
from backend.app.api.api import api_router
from backend.app.models.usuario import Usuario
from backend.app.core.security import get_password_hash

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialização do Banco de Dados comentada para evitar timeout no Vercel
    # Base.metadata.create_all(bind=engine)
    print("Backend Totalcap iniciado.")
    yield
    print("Encerrando lifespan.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "source": "main_app_root"}

@app.get("/")
def read_root():
    return {"message": "Bem-vindo ao Backend do Totalcap!"}

@app.get("/api/v1/db-check")
def db_check(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        result = db.execute(text("SELECT 1")).fetchone()
        user_count = db.query(Usuario).count()
        return {
            "status": "success", 
            "db_connect": "ok", 
            "result": result[0],
            "total_users": user_count,
            "database_url_prefix": settings.POSTGRES_URL[:20] + "..."
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }

@app.get("/api/v1/ping")
def ping():
    return {"status": "ok", "message": "Backend respondendo corretamente na Vercel!"}
