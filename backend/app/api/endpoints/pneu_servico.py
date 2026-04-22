from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.models.pneu_servico import PneuServico as PneuServicoModel
from backend.app.models.ordem_servico import OrdemServico as OSModel, OSPneu
from backend.app.schemas.pneu_servico import PneuServicoCreate, PneuServicoUpdate, PneuServicoResponse
from sqlalchemy import func

router = APIRouter()

def update_os_totals(db: Session, os_id: int):
    """Recalcula os totais da OS baseada nos pneus e serviços adicionais."""
    if not os_id:
        return
        
    os = db.query(OSModel).filter(OSModel.id == os_id).first()
    if not os:
        return

    # Total dos pneus (Serviço principal de cada pneu)
    total_pneus = sum((p.valor for p in os.pneus if p.valor), 0)
    
    # Total de serviços adicionais
    total_servicos_adicionais = db.query(func.sum(PneuServicoModel.vrtotal))\
                                  .filter(PneuServicoModel.id_ordem == os_id).scalar() or 0
    
    os.vrservico = total_pneus + total_servicos_adicionais
    os.vrtotal = os.vrservico # Simplificado: vrtotal = vrservico (sem produtos/carcacça por hora)
    
    # Recalcula comissão se houver
    if os.pcomissao:
        os.vrcomissao = (os.vrtotal * os.pcomissao) / 100
        
    db.add(os)
    db.commit()

def update_pneu_stats(db: Session, pneu_id: int):
    """Atualiza o contador qservico e o valor vrservico na tabela pneu baseado nos registros de pneu_servico."""
    if not pneu_id:
        return
        
    stats = db.query(
        func.count(PneuServicoModel.id),
        func.sum(PneuServicoModel.vrtotal)
    ).filter(PneuServicoModel.id_pneu == pneu_id).first()
    
    count = stats[0] or 0
    total_servico = stats[1] or 0
              
    pneu = db.query(OSPneu).filter(OSPneu.id == pneu_id).first()
    if pneu:
        pneu.qservico = count
        from decimal import Decimal
        pneu.vrservico = total_servico
        pneu.vrtotal = pneu.vrservico + (pneu.vrcarcaca or Decimal("0.00"))
        db.add(pneu)
        db.commit()

@router.get("/pneu/{pneu_id}", response_model=List[PneuServicoResponse])
def read_pneu_servicos(
    pneu_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """Retorna todos os serviços vinculados a um pneu especifico."""
    from backend.app.models.servico import Servico
    
    results = db.query(PneuServicoModel, Servico.descricao)\
                .join(Servico, PneuServicoModel.id_servico == Servico.id)\
                .filter(PneuServicoModel.id_pneu == pneu_id).all()
    
    resp = []
    for ps, desc in results:
        item = PneuServicoResponse.from_orm(ps)
        item.servico_descricao = desc
        resp.append(item)
    return resp

@router.post("/", response_model=PneuServicoResponse)
def create_pneu_servico(
    *,
    db: Session = Depends(get_db),
    ps_in: PneuServicoCreate
) -> Any:
    """Adiciona um serviço a um pneu e atualiza a OS."""
    db_obj = PneuServicoModel(**ps_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Se tiver id_ordem, atualiza totais
    if db_obj.id_ordem:
        update_os_totals(db, db_obj.id_ordem)
        
    # Atualiza contador de serviços e totais no pneu
    if db_obj.id_pneu:
        update_pneu_stats(db, db_obj.id_pneu)
        
    return db_obj

@router.delete("/{id}")
def delete_pneu_servico(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    """Remove um serviço e atualiza a OS."""
    db_obj = db.query(PneuServicoModel).filter(PneuServicoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    
    os_id = db_obj.id_ordem
    pneu_id = db_obj.id_pneu
    db.delete(db_obj)
    db.commit()
    
    if os_id:
        update_os_totals(db, os_id)
    
    if pneu_id:
        update_pneu_stats(db, pneu_id)
        
    return {"status": "success", "message": "Serviço removido com sucesso"}

@router.put("/{id}", response_model=PneuServicoResponse)
def update_pneu_servico(
    *,
    db: Session = Depends(get_db),
    id: int,
    ps_in: PneuServicoUpdate
) -> Any:
    """Atualiza um serviço de pneu e recalcula totais."""
    db_obj = db.query(PneuServicoModel).filter(PneuServicoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    
    update_data = ps_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    # Recalcula vrtotal se quant ou valor mudaram
    if "quant" in update_data or "valor" in update_data:
        db_obj.vrtotal = db_obj.quant * db_obj.valor
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Atualiza totais da OS e do Pneu
    if db_obj.id_ordem:
        update_os_totals(db, db_obj.id_ordem)
    if db_obj.id_pneu:
        update_pneu_stats(db, db_obj.id_pneu)
        
    return db_obj
