from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.models.medida import Medida as MedidaModel
from backend.app.schemas.medida import Medida, MedidaCreate, MedidaUpdate

router = APIRouter()

@router.get("/", response_model=list[Medida])
def read_medidas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(MedidaModel).offset(skip).limit(limit).all()

@router.post("/", response_model=Medida)
def create_medida(
    *,
    db: Session = Depends(get_db),
    medida_in: MedidaCreate
) -> Any:
    db_obj = MedidaModel(**medida_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=Medida)
def update_medida(
    *,
    db: Session = Depends(get_db),
    id: int,
    medida_in: MedidaUpdate
) -> Any:
    db_obj = db.query(MedidaModel).filter(MedidaModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Medida não encontrada")
    
    update_data = medida_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=Medida)
def delete_medida(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(MedidaModel).filter(MedidaModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Medida não encontrada")
    db.delete(db_obj)
    db.commit()
    return db_obj
