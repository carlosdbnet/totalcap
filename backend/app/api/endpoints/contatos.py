from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.models.contato import Contato as ContatoModel

router = APIRouter()

class ContatoImportSchema(BaseModel):
    nome: str
    cpfcnpj: Optional[str] = None
    razaosocial: Optional[str] = None
    pessoa: Optional[str] = 'F'
    rg: Optional[str] = None
    inscestadual: Optional[str] = None
    inscmunicipio: Optional[str] = None
    rua: Optional[str] = None
    numcasa: Optional[str] = None
    bairro: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    foneprincipal: Optional[str] = None
    email: Optional[str] = None
    contato_comercial: Optional[str] = None
    contato_financeiro: Optional[str] = None
    ativo: Optional[bool] = True

@router.get("/")
def read_contatos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(ContatoModel).offset(skip).limit(limit).all()

@router.post("/")
def create_contato(
    *,
    db: Session = Depends(get_db),
    contato_in: ContatoImportSchema
) -> Any:
    db_obj = ContatoModel(**contato_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj