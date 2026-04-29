from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api import deps
from backend.app.core import security
from backend.app.models.usuario import Usuario
from backend.app.schemas.usuario import PasswordChangeResponse, UpdatePassword, Usuario as UsuarioSchema, UsuarioCreate, UsuarioUpdate
from backend.database import get_db

router = APIRouter()

@router.get("/", response_model=List[UsuarioSchema])
def read_usuarios(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Usuario = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Retrieve users.
    """
    usuarios = db.query(Usuario).offset(skip).limit(limit).all()
    return usuarios

@router.post("/", response_model=UsuarioSchema)
def create_usuario(
    *,
    db: Session = Depends(get_db),
    usuario_in: UsuarioCreate,
    current_user: Usuario = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Create new user.
    """
    usuario = db.query(Usuario).filter(Usuario.email == usuario_in.email).first()
    if usuario:
        raise HTTPException(
            status_code=400,
            detail="O usuário com este e-mail já existe no sistema.",
        )
    
    db_obj = Usuario(
        email=usuario_in.email,
        hashed_password=security.get_password_hash(usuario_in.password),
        nome=usuario_in.nome,
        is_superuser=usuario_in.is_superuser,
        is_active=usuario_in.is_active,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{usuario_id}", response_model=UsuarioSchema)
def update_usuario(
    *,
    db: Session = Depends(get_db),
    usuario_id: int,
    usuario_in: UsuarioUpdate,
    current_user: Usuario = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Update a user.
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado",
        )
    
    update_data = usuario_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        usuario.hashed_password = security.get_password_hash(update_data["password"])
        del update_data["password"]
    
    for field in update_data:
        if hasattr(usuario, field):
            setattr(usuario, field, update_data[field])

    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario

@router.delete("/{usuario_id}", response_model=UsuarioSchema)
def delete_usuario(
    *,
    db: Session = Depends(get_db),
    usuario_id: int,
    current_user: Usuario = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Delete a user.
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if usuario.id == current_user.id:
        raise HTTPException(status_code=400, detail="Você não pode deletar a si mesmo")
    
    db.delete(usuario)
    db.commit()
    return usuario

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
    
    if len(password_in.new_password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ter pelo menos 4 caracteres",
        )

    current_user.hashed_password = security.get_password_hash(password_in.new_password)
    db.add(current_user)
    db.commit()
    return {"msg": "Senha atualizada com sucesso"}
