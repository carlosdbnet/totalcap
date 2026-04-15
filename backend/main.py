from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from config import settings
from app.api.api import api_router
from app.models.usuario import Usuario
from app.core.security import get_password_hash

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

@app.on_event("startup")
def startup_event():
    # Garantir que as tabelas existem (em producao, usar Alembic)
    Base.metadata.create_all(bind=engine)
    
    # Criar usuario admin inicial se nao existir
    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.email == settings.FIRST_SUPERUSER).first()
        if not user:
            admin_user = Usuario(
                email=settings.FIRST_SUPERUSER,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                nome="Admin Totalcap",
                is_superuser=True,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print(f"Usuario admin criado: {settings.FIRST_SUPERUSER}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Bem-vindo ao Backend do Totalcap!"}
