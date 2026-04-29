from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text

from backend.app.api import deps
from backend.app.models.ordem_servico import OSPneu, OrdemServico
from backend.app.models.apontamento import Apontamento
from backend.app.models.contato import Contato
from backend.app.models.medida import Medida
from backend.app.models.desenho import Desenho
from backend.app.models.setor import Setor
from backend.app.models.dispositivo import Dispositivo
from backend.app.schemas.pneu import Pneu as PneuSchema, PneuCreate
from backend.database import get_db

router = APIRouter()

@router.get("/", response_model=List[PneuSchema])
def list_pneus(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    List pneus with OS and Client info.
    """
    results = db.query(
        OSPneu, 
        OrdemServico.numos, 
        Contato.razaosocial
    ).outerjoin(OrdemServico, OSPneu.id_ordem == OrdemServico.id)\
     .outerjoin(Contato, OSPneu.id_contato == Contato.id)\
     .offset(skip).limit(limit).all()
    
    pneus = []
    for p, numos, razaosocial in results:
        p_dict = {c.name: getattr(p, c.name) for c in p.__table__.columns}
        p_dict["numos"] = numos
        p_dict["nome_cliente"] = razaosocial
        pneus.append(p_dict)
    return pneus

@router.get("/buscar", response_model=PneuSchema)
def buscar_pneu(
    codbarra: str,
    db: Session = Depends(get_db),
) -> Any:
    """
    Busca detalhada de pneu por código de barras para o App Mobile.
    Retorna dados da OS, Cliente e Histórico de Produção.
    """
    codbarra = codbarra.strip()
    result = db.query(
        OSPneu, 
        OrdemServico.numos, 
        Contato.razaosocial,
        OrdemServico.dataentrada,
        OrdemServico.vrtotal,
        Medida.descricao.label("medida_desc"),
        Desenho.descricao.label("desenho_desc")
    ).outerjoin(OrdemServico, OSPneu.id_ordem == OrdemServico.id)\
     .outerjoin(Contato, OSPneu.id_contato == Contato.id)\
     .outerjoin(Medida, OSPneu.id_medida == Medida.id)\
     .outerjoin(Desenho, OSPneu.id_desenho == Desenho.id)\
     .filter(OSPneu.codbarra == codbarra).first()
    
    if not result:
        raise HTTPException(status_code=404, detail=f"Pneu '{codbarra}' não encontrado")
    
    p, numos, razaosocial, dataentrada, vrtotal_os, medida_desc, desenho_desc = result
    
    # Criar dicionário de retorno
    p_dict = {c.name: getattr(p, c.name) for c in p.__table__.columns}
    p_dict["numos"] = numos
    p_dict["nome_cliente"] = razaosocial if razaosocial else "Sem nome cadastrado"
    p_dict["dataentrada"] = dataentrada
    p_dict["vrtotal_os"] = float(vrtotal_os) if vrtotal_os else 0.0
    p_dict["produto_desc"] = f"{medida_desc or ''} {desenho_desc or ''}".strip() or "Descrição não disponível"

    # Buscar Histórico de Apontamentos (Produção)
    historico = db.query(Apontamento, Setor.descricao, Setor.sequencia)\
        .join(Setor, Apontamento.id_setor == Setor.id)\
        .filter(Apontamento.id_pneu == p.id)\
        .order_by(Setor.sequencia).all()
    
    lista_hist = []
    for h, desc, seq in historico:
        h_dict = {c.name: getattr(h, c.name) for c in h.__table__.columns}
        h_dict["nome_setor"] = desc
        lista_hist.append(h_dict)
    
    p_dict["historico"] = lista_hist

    return p_dict

# --- COMPATIBILIDADE COM APP MOBILE (ROTAS DE CREDENCIAL) ---

from pydantic import BaseModel

class CredencialRequest(BaseModel):
    android_id: str
    id_setor: int

@router.post("/credencial")
def solicitar_credencial(
    req: CredencialRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint de compatibilidade para solicitação de credencial do App Mobile.
    """
    existente = db.query(Dispositivo).filter(Dispositivo.android_id == req.android_id).first()
    if existente:
        return existente
    
    novo = Dispositivo(android_id=req.android_id, id_setor=req.id_setor, autorizado=False)
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@router.get("/credencial/{android_id}")
def check_credencial(android_id: str, db: Session = Depends(get_db)):
    """
    Endpoint de compatibilidade para verificação de credencial do App Mobile.
    """
    return db.query(Dispositivo).filter(Dispositivo.android_id == android_id).first()
