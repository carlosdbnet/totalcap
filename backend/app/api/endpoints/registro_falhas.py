from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.schemas.registro_falha import RegistroFalhaResponse, RegistroFalhaCreate
from backend.app.services.registro_falha import registro_falha_service
import traceback

router = APIRouter()

@router.get("/", response_model=List[RegistroFalhaResponse])
def get_registros_falha(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    try:
        return registro_falha_service.get_registros(db, skip=skip, limit=limit)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_registro_falha(obj_in: RegistroFalhaCreate, db: Session = Depends(get_db)):
    try:
        novo = registro_falha_service.create_registro(db, obj_in=obj_in)
        return {"id": novo.id, "status": "success"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
def delete_registro_falha(id: int, db: Session = Depends(get_db)):
    try:
        success = registro_falha_service.delete_registro(db, id=id)
        if not success:
            raise HTTPException(status_code=404, detail="Registro não encontrado")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
