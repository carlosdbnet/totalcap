from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.models.tiporecap import TipoRecapagem as TipoRecapagemModel
from backend.app.schemas.tiporecap import TipoRecapagem, TipoRecapagemCreate, TipoRecapagemUpdate

router = APIRouter()

@router.get("/", response_model=list[TipoRecapagem])
def read_tiporecaps(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(TipoRecapagemModel).offset(skip).limit(limit).all()

@router.post("/", response_model=TipoRecapagem)
def create_tiporecap(
    *,
    db: Session = Depends(get_db),
    tiporecap_in: TipoRecapagemCreate
) -> Any:
    db_obj = TipoRecapagemModel(**tiporecap_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=TipoRecapagem)
def update_tiporecap(
    *,
    db: Session = Depends(get_db),
    id: int,
    tiporecap_in: TipoRecapagemUpdate
) -> Any:
    db_obj = db.query(TipoRecapagemModel).filter(TipoRecapagemModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Tipo de recapagem não encontrado")
    
    update_data = tiporecap_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=TipoRecapagem)
def delete_tiporecap(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(TipoRecapagemModel).filter(TipoRecapagemModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Tipo de recapagem não encontrado")
    db.delete(db_obj)
    db.commit()
    return db_obj
