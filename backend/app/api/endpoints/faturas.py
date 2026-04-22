from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from typing import Any, List, Optional
from backend.database import get_db
from backend.app.models.fatura import Fatura as FaturaModel, FaturaServico as FaturaServicoModel, FaturaParcela as FaturaParcelaModel
from backend.app.models.ordem_servico import OSPneu as PneuModel
from backend.app.models.pneu_servico import PneuServico as PneuServicoModel
from backend.app.models.servico import Servico as ServicoModel
from backend.app.models.planopag import PlanoPag as PlanoPagModel
from backend.app.schemas.fatura import FaturaResponse, FaturaCreate, FaturaUpdate
from datetime import timedelta
from decimal import Decimal

router = APIRouter()

def get_next_parcela_id(db: Session) -> int:
    max_id = db.query(func.max(FaturaParcelaModel.id)).scalar()
    return (max_id or 0) + 1

def map_fatura_to_response(fatura):
    if hasattr(fatura, 'contato') and fatura.contato:
        fatura.contato_nome = fatura.contato.nome
    if hasattr(fatura, 'vendedor') and fatura.vendedor:
        fatura.vendedor_nome = fatura.vendedor.nome
    return fatura

@router.get("/", response_model=List[FaturaResponse])
def read_faturas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = None
) -> Any:
    query = db.query(FaturaModel).options(
        joinedload(FaturaModel.pneus).joinedload(PneuModel.servico),
        joinedload(FaturaModel.contato),
        joinedload(FaturaModel.vendedor),
        joinedload(FaturaModel.items),
        joinedload(FaturaModel.parcelas)
    )
    
    if q:
        from backend.app.models.contato import Contato
        if q.isdigit():
            query = query.filter(FaturaModel.id == int(q))
        else:
            query = query.join(FaturaModel.contato).filter(Contato.nome.ilike(f"%{q}%"))
            
    faturas = query.order_by(FaturaModel.datafat.desc(), FaturaModel.id.desc()).offset(skip).limit(limit).all()
    return [map_fatura_to_response(f) for f in faturas]

@router.get("/{id}", response_model=FaturaResponse)
def read_fatura(
    id: int,
    db: Session = Depends(get_db),
) -> Any:
    db_obj = db.query(FaturaModel).options(
        joinedload(FaturaModel.pneus),
        joinedload(FaturaModel.contato),
        joinedload(FaturaModel.vendedor),
        joinedload(FaturaModel.items),
        joinedload(FaturaModel.parcelas)
    ).filter(FaturaModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Fatura não encontrada")
    return map_fatura_to_response(db_obj)

@router.post("/", response_model=FaturaResponse, status_code=status.HTTP_201_CREATED)
def create_fatura(
    *,
    db: Session = Depends(get_db),
    fatura_in: FaturaCreate,
) -> Any:
    # 1. Validações de Pendências
    if fatura_in.id_contato is None:
        raise HTTPException(status_code=400, detail="Pendente: O cliente não foi identificado corretamente.")
    
    if fatura_in.id_planopag is None:
        raise HTTPException(status_code=400, detail="Pendente: É necessário selecionar um plano de pagamento.")

    if not fatura_in.pneu_ids:
        raise HTTPException(status_code=400, detail="Pendente: Nenhum pneu foi selecionado para faturamento.")



    # 2. Criar Fatura (Mestre)
    fatura_data = fatura_in.model_dump(exclude={'pneu_ids', 'parcelas'})
    db_fatura = FaturaModel(**fatura_data)
    db.add(db_fatura)
    db.flush() # Gerar ID
 
    # 3. Vincular Pneus e Copiar Serviços (Detalhe)
    if fatura_in.pneu_ids:
        for pneu_id in fatura_in.pneu_ids:
            pneu = db.query(PneuModel).filter(PneuModel.id == pneu_id).first()
            if pneu:
                pneu.statusfat = True # Marcar como faturado
                
                # Vamos buscar os PneuServicoModel do pneu
                v_servicos = db.query(PneuServicoModel).filter(PneuServicoModel.id_pneu == pneu.id).all()
                for vs in v_servicos:
                    servico_master = db.query(ServicoModel).filter(ServicoModel.id == vs.id_servico).first()
                    
                    item_fatura = FaturaServicoModel(
                        id_fatura=db_fatura.id,
                        id_empresa=db_fatura.id_empresa,
                        id_pneu=pneu.id,
                        id_pneusrv=vs.id,
                        id_servico=str(vs.id_servico),
                        codservico=servico_master.codigo if servico_master else None,
                        descricao=servico_master.descricao if servico_master else "Serviço",
                        vrtabela=vs.vrtabela,
                        pdescto=vs.pdescto,
                        valor=vs.valor,
                        quant=vs.quant,
                        vrtotal=vs.vrtotal,
                        pcomissao=vs.pcomissao,
                        userlan=db_fatura.userlan
                    )
                    db.add(item_fatura)
        
                # 4. Gerar Parcelas (Manual ou Automático)
        if fatura_in.parcelas:
            next_p_id = get_next_parcela_id(db)
            for p_in in fatura_in.parcelas:
                parcela = FaturaParcelaModel(
                    id=next_p_id,
                    id_fatura=db_fatura.id,
                    id_empresa=db_fatura.id_empresa,
                    id_contato=db_fatura.id_contato,
                    id_vendedor=db_fatura.id_vendedor,
                    id_banco=db_fatura.id_banco,
                    id_tipodocto=db_fatura.id_tipodocto,
                    datafat=db_fatura.datafat,
                    vencto=p_in.vencto,
                    valor=p_in.valor,
                    userlan=db_fatura.userlan
                )
                db.add(parcela)
                next_p_id += 1
        elif db_fatura.id_planopag:
            plano = db.query(PlanoPagModel).filter(PlanoPagModel.id == db_fatura.id_planopag).first()
            if plano and plano.numparc and plano.numparc > 0:
                valor_parcela = Decimal(str(db_fatura.vrtotal)) / Decimal(str(plano.numparc))
                next_p_id = get_next_parcela_id(db)
                for i in range(1, plano.numparc + 1):
                    venc = db_fatura.datafat + timedelta(days=30 * i)
                    parcela = FaturaParcelaModel(
                        id=next_p_id,
                        id_fatura=db_fatura.id,
                        id_empresa=db_fatura.id_empresa,
                        id_contato=db_fatura.id_contato,
                        id_vendedor=db_fatura.id_vendedor,
                        id_banco=db_fatura.id_banco,
                        id_tipodocto=db_fatura.id_tipodocto,
                        datafat=db_fatura.datafat,
                        vencto=venc,
                        valor=valor_parcela,
                        userlan=db_fatura.userlan
                    )
                    db.add(parcela)
                    next_p_id += 1
        db.commit()
    db.refresh(db_fatura)
    
    # Recarrega com os relacionamentos
    return read_fatura(id=db_fatura.id, db=db)

@router.put("/{id}", response_model=FaturaResponse)
def update_fatura(
    *,
    db: Session = Depends(get_db),
    id: int,
    fatura_in: FaturaUpdate,
) -> Any:
    db_fatura = db.query(FaturaModel).filter(FaturaModel.id == id).first()
    if not db_fatura:
        raise HTTPException(status_code=404, detail="Fatura não encontrada")

    # 1. Atualizar campos da Fatura
    fatura_data = fatura_in.model_dump(exclude_unset=True, exclude={'pneu_ids', 'parcelas'})
    for field, value in fatura_data.items():
        setattr(db_fatura, field, value)

    # 2. Atualizar vínculos de Pneus se fornecidos
    if fatura_in.pneu_ids is not None:
        # Desvincular pneus atuais
        for pneu in db_fatura.pneus:
                pneu.statusfat = False
        
        db.flush()
        
        # Vincular novos pneus e copiar serviços
        for pneu_id in fatura_in.pneu_ids:
            pneu = db.query(PneuModel).filter(PneuModel.id == pneu_id).first()
            if pneu:
                pneu.statusfat = True
                
                # Recriar itens da fatura
                v_servicos = db.query(PneuServicoModel).filter(PneuServicoModel.id_pneu == pneu.id).all()
                for vs in v_servicos:
                    servico_master = db.query(ServicoModel).filter(ServicoModel.id == vs.id_servico).first()
                    item_fatura = FaturaServicoModel(
                        id_fatura=db_fatura.id,
                        id_empresa=db_fatura.id_empresa,
                        id_pneu=pneu.id,
                        id_pneusrv=vs.id,
                        id_servico=str(vs.id_servico),
                        codservico=servico_master.codigo if servico_master else None,
                        descricao=servico_master.descricao if servico_master else "Serviço",
                        vrtabela=vs.vrtabela,
                        pdescto=vs.pdescto,
                        valor=vs.valor,
                        quant=vs.quant,
                        vrtotal=vs.vrtotal,
                        pcomissao=vs.pcomissao,
                        userlan=db_fatura.userlan
                    )
                    db.add(item_fatura)
        
                # 4. Gerar Parcelas (Manual ou Automático)
        # Se fornecidas parcelas, limpamos as atuais e recriamos
        if fatura_in.parcelas is not None:
            db.query(FaturaParcelaModel).filter(FaturaParcelaModel.id_fatura == db_fatura.id).delete()
            next_p_id = get_next_parcela_id(db)
            for p_in in fatura_in.parcelas:
                parcela = FaturaParcelaModel(
                    id=next_p_id,
                    id_fatura=db_fatura.id,
                    id_empresa=db_fatura.id_empresa,
                    id_contato=db_fatura.id_contato,
                    id_vendedor=db_fatura.id_vendedor,
                    id_banco=db_fatura.id_banco,
                    id_tipodocto=db_fatura.id_tipodocto,
                    datafat=db_fatura.datafat,
                    vencto=p_in.vencto,
                    valor=p_in.valor,
                    userlan=db_fatura.userlan
                )
                db.add(parcela)
                next_p_id += 1
        db.commit()
    db.refresh(db_fatura)
    return read_fatura(id=id, db=db)

@router.delete("/{id}", response_model=FaturaResponse)
def delete_fatura(
    *,
    db: Session = Depends(get_db),
    id: int,
) -> Any:
    db_fatura = db.query(FaturaModel).filter(FaturaModel.id == id).first()
    if not db_fatura:
        raise HTTPException(status_code=404, detail="Fatura não encontrada")
    
    # Desvincular pneus antes de deletar a fatura
    for pneu in db_fatura.pneus:
        pneu.statusfat = False
        
    db.delete(db_fatura)
    db.commit()
    return map_fatura_to_response(db_fatura)
@router.get("/relatorio/vendas-servico")
def relatorio_vendas_servico(
    db: Session = Depends(get_db),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    id_contato: Optional[int] = None,
    id_vendedor: Optional[int] = None
) -> Any:
    """Relatório detalhado de vendas por serviço baseado em faturas."""
    from backend.app.models.contato import Contato
    from backend.app.models.vendedor import Vendedor
    
    query = db.query(
        FaturaServicoModel.id,
        FaturaServicoModel.id_fatura,
        FaturaServicoModel.descricao.label("servico_nome"),
        FaturaServicoModel.valor,
        FaturaServicoModel.quant,
        FaturaServicoModel.vrtotal,
        FaturaServicoModel.pcomissao,
        FaturaModel.datafat,
        Contato.nome.label("cliente_nome"),
        Vendedor.nome.label("vendedor_nome"),
        PneuModel.numserie,
        PneuModel.numfogo
    ).join(FaturaModel, FaturaServicoModel.id_fatura == FaturaModel.id)\
     .join(Contato, FaturaModel.id_contato == Contato.id)\
     .join(Vendedor, FaturaModel.id_vendedor == Vendedor.id)\
     .outerjoin(PneuModel, FaturaServicoModel.id_pneu == PneuModel.id)

    if start_date:
        query = query.filter(FaturaModel.datafat >= start_date)
    if end_date:
        query = query.filter(FaturaModel.datafat <= end_date + " 23:59:59")
    if id_contato:
        query = query.filter(FaturaModel.id_contato == id_contato)
    if id_vendedor:
        query = query.filter(FaturaModel.id_vendedor == id_vendedor)

    results = query.order_by(FaturaModel.datafat.desc(), FaturaServicoModel.id.desc()).all()
    
    # Converter para lista de dicts para o frontend
    return [
        {
            "id": r.id,
            "fatura_id": r.id_fatura,
            "datafat": r.datafat.isoformat() if r.datafat else None,
            "cliente_nome": r.cliente_nome,
            "vendedor_nome": r.vendedor_nome,
            "numserie": r.numserie,
            "numfogo": r.numfogo,
            "servico_nome": r.servico_nome,
            "quant": float(r.quant) if r.quant else 0,
            "valor": float(r.valor) if r.valor else 0,
            "vrtotal": float(r.vrtotal) if r.vrtotal else 0,
            "pcomissao": float(r.pcomissao) if r.pcomissao else 0
        }
        for r in results
    ]

@router.get("/relatorio/comissoes")
def relatorio_comissoes(
    db: Session = Depends(get_db),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    id_vendedor: Optional[int] = None
) -> Any:
    """Relatório detalhado de comissões por vendedor."""
    from backend.app.models.vendedor import Vendedor
    from backend.app.models.contato import Contato

    query = db.query(
        FaturaServicoModel.id,
        FaturaServicoModel.id_fatura,
        FaturaServicoModel.descricao.label("servico_nome"),
        FaturaServicoModel.vrtotal,
        FaturaServicoModel.pcomissao,
        FaturaModel.datafat,
        Contato.nome.label("cliente_nome"),
        Vendedor.nome.label("vendedor_nome")
    ).join(FaturaModel, FaturaServicoModel.id_fatura == FaturaModel.id)\
     .join(Vendedor, FaturaModel.id_vendedor == Vendedor.id)\
     .join(Contato, FaturaModel.id_contato == Contato.id)

    if start_date:
        query = query.filter(FaturaModel.datafat >= start_date)
    if end_date:
        query = query.filter(FaturaModel.datafat <= end_date + " 23:59:59")
    if id_vendedor:
        query = query.filter(FaturaModel.id_vendedor == id_vendedor)

    results = query.order_by(Vendedor.nome, FaturaModel.datafat).all()
    
    return [
        {
            "id": r.id,
            "fatura_id": r.id_fatura,
            "datafat": r.datafat.isoformat() if r.datafat else None,
            "cliente_nome": r.cliente_nome,
            "vendedor_nome": r.vendedor_nome,
            "servico_nome": r.servico_nome,
            "vrtotal": float(r.vrtotal) if r.vrtotal else 0,
            "pcomissao": float(r.pcomissao) if r.pcomissao else 0,
            "vrcomissao": float(r.vrtotal * r.pcomissao / 100) if (r.vrtotal and r.pcomissao) else 0
        }
        for r in results
    ]

