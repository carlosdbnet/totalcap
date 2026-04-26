from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import String, func
from typing import List
from backend.database import get_db
from backend.app.models.fatura_laudo import FaturaLaudo
from backend.app.models.laudo import Laudo
from backend.app.schemas import fatura_laudo as schemas

router = APIRouter()

def recalculate_laudo_balance(id_laudo: int, db: Session):
    laudo = db.query(Laudo).filter(Laudo.id == id_laudo).first()
    if not laudo:
        return None
    
    # Soma todos os valores aplicados deste laudo em todas as faturas
    total_pago = db.query(func.sum(FaturaLaudo.valor)).filter(FaturaLaudo.id_laudo == id_laudo).scalar() or 0
    
    laudo.vrpago = total_pago
    laudo.vrsaldo = (laudo.vrcredito or 0) - total_pago
    
    db.add(laudo)
    db.commit()
    db.refresh(laudo)
    return laudo

@router.get("/fatura/{id_fatura}", response_model=List[schemas.FaturaLaudo])
def get_laudos_by_fatura(id_fatura: int, db: Session = Depends(get_db)):
    items = db.query(FaturaLaudo, Laudo.numlaudo, Laudo.id_pneu, Laudo.vrcredito, Laudo.vrsaldo).\
        join(Laudo, FaturaLaudo.id_laudo == Laudo.id).\
        filter(FaturaLaudo.id_fatura == id_fatura).all()
    
    result = []
    for fl, numlaudo, pneu_id, vrcredito, vrsaldo in items:
        # Create a dict that matches the schema
        d = schemas.FaturaLaudo.from_orm(fl)
        d.numlaudo = numlaudo
        d.pneu_id = pneu_id
        d.vrcredito = vrcredito
        d.vrsaldo = vrsaldo
        result.append(d)
        
    return result

@router.post("/", response_model=schemas.FaturaLaudo)
def create_fatura_laudo(item: schemas.FaturaLaudoCreate, db: Session = Depends(get_db)):
    # 1. Bloquear duplicidade de laudo na mesma fatura
    existing = db.query(FaturaLaudo).filter(
        FaturaLaudo.id_fatura == item.id_fatura,
        FaturaLaudo.id_laudo == item.id_laudo
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Este laudo já está vinculado a esta fatura.")

    # 2. Verificar se laudo existe
    laudo = db.query(Laudo).filter(Laudo.id == item.id_laudo).first()
    if not laudo:
        raise HTTPException(status_code=404, detail="Laudo não encontrado")
    
    db_item = FaturaLaudo(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # 3. Atualizar campo vrpago e vrsaldo do laudo
    laudo = recalculate_laudo_balance(item.id_laudo, db)
    
    # Return with extra info
    result = schemas.FaturaLaudo.from_orm(db_item)
    result.numlaudo = laudo.numlaudo
    result.pneu_id = laudo.id_pneu
    result.vrcredito = laudo.vrcredito
    result.vrsaldo = laudo.vrsaldo
    return result

@router.delete("/{id}")
def delete_fatura_laudo(id: int, db: Session = Depends(get_db)):
    db_item = db.query(FaturaLaudo).filter(FaturaLaudo.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    
    id_laudo = db_item.id_laudo
    db.delete(db_item)
    db.commit()
    
    # Recalcular após deleção
    recalculate_laudo_balance(id_laudo, db)
    
    return {"message": "Vínculo removido com sucesso"}

@router.put("/{id}", response_model=schemas.FaturaLaudo)
def update_fatura_laudo(id: int, item: schemas.FaturaLaudoUpdate, db: Session = Depends(get_db)):
    db_item = db.query(FaturaLaudo).filter(FaturaLaudo.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    
    for key, value in item.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    
    # Atualizar campos vrpago e vrsaldo do laudo após alteração do valor
    laudo = recalculate_laudo_balance(db_item.id_laudo, db)
    
    result = schemas.FaturaLaudo.from_orm(db_item)
    if laudo:
        result.numlaudo = laudo.numlaudo
        result.pneu_id = laudo.id_pneu
        result.vrcredito = laudo.vrcredito
        result.vrsaldo = laudo.vrsaldo
        
    return result

@router.get("/search-laudos")
def search_laudos(q: str = Query(...), db: Session = Depends(get_db)):
    # Search by numlaudo or pneu_id (serie/fogo in laudo table?)
    # For now, let's stick to numlaudo
    items = db.query(Laudo).filter(
        (Laudo.numlaudo.cast(String).ilike(f"%{q}%")) |
        (Laudo.numserie.ilike(f"%{q}%")) |
        (Laudo.numfogo.ilike(f"%{q}%"))
    ).limit(10).all()
    return items
