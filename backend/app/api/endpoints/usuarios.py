from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api import deps
from backend.app.core import security
from backend.app.models.usuario import Usuario
from backend.app.schemas.usuario import PasswordChangeResponse, UpdatePassword
from backend.database import get_db

router = APIRouter()

@router.put("/me/password", response_model=PasswordChangeResponse)
def update_password_me(
    *,
    db: Session = Depends(get_db),
    password_in: UpdatePassword,
    current_user: Usuario = Depends(deps.get_current_user),
) -> Any:
    """
    Update own password.
    """
    if not security.verify_password(password_in.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta",
        )
    
    if len(password_in.new_password) < 4: # Requisito básico
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ter pelo menos 4 caracteres",
        )

    current_user.hashed_password = security.get_password_hash(password_in.new_password)
    db.add(current_user)
    db.commit()
    return {"msg": "Senha atualizada com sucesso"}
