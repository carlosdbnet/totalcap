from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.models.consumo_materia import ConsumoMateria
from backend.app.models.produto import Produto
from backend.app.models.setor import Setor
from backend.app.models.operador import Operador

router = APIRouter()

from datetime import datetime

@router.post("/")
def create_consumo(data: dict, db: Session = Depends(get_db)):
    datamov = None
    if data.get("datamov"):
        try:
            datamov = datetime.strptime(str(data.get("datamov")), '%Y-%m-%d')
        except:
            pass
    
    new_reg = ConsumoMateria(
        id_produto=data.get("id_produto"),
        id_setor=data.get("id_setor"),
        id_operador=data.get("id_operador"),
        quant=data.get("quant"),
        obs=data.get("obs"),
        datamov=datamov
    )
    db.add(new_reg)
    db.commit()
    db.refresh(new_reg)
    return new_reg

@router.put("/{id}")
def update_consumo(id: int, data: dict, db: Session = Depends(get_db)):
    reg = db.query(ConsumoMateria).filter(ConsumoMateria.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    
    reg.id_produto = data.get("id_produto")
    if data.get("id_setor"):
        reg.id_setor = data.get("id_setor")
    if data.get("id_operador"):
        reg.id_operador = data.get("id_operador")
    if data.get("quant"):
        reg.quant = data.get("quant")
    if data.get("obs") is not None:
        reg.obs = data.get("obs")
    if data.get("datamov"):
        try:
            reg.datamov = datetime.strptime(str(data.get("datamov")), '%Y-%m-%d')
        except:
            pass
    
    db.commit()
    db.refresh(reg)
    return reg

@router.get("/relatorio")
def get_relatorio_consumo(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    id_produto: Optional[int] = None,
    db: Session = Depends(get_db)
) -> Any:
    """
    Retorna dados para o relatório de consumo de matéria-prima.
    """
    query = db.query(
        ConsumoMateria.id,
        ConsumoMateria.datamov.label("data"),
        ConsumoMateria.quant,
        ConsumoMateria.obs,
        Produto.descricao.label("produto_nome"),
        Produto.unidade.label("unidade"),
        Setor.descricao.label("setor_nome"),
        Operador.nome.label("operador_nome")
    ).join(Produto, ConsumoMateria.id_produto == Produto.id)\
     .outerjoin(Setor, ConsumoMateria.id_setor == Setor.id)\
     .outerjoin(Operador, ConsumoMateria.id_operador == Operador.id)

    if start_date:
        query = query.filter(ConsumoMateria.datamov >= start_date)
    if end_date:
        query = query.filter(ConsumoMateria.datamov <= end_date + " 23:59:59")
    if id_produto:
        query = query.filter(ConsumoMateria.id_produto == id_produto)

    results = query.order_by(ConsumoMateria.datamov.desc()).all()

    return [
        {
            "id": r.id,
            "data": r.data.isoformat() if r.data else None,
            "produto_nome": r.produto_nome,
            "unidade": r.unidade,
            "quant": float(r.quant) if r.quant else 0,
            "setor_nome": r.setor_nome or "-",
            "operador_nome": r.operador_nome or "-",
            "obs": r.obs
        }
        for r in results
    ]
@router.delete("/{id}")
def delete_consumo(id: int, db: Session = Depends(get_db)):
    reg = db.query(ConsumoMateria).filter(ConsumoMateria.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    
    db.delete(reg)
    db.commit()
    return {"status": "success"}
