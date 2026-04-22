from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any, List
from backend.database import get_db
from backend.app.models.tipodocto import TipoDocto as TipoDoctoModel
from backend.app.schemas.tipodocto import TipoDoctoResponse, TipoDoctoCreate, TipoDoctoUpdate

router = APIRouter()

@router.get("/", response_model=List[TipoDoctoResponse])
def read_tipos_docto(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return db.query(TipoDoctoModel).order_by(TipoDoctoModel.id.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=TipoDoctoResponse)
def create_tipo_docto(
    *,
    db: Session = Depends(get_db),
    tipo_in: TipoDoctoCreate
) -> Any:
    db_obj = TipoDoctoModel(
        codigo=tipo_in.codigo,
        descricao=tipo_in.descricao,
        ativo=tipo_in.ativo
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=TipoDoctoResponse)
def update_tipo_docto(
    *,
    db: Session = Depends(get_db),
    id: int,
    tipo_in: TipoDoctoUpdate
) -> Any:
    db_obj = db.query(TipoDoctoModel).filter(TipoDoctoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Tipo de documento não encontrado")
    
    update_data = tipo_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}")
def delete_tipo_docto(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(TipoDoctoModel).filter(TipoDoctoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Tipo de documento não encontrado")
    
    db.delete(db_obj)
    db.commit()
    return {"status": "success", "message": "Tipo de documento excluído"}
