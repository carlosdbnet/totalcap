from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from app.models.transportadora import Transportadora as TransportadoraModel
from app.schemas.transportadora import Transportadora, TransportadoraCreate, TransportadoraUpdate

router = APIRouter()

@router.get("/", response_model=list[Transportadora])
def read_transportadoras(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve transportadoras.
    """
    return db.query(TransportadoraModel).offset(skip).limit(limit).all()

@router.post("/", response_model=Transportadora)
def create_transportadora(
    *,
    db: Session = Depends(get_db),
    transportadora_in: TransportadoraCreate
) -> Any:
    """
    Create new transportadora.
    """
    db_obj = TransportadoraModel(**transportadora_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=Transportadora)
def update_transportadora(
    *,
    db: Session = Depends(get_db),
    id: int,
    transportadora_in: TransportadoraUpdate
) -> Any:
    """
    Update a transportadora.
    """
    db_obj = db.query(TransportadoraModel).filter(TransportadoraModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Transportadora não encontrada")
    
    update_data = transportadora_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=Transportadora)
def delete_transportadora(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    """
    Delete a transportadora.
    """
    db_obj = db.query(TransportadoraModel).filter(TransportadoraModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Transportadora não encontrada")
    db.delete(db_obj)
    db.commit()
    return db_obj
