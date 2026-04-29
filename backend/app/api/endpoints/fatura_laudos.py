from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import String
from typing import List
from backend.database import get_db
from backend.app.models.laudo import Laudo
from backend.app.schemas import fatura_laudo as schemas
from backend.app.services.fatura_laudo import fatura_laudo_service

router = APIRouter()

@router.get("/fatura/{id_fatura}", response_model=List[schemas.FaturaLaudo])
def get_laudos_by_fatura(id_fatura: int, db: Session = Depends(get_db)):
    try:
        return fatura_laudo_service.get_by_fatura(db, id_fatura)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=schemas.FaturaLaudo, status_code=status.HTTP_201_CREATED)
def create_fatura_laudo(item: schemas.FaturaLaudoCreate, db: Session = Depends(get_db)):
    db_item = fatura_laudo_service.create_link(db, item)
    # Re-fetch with names for response
    laudos = fatura_laudo_service.get_by_fatura(db, db_item.id_fatura)
    for l in laudos:
        if l["id"] == db_item.id:
            return l
    return db_item

@router.put("/{id}", response_model=schemas.FaturaLaudo)
def update_fatura_laudo(id: int, item: schemas.FaturaLaudoUpdate, db: Session = Depends(get_db)):
    db_item = fatura_laudo_service.update_link(db, id, item)
    # Re-fetch with names for response
    laudos = fatura_laudo_service.get_by_fatura(db, db_item.id_fatura)
    for l in laudos:
        if l["id"] == db_item.id:
            return l
    return db_item

@router.delete("/{id}")
def delete_fatura_laudo(id: int, db: Session = Depends(get_db)):
    fatura_laudo_service.remove_link(db, id)
    return {"message": "Vínculo removido com sucesso"}

@router.get("/search-laudos")
def search_laudos(q: str = Query(...), db: Session = Depends(get_db)):
    items = db.query(Laudo).filter(
        (Laudo.numlaudo.cast(String).ilike(f"%{q}%")) |
        (Laudo.numserie.ilike(f"%{q}%")) |
        (Laudo.numfogo.ilike(f"%{q}%"))
    ).limit(10).all()
    return items
