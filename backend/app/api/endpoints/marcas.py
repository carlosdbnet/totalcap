from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.models.marca import Marca as MarcaModel
from backend.app.schemas.marca import Marca, MarcaCreate, MarcaUpdate

router = APIRouter()

@router.get("/", response_model=list[Marca])
def read_marcas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(MarcaModel).offset(skip).limit(limit).all()

@router.post("/", response_model=Marca)
def create_marca(
    *,
    db: Session = Depends(get_db),
    marca_in: MarcaCreate
) -> Any:
    db_obj = MarcaModel(**marca_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=Marca)
def update_marca(
    *,
    db: Session = Depends(get_db),
    id: int,
    marca_in: MarcaUpdate
) -> Any:
    db_obj = db.query(MarcaModel).filter(MarcaModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Marca não encontrada")
    
    update_data = marca_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=Marca)
def delete_marca(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(MarcaModel).filter(MarcaModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Marca não encontrada")
    db.delete(db_obj)
    db.commit()
    return db_obj
