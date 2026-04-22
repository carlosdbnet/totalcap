from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.app.models.ordem_servico import OSPneu, OrdemServico
from backend.app.models.veiculo import Veiculo

router = APIRouter()

@router.get("/veiculos")
def get_veiculos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 500,
) -> Any:
    """Retorna lista de veículos ativos."""
    return db.query(Veiculo).filter(Veiculo.ativo == True).offset(skip).limit(limit).all()

@router.get("/pneus")
def get_pneus_localizacao(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 200,
) -> Any:
    """Retorna pneus com dados da OS, vendedor e cliente para localização."""
    pneus = (
        db.query(OSPneu)
        .join(OrdemServico, OSPneu.id_ordem == OrdemServico.id)
        .options(
            joinedload(OSPneu.os).joinedload(OrdemServico.contato),
            joinedload(OSPneu.os).joinedload(OrdemServico.vendedor),
            joinedload(OSPneu.medida),
            joinedload(OSPneu.produto),
            joinedload(OSPneu.desenho),
            joinedload(OSPneu.servico),
        )
        .order_by(OSPneu.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for p in pneus:
        os_obj = p.os
        result.append({
            "id": p.id,
            "numserie": p.numserie or "",
            "dot": p.dot or "",
            "valor": float(p.valor) if p.valor else 0,
            "statuspro": "Sim" if p.statuspro else "Não",
            "statusfat": "Sim" if p.statusfat else "Não",
            "obs": p.obs or "",
            "datalan": str(p.datalan) if p.datalan else "",
            "medida": p.medida.descricao if p.medida else "",
            "marca": p.produto.descricao if p.produto else "",
            "desenho": p.desenho.descricao if p.desenho else "",
            "servico": p.servico.descricao if p.servico else "",
            "numos": os_obj.numos if os_obj else "",
            "id_os": os_obj.id if os_obj else None,
            "vendedor": os_obj.vendedor.nome if os_obj and os_obj.vendedor else "",
            "cliente": os_obj.contato.nome if os_obj and os_obj.contato else "",
        })

    return result

@router.get("/pneu/{pneu_id}")
def get_pneu_by_id(
    pneu_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """Retorna detalhes de um pneu específico pelo ID para validação na localização."""
    p = (
        db.query(OSPneu)
        .outerjoin(OrdemServico, OSPneu.id_ordem == OrdemServico.id)
        .options(
            joinedload(OSPneu.os).joinedload(OrdemServico.contato),
            joinedload(OSPneu.os).joinedload(OrdemServico.vendedor),
            joinedload(OSPneu.medida),
            joinedload(OSPneu.produto),
            joinedload(OSPneu.desenho),
            joinedload(OSPneu.tiporecap),
        )
        .filter(OSPneu.id == pneu_id)
        .first()
    )

    if not p:
        return None

    os_obj = p.os
    return {
        "id": p.id,
        "numserie": p.numserie or "",
        "numfogo": p.numfogo or "",
        "dot": p.dot or "",
        "datalan": p.datalan.strftime("%d/%m/%Y %H:%M") if p.datalan else "",
        "medida": p.medida.descricao if p.medida else "Sem Medida",
        "marca": p.produto.descricao if p.produto else "Sem Marca",
        "desenho": p.desenho.descricao if p.desenho else "Sem Desenho",
        "tiporecap": p.tiporecap.descricao if p.tiporecap else "Sem Recapagem",
        "statuspro": "Sim" if p.statuspro else "Não",
        "statusfat": "Sim" if p.statusfat else "Não",
        "numos": os_obj.numos if os_obj else "S/OS",
        "vendedor": os_obj.vendedor.nome if os_obj and os_obj.vendedor else "S/Vendedor",
        "cliente": os_obj.contato.nome if os_obj and os_obj.contato else "S/Cliente",
    }
