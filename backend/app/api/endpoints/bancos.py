from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.models.banco import Banco as BancoModel
from backend.app.schemas.banco import Banco, BancoCreate, BancoUpdate

router = APIRouter()

@router.get("/", response_model=List[Banco])
def read_bancos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    # Retorna todos os bancos (opcionalmente pode filtrar por ativo se desejar)
    return db.query(BancoModel).order_by(BancoModel.id.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=Banco)
def create_banco(
    *,
    db: Session = Depends(get_db),
    banco_in: BancoCreate
) -> Any:
    db_obj = BancoModel(**banco_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=Banco)
def update_banco(
    *,
    db: Session = Depends(get_db),
    id: int,
    banco_in: BancoUpdate
) -> Any:
    db_obj = db.query(BancoModel).filter(BancoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Banco não encontrado")
    update_data = banco_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=Banco)
def delete_banco(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(BancoModel).filter(BancoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Banco não encontrado")
    db.delete(db_obj)
    db.commit()
    return db_obj
