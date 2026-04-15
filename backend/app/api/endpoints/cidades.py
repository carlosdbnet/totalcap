from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from app.models.cidade import Cidade as CidadeModel
from app.schemas.cidade import Cidade, CidadeCreate, CidadeUpdate

router = APIRouter()

@router.get("/", response_model=list[Cidade])
def read_cidades(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(CidadeModel).offset(skip).limit(limit).all()

@router.post("/", response_model=Cidade)
def create_cidade(
    *,
    db: Session = Depends(get_db),
    cidade_in: CidadeCreate
) -> Any:
    db_obj = CidadeModel(**cidade_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=Cidade)
def update_cidade(
    *,
    db: Session = Depends(get_db),
    id: int,
    cidade_in: CidadeUpdate
) -> Any:
    db_obj = db.query(CidadeModel).filter(CidadeModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Cidade não encontrada")
    
    update_data = cidade_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=Cidade)
def delete_cidade(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(CidadeModel).filter(CidadeModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Cidade não encontrada")
    db.delete(db_obj)
    db.commit()
    return db_obj
