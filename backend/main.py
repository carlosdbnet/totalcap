import os
import sys

# Garante que a raiz do projeto est no path para evitar ModuleNotFoundError
sys.path.append(os.getcwd())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.config import settings
from backend.app.api.api import api_router
from backend.app.models.usuario import Usuario
from backend.app.core.security import get_password_hash

from contextlib import asynccontextmanager

# Garantir que as tabelas existem e admin inicial criado
try:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    admin = db.query(Usuario).filter(Usuario.email == "admin@totalcap.com").first()
    if not admin:
        new_admin = Usuario(
            email="admin@totalcap.com",
            hashed_password=get_password_hash("admin123"),
            is_active=True,
            is_superuser=True,
            full_name="Administrator"
        )
        db.add(new_admin)
        db.commit()
    db.close()
    print("Banco de dados e admin inicializados com sucesso.")
except Exception as e:
    print(f"Erro ao inicializar banco de dados: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Adicionando CORS para permitir o VITE (React) consumir a API localmente
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Para desenvolvimento, ajustar em prod
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

@app.get("/api/v1/ping")
def ping():
    return {"status": "ok", "message": "Backend respondendo corretamente na Vercel!"}
