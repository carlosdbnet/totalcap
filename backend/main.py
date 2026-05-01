import os
import sys
from contextlib import asynccontextmanager

# Ajuste de PATH para garantir que os arquivos locais sejam encontrados
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Importações inteligentes sem usar importação relativa (.)
try:
    # Estrutura Monorepo (Local)
    from backend.database import SessionLocal, engine, Base, get_db
    from backend.config import settings
    from backend.app.api.api import api_router
except (ModuleNotFoundError, ImportError):
    # Estrutura Flat (Railway/Deploy)
    try:
        from database import SessionLocal, engine, Base, get_db
        from config import settings
        from app.api.api import api_router
    except (ModuleNotFoundError, ImportError):
        # Fallback via importação direta de módulo
        import database
        import config
        # Tenta importar o roteador da subpasta app
        try:
            from app.api.api import api_router
        except:
            # Caso extremo
            sys.path.append(os.path.join(current_dir, "app"))
            from api.api import api_router
            
        SessionLocal = database.SessionLocal
        engine = database.engine
        Base = database.Base
        get_db = database.get_db
        settings = config.settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Backend Totalcap iniciado com sucesso.")
    yield
    print("Encerrando lifespan.")

app = FastAPI(
    title="Totalcap API",
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

app.include_router(api_router, prefix="/api/v1")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "source": "main_app_root_v2"}

@app.get("/")
def read_root():
    return {"message": "Bem-vindo ao Backend do Totalcap!"}

@app.get("/api/v1/ping")
def ping():
    return {"status": "ok", "message": "Backend respondendo corretamente!"}
