import os
import sys
from contextlib import asynccontextmanager

# Garante que a raiz do projeto está no path para evitar ModuleNotFoundError
sys.path.append(os.getcwd())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.config import settings
from backend.app.api.api import api_router
from backend.app.models.usuario import Usuario
from backend.app.core.security import get_password_hash

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialização do Banco de Dados
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        admin = db.query(Usuario).filter(Usuario.email == settings.FIRST_SUPERUSER).first()
        if not admin:
            new_admin = Usuario(
                nome="Administrator",
                email=settings.FIRST_SUPERUSER,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                is_active=True,
                is_superuser=True
            )
            db.add(new_admin)
            db.commit()
            print("Admin inicial criado com sucesso.")
        db.close()
    except Exception as e:
        print(f"Aviso na inicialização do DB: {e}")
    
    yield
    # Limpeza se necessário

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

@app.get("/api/v1/ping")
def ping():
    return {"status": "ok", "message": "Backend respondendo corretamente na Vercel!"}
