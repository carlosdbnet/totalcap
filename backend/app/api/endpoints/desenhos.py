from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.models.desenho import Desenho as DesenhoModel
from backend.app.schemas.desenho import Desenho, DesenhoCreate, DesenhoUpdate

router = APIRouter()

@router.get("/", response_model=list[Desenho])
def read_desenhos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(DesenhoModel).offset(skip).limit(limit).all()

@router.post("/", response_model=Desenho)
def create_desenho(
    *,
    db: Session = Depends(get_db),
    desenho_in: DesenhoCreate
) -> Any:
    db_obj = DesenhoModel(**desenho_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=Desenho)
def update_desenho(
    *,
    db: Session = Depends(get_db),
    id: int,
    desenho_in: DesenhoUpdate
) -> Any:
    db_obj = db.query(DesenhoModel).filter(DesenhoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Desenho não encontrado")
    
    update_data = desenho_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=Desenho)
def delete_desenho(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(DesenhoModel).filter(DesenhoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Desenho não encontrado")
    db.delete(db_obj)
    db.commit()
    return db_obj
