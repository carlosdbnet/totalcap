from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.app.core import security
from backend.app.models.usuario import Usuario
from backend.app.schemas.usuario import Token
from backend.database import get_db
from backend.config import settings

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    # Normaliza o email vindo do formulário
    username = form_data.username.strip().lower()


    # Busca o usuário
    user = db.query(Usuario).filter(Usuario.email == username).first()

    
    # Se não encontrar o admin padrão, vamos criá-lo agora (independente de quantos usuários existam)
    if not user and username == settings.FIRST_SUPERUSER.lower():
        from backend.app.core.security import get_password_hash
        user = Usuario(
            email=settings.FIRST_SUPERUSER.lower(),
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            nome="Admin Totalcap",
            is_superuser=True,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Admin criado automaticamente no login: {settings.FIRST_SUPERUSER}")

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ou senha incorretos",
        )

    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inativo"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }
