from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db
from backend.app.models.laudo import Laudo as LaudoModel
from backend.app.models.fatura_laudo import FaturaLaudo
from backend.app.schemas.laudo import LaudoCreate, LaudoUpdate, LaudoResponse

router = APIRouter()

def recalculate_balance(laudo: LaudoModel, db: Session):
    # Soma todos os valores aplicados deste laudo em todas as faturas
    total_pago = db.query(func.sum(FaturaLaudo.valor)).filter(FaturaLaudo.id_laudo == laudo.id).scalar() or 0
    laudo.vrpago = total_pago
    laudo.vrsaldo = (laudo.vrcredito or 0) - total_pago
    db.add(laudo)
    db.commit()
    db.refresh(laudo)

@router.get("/", response_model=List[LaudoResponse])
def read_laudos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(LaudoModel).offset(skip).limit(limit).all()

@router.get("/relatorio")
def get_relatorio_laudos(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    resultado: Optional[str] = None,
    id_contato: Optional[int] = None,
    com_saldo: Optional[bool] = None,
    db: Session = Depends(get_db)
) -> Any:
    """
    Retorna dados consolidados para o relatório de laudos técnicos.
    """
    from backend.app.models.contato import Contato

    query = db.query(
        LaudoModel.id,
        LaudoModel.datasol,
        LaudoModel.numlaudo,
        LaudoModel.numserie,
        LaudoModel.numfogo,
        LaudoModel.laudo.label("resultado"),
        LaudoModel.vrcredito,
        LaudoModel.vrpago,
        LaudoModel.vrsaldo,
        Contato.razaosocial.label("cliente_nome")
    ).outerjoin(Contato, LaudoModel.id_contato == Contato.id)

    if start_date:
        query = query.filter(LaudoModel.datasol >= start_date)
    if end_date:
        query = query.filter(LaudoModel.datasol <= end_date + " 23:59:59")
    if resultado:
        query = query.filter(LaudoModel.laudo == resultado)
    if id_contato:
        query = query.filter(LaudoModel.id_contato == id_contato)
    
    if com_saldo is True:
        query = query.filter(LaudoModel.vrsaldo > 0)
    elif com_saldo is False:
        query = query.filter(LaudoModel.vrsaldo <= 0)

    results = query.order_by(LaudoModel.datasol.desc()).all()

    return [
        {
            "id": r.id,
            "data": r.datasol.isoformat() if r.datasol else None,
            "numlaudo": r.numlaudo,
            "numserie": r.numserie,
            "numfogo": r.numfogo,
            "resultado": r.resultado,
            "vrcredito": float(r.vrcredito) if r.vrcredito else 0,
            "vrpago": float(r.vrpago) if r.vrpago else 0,
            "vrsaldo": float(r.vrsaldo) if r.vrsaldo else 0,
            "cliente_nome": r.cliente_nome
        }
        for r in results
    ]

@router.get("/{id}", response_model=LaudoResponse)
def read_laudo_by_id(
    id: int,
    db: Session = Depends(get_db)
) -> Any:
    db_obj = db.query(LaudoModel).filter(LaudoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Laudo não encontrado")
    return db_obj

@router.get("/cliente/{id_contato}", response_model=List[LaudoResponse])
def read_laudos_by_cliente(
    id_contato: int,
    db: Session = Depends(get_db)
) -> Any:
    return db.query(LaudoModel).filter(
        LaudoModel.id_contato == id_contato,
        LaudoModel.vrsaldo > 0
    ).all()

@router.post("/", response_model=LaudoResponse)
def create_laudo(
    *,
    db: Session = Depends(get_db),
    laudo_in: LaudoCreate
) -> Any:
    db_obj = LaudoModel(**laudo_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Se numlaudo for 0 ou nulo, usa o próprio ID do registro
    if not db_obj.numlaudo or db_obj.numlaudo == 0:
        db_obj.numlaudo = db_obj.id
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
    # Recalcular saldo inicial
    recalculate_balance(db_obj, db)
    
    return db_obj

@router.put("/{id}", response_model=LaudoResponse)
def update_laudo(
    *,
    db: Session = Depends(get_db),
    id: int,
    laudo_in: LaudoUpdate
) -> Any:
    db_obj = db.query(LaudoModel).filter(LaudoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Laudo não encontrado")
    
    update_data = laudo_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Recalcular vrpago e vrsaldo após atualização (importante se vrcredito mudar)
    recalculate_balance(db_obj, db)
    
    return db_obj

@router.delete("/{id}")
def delete_laudo(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(LaudoModel).filter(LaudoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Laudo não encontrado")
    db.delete(db_obj)
    db.commit()
    return {"status": "success"}

