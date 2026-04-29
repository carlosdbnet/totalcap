from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.models.dispositivo import Dispositivo
from backend.database import get_db

router = APIRouter()

class CredencialRequest(BaseModel):
    android_id: str
    id_setor: int

@router.post("/")
def solicitar_credencial(
    req: CredencialRequest,
    db: Session = Depends(get_db)
):
    """
    Solicitação de credencial do App Mobile.
    """
    existente = db.query(Dispositivo).filter(Dispositivo.android_id == req.android_id).first()
    if existente:
        return existente
    
    novo = Dispositivo(android_id=req.android_id, id_setor=req.id_setor, autorizado=False)
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@router.get("/{android_id}")
def check_credencial(android_id: str, db: Session = Depends(get_db)):
    """
    Verificação de credencial do App Mobile por Android ID.
    """
    result = db.query(Dispositivo).filter(Dispositivo.android_id == android_id).first()
    if not result:
        # O App mobile original espera um null ou objeto vazio se nao existir
        return None
    return result
