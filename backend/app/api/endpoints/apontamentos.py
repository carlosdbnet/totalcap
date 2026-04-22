from typing import Any, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.models.apontamento import Apontamento
from backend.app.models.setor import Setor
from backend.app.models.operador import Operador
from backend.app.schemas.apontamento import ApontamentoResponse

router = APIRouter()

@router.get("/", response_model=List[ApontamentoResponse])
def get_apontamentos(
    id_pneu: Optional[int] = None,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 200,
) -> Any:
    """
    Retorna a lista de apontamentos (histórico de produção).
    Permite filtrar por id_pneu para exibição na tela de Localização.
    """
    query = db.query(
        Apontamento, 
        Setor.descricao.label("desc_setor"),
        Operador.nome.label("nome_operador")
    ).outerjoin(Setor, Apontamento.id_setor == Setor.id)\
     .outerjoin(Operador, Apontamento.id_operador == Operador.id)

    if id_pneu:
        query = query.filter(Apontamento.id_pneu == id_pneu)

    # Ordenar por data de lançamento decrescente para ver o trajeto mais recente primeiro
    results = query.order_by(Apontamento.datalan.desc()).offset(skip).limit(limit).all()

    resp = []
    for a, desc_setor, nome_operador in results:
        # Usamos from_orm (ou model_validate no Pydantic v2) e injetamos os campos do join
        data = ApontamentoResponse.model_validate(a)
        data.desc_setor = desc_setor
        data.nome_operador = nome_operador
        resp.append(data)
    
    return resp
