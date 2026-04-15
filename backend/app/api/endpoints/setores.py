from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from app.models.setor import Setor as SetorModel
from app.schemas.setor import Setor, SetorCreate, SetorUpdate

router = APIRouter()

@router.get("/", response_model=list[Setor])
def read_setores(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(SetorModel).offset(skip).limit(limit).all()

@router.post("/", response_model=Setor)
def create_setor(
    *,
    db: Session = Depends(get_db),
    setor_in: SetorCreate
) -> Any:
    db_obj = SetorModel(**setor_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=Setor)
def update_setor(
    *,
    db: Session = Depends(get_db),
    id: int,
    setor_in: SetorUpdate
) -> Any:
    db_obj = db.query(SetorModel).filter(SetorModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Setor não encontrado")
    
    update_data = setor_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=Setor)
def delete_setor(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(SetorModel).filter(SetorModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Setor não encontrado")
    db.delete(db_obj)
    db.commit()
    return db_obj
