from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.schemas.falha import Falha as FalhaSchema, FalhaCreate, FalhaUpdate
from backend.app.schemas.registro_falha import RegistroFalhaResponse, RegistroFalhaCreate
from backend.app.services.registro_falha import registro_falha_service
from backend.app.models.falha import Falha
import traceback

router = APIRouter()

# ========== TABELA: falha (tipos de falha) ==========
@router.get("/teste")
def teste_falha():
    return {"message": "ok"}

@router.get("/tipofalhas/", response_model=List[FalhaSchema])
def get_tipos_falha(db: Session = Depends(get_db)):
    try:
        return db.query(Falha).all()
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tipofalhas/", response_model=FalhaSchema)
def create_tipo_falha(obj_in: FalhaCreate, db: Session = Depends(get_db)):
    try:
        nova = Falha(**obj_in.model_dump())
        db.add(nova)
        db.commit()
        db.refresh(nova)
        return nova
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/tipofalhas/{id}", response_model=FalhaSchema)
def update_tipo_falha(id: int, obj_in: FalhaUpdate, db: Session = Depends(get_db)):
    try:
        falha = db.query(Falha).filter(Falha.id == id).first()
        if not falha:
            raise HTTPException(status_code=404, detail="Tipo de falha não encontrado")
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(falha, field, value)
        
        db.commit()
        db.refresh(falha)
        return falha
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/tipofalhas/{id}")
def delete_tipo_falha(id: int, db: Session = Depends(get_db)):
    try:
        falha = db.query(Falha).filter(Falha.id == id).first()
        if not falha:
            raise HTTPException(status_code=404, detail="Tipo de falha não encontrado")
        
        db.delete(falha)
        db.commit()
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# RegistroFalha logic moved to registro_falhas.py