from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from app.models.departamento import Departamento as DepartamentoModel
from app.schemas.departamento import Departamento, DepartamentoCreate, DepartamentoUpdate

router = APIRouter()

@router.get("/", response_model=list[Departamento])
def read_departamentos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(DepartamentoModel).offset(skip).limit(limit).all()

@router.post("/", response_model=Departamento)
def create_departamento(
    *,
    db: Session = Depends(get_db),
    depto_in: DepartamentoCreate
) -> Any:
    db_obj = DepartamentoModel(**depto_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=Departamento)
def update_departamento(
    *,
    db: Session = Depends(get_db),
    id: int,
    depto_in: DepartamentoUpdate
) -> Any:
    db_obj = db.query(DepartamentoModel).filter(DepartamentoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Departamento não encontrado")
    
    update_data = depto_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=Departamento)
def delete_departamento(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(DepartamentoModel).filter(DepartamentoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Departamento não encontrado")
    db.delete(db_obj)
    db.commit()
    return db_obj
