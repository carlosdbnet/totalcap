from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.app.models.servico import Servico as ServicoModel
from backend.app.schemas.servico import Servico, ServicoCreate, ServicoUpdate

router = APIRouter()

@router.get("/", response_model=list[Servico])
def read_servicos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(ServicoModel).options(
        joinedload(ServicoModel.medida),
        joinedload(ServicoModel.desenho),
        joinedload(ServicoModel.produto),
        joinedload(ServicoModel.recap)
    ).offset(skip).limit(limit).all()

@router.post("/", response_model=Servico)
def create_servico(
    *,
    db: Session = Depends(get_db),
    servico_in: ServicoCreate
) -> Any:
    db_obj = ServicoModel(**servico_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Reload with relationships
    return db.query(ServicoModel).options(
        joinedload(ServicoModel.medida),
        joinedload(ServicoModel.desenho),
        joinedload(ServicoModel.produto),
        joinedload(ServicoModel.recap)
    ).filter(ServicoModel.id == db_obj.id).first()

@router.put("/{id}", response_model=Servico)
def update_servico(
    *,
    db: Session = Depends(get_db),
    id: int,
    servico_in: ServicoUpdate
) -> Any:
    db_obj = db.query(ServicoModel).filter(ServicoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    
    update_data = servico_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Reload with relationships
    return db.query(ServicoModel).options(
        joinedload(ServicoModel.medida),
        joinedload(ServicoModel.desenho),
        joinedload(ServicoModel.produto),
        joinedload(ServicoModel.recap)
    ).filter(ServicoModel.id == db_obj.id).first()

@router.delete("/{id}", response_model=Servico)
def delete_servico(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(ServicoModel).filter(ServicoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    db.delete(db_obj)
    db.commit()
    return db_obj
