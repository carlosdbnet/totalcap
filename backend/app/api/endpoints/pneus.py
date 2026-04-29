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
        # Criar dicionário de retorno de forma segura (mapeando nomes do modelo)
        p_dict = {
            "id": p.id,
            "id_ordem": p.id_ordem,
            "id_empresa": p.id_empresa,
            "id_contato": p.id_contato,
            "id_medida": p.id_medida,
            "id_produto": p.id_marca, # Mapeia id_marca para id_produto (que o mobile espera)
            "id_desenho": p.id_desenho,
            "id_recap": p.id_recap,
            "id_servico": p.id_servico,
            "id_vendedor": p.id_vendedor,
            "codbarra": p.codbarra,
            "numserie": p.numserie,
            "numfogo": p.numfogo,
            "dot": p.dot,
            "statuspro": p.statuspro,
            "statusfat": p.statusfat,
            "placa": p.placa
        }
        p_dict["numos"] = numos
        p_dict["nome_cliente"] = razaosocial
        pneus.append(p_dict)
    return pneus

@router.get("/buscar/", response_model=PneuSchema)
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
    
    # Criar dicionário de retorno de forma segura (mapeando nomes do modelo)
    p_dict = {
        "id": p.id,
        "id_ordem": p.id_ordem,
        "id_empresa": p.id_empresa,
        "id_contato": p.id_contato,
        "id_medida": p.id_medida,
        "id_produto": p.id_marca, # Mapeia id_marca para id_produto (que o mobile espera)
        "id_desenho": p.id_desenho,
        "id_recap": p.id_recap,
        "id_servico": p.id_servico,
        "id_vendedor": p.id_vendedor,
        "codbarra": p.codbarra,
        "numserie": p.numserie,
        "numfogo": p.numfogo,
        "dot": p.dot,
        "statuspro": p.statuspro,
        "statusfat": p.statusfat,
        "placa": p.placa
    }
    p_dict["numos"] = numos
    p_dict["nome_cliente"] = str(razaosocial) if razaosocial else "Sem nome cadastrado"
    p_dict["dataentrada"] = dataentrada.isoformat() if dataentrada else None
    p_dict["vrtotal_os"] = float(vrtotal_os) if vrtotal_os else 0.0
    p_dict["produto_desc"] = str(f"{medida_desc or ''} {desenho_desc or ''}").strip() or "Descrição não disponível"

    # Buscar Histórico de Apontamentos (Produção)
    try:
        historico = db.query(Apontamento, Setor.descricao, Setor.sequencia)\
            .join(Setor, Apontamento.id_setor == Setor.id)\
            .filter(Apontamento.id_pneu == p.id)\
            .order_by(Setor.sequencia).all()
        
        lista_hist = []
        for h, desc, seq in historico:
            # Serialização manual para evitar problemas com tipos complexos
            h_dict = {
                "id": h.id,
                "id_pneu": h.id_pneu,
                "id_setor": h.id_setor,
                "id_operador": h.id_operador,
                "status": h.status,
                "inicio": h.inicio.isoformat() if h.inicio else None,
                "termino": h.termino.isoformat() if h.termino else None,
                "tempo": float(h.tempo) if h.tempo else 0.0,
                "nome_setor": str(desc)
            }
            lista_hist.append(h_dict)
        
        p_dict["historico"] = lista_hist
    except Exception as e:
        print(f"Erro ao buscar historico: {e}")
        p_dict["historico"] = []

    print(f"Pneu encontrado: {p.codbarra} - Cliente: {p_dict['nome_cliente']}")
    return p_dict
