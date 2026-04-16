from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.app.models.operador import Operador as OperadorModel
from backend.app.schemas.operador import Operador, OperadorCreate, OperadorUpdate

router = APIRouter()

@router.get("/", response_model=list[Operador])
def read_operadores(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(OperadorModel).options(
        joinedload(OperadorModel.setor),
        joinedload(OperadorModel.departamento)
    ).offset(skip).limit(limit).all()

@router.post("/", response_model=Operador)
def create_operador(
    *,
    db: Session = Depends(get_db),
    operador_in: OperadorCreate
) -> Any:
    db_obj = OperadorModel(**operador_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Reload with relationships
    return db.query(OperadorModel).options(
        joinedload(OperadorModel.setor),
        joinedload(OperadorModel.departamento)
    ).filter(OperadorModel.id == db_obj.id).first()

@router.put("/{id}", response_model=Operador)
def update_operador(
    *,
    db: Session = Depends(get_db),
    id: int,
    operador_in: OperadorUpdate
) -> Any:
    db_obj = db.query(OperadorModel).filter(OperadorModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Operador não encontrado")
    
    update_data = operador_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Reload with relationships
    return db.query(OperadorModel).options(
        joinedload(OperadorModel.setor),
        joinedload(OperadorModel.departamento)
    ).filter(OperadorModel.id == db_obj.id).first()

@router.delete("/{id}", response_model=Operador)
def delete_operador(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(OperadorModel).filter(OperadorModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Operador não encontrado")
    db.delete(db_obj)
    db.commit()
    return db_obj
