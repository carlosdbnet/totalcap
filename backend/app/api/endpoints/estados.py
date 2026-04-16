from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.models.estado import Estado as EstadoModel
from backend.app.schemas.estado import Estado, EstadoCreate, EstadoUpdate

router = APIRouter()

@router.get("/", response_model=list[Estado])
def read_estados(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(EstadoModel).offset(skip).limit(limit).all()

@router.post("/", response_model=Estado)
def create_estado(
    *,
    db: Session = Depends(get_db),
    estado_in: EstadoCreate
) -> Any:
    # Check if sigla already exists
    sigla_upper = estado_in.sigla.upper()
    db_obj = db.query(EstadoModel).filter(EstadoModel.sigla == sigla_upper).first()
    if db_obj:
        raise HTTPException(status_code=400, detail="Estado com esta sigla já existe")
    
    estado_data = estado_in.dict()
    estado_data["sigla"] = sigla_upper
    
    db_obj = EstadoModel(**estado_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=Estado)
def update_estado(
    *,
    db: Session = Depends(get_db),
    id: int,
    estado_in: EstadoUpdate
) -> Any:
    db_obj = db.query(EstadoModel).filter(EstadoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Estado não encontrado")
    
    update_data = estado_in.dict(exclude_unset=True)
    if "sigla" in update_data:
        update_data["sigla"] = update_data["sigla"].upper()
        
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=Estado)
def delete_estado(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(EstadoModel).filter(EstadoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Estado não encontrado")
    db.delete(db_obj)
    db.commit()
    return db_obj
