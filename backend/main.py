import os
import sys
from contextlib import asynccontextmanager

# Garante que a raiz do projeto está no path para evitar ModuleNotFoundError
sys.path.append(os.getcwd())

from fastapi import FastAPI, Depends
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
    print("Iniciando lifespan: Verificando Banco de Dados...")
    # Pula criação automática em produção se já estiver configurado (opcional)
    if os.getenv("VERCEL") and os.getenv("SKIP_DB_INIT"):
        print("Pulando inicialização do banco no Vercel (SKIP_DB_INIT=1)")
    else:
        try:
            # Tenta criar as tabelas se não existirem
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            admin = db.query(Usuario).filter(Usuario.email == settings.FIRST_SUPERUSER).first()
            
            # Hash da senha padrão
            hashed_pw = get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)
            
            if not admin:
                print(f"Criando admin inicial: {settings.FIRST_SUPERUSER}")
                new_admin = Usuario(
                    nome="Administrator",
                    email=settings.FIRST_SUPERUSER,
                    hashed_password=hashed_pw,
                    is_active=True,
                    is_superuser=True
                )
                db.add(new_admin)
                db.commit()
                print("Admin inicial criado com sucesso.")
            else:
                # Atualiza senha apenas se necessário ou em dev
                if not os.getenv("VERCEL"):
                    admin.hashed_password = hashed_pw
                    db.commit()
                print(f"Admin verificado.")
                
            db.close()
        except Exception as e:
            print(f"ALERTA na inicialização do DB (pode ser timeout no Vercel): {e}")
    
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
