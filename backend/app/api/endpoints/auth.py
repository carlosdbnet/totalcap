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
    """
    OAuth2 compatible token login, retrieve an access token for future requests
    """
    # Garantia para Vercel: se não houver usuários, cria o admin inicial
    # Já que o 'lifespan' pode não rodar em serverless
    user_count = db.query(Usuario).count()
    if user_count == 0:
        from backend.app.core.security import get_password_hash
        admin_user = Usuario(
            email=settings.FIRST_SUPERUSER,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            nome="Admin Totalcap",
            is_superuser=True,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
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
