from typing import Any, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.models.apontamento import Apontamento
from backend.app.models.setor import Setor
from backend.app.models.operador import Operador
from backend.app.schemas.apontamento import ApontamentoResponse, ApontamentoCreate, ApontamentoUpdate

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
        data = ApontamentoResponse.model_validate(a)
        data.desc_setor = desc_setor
        data.nome_operador = nome_operador
        resp.append(data)
    
    return resp

@router.get("/buscar/")
def buscar_apontamento_existente(
    id_pneu: int,
    id_setor: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    Busca se já existe um apontamento para o pneu e setor específicos.
    Usado pelo App Mobile para evitar duplicidade ou carregar dados existentes.
    """
    result = db.query(Apontamento).filter(
        Apontamento.id_pneu == id_pneu,
        Apontamento.id_setor == id_setor
    ).first()
    if not result:
        return None
    return ApontamentoResponse.model_validate(result)

@router.get("/relatorio")
def get_relatorio_produtividade(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    id_setor: Optional[int] = None,
    id_operador: Optional[int] = None,
    db: Session = Depends(get_db)
) -> Any:
    """
    Retorna dados consolidados para o relatório de produtividade.
    """
    from backend.app.models.ordem_servico import OSPneu, OrdemServico

    query = db.query(
        Apontamento.id,
        Apontamento.inicio,
        Apontamento.termino,
        Apontamento.tempo,
        Setor.descricao.label("setor_nome"),
        Operador.nome.label("operador_nome"),
        OSPneu.numserie,
        OSPneu.numfogo,
        OrdemServico.numos
    ).join(Setor, Apontamento.id_setor == Setor.id)\
     .join(Operador, Apontamento.id_operador == Operador.id)\
     .join(OSPneu, Apontamento.id_pneu == OSPneu.id)\
     .join(OrdemServico, OSPneu.id_ordem == OrdemServico.id)

    if start_date:
        query = query.filter(Apontamento.datalan >= start_date)
    if end_date:
        query = query.filter(Apontamento.datalan <= end_date + " 23:59:59")
    if id_setor:
        query = query.filter(Apontamento.id_setor == id_setor)
    if id_operador:
        query = query.filter(Apontamento.id_operador == id_operador)

    results = query.order_by(Apontamento.datalan.desc()).all()

    return [
        {
            "id": r.id,
            "inicio": r.inicio.isoformat() if r.inicio else None,
            "termino": r.termino.isoformat() if r.termino else None,
            "tempo": float(r.tempo) if r.tempo else 0,
            "setor_nome": r.setor_nome,
            "operador_nome": r.operador_nome,
            "numserie": r.numserie,
            "numfogo": r.numfogo,
            "numos": r.numos
        }
        for r in results
    ]

@router.get("/pneu-by-barcode/{barcode}")
def get_pneu_by_barcode(barcode: str, db: Session = Depends(get_db)) -> Any:
    """
    Busca os dados do pneu e OS através do código de barras.
    """
    from backend.app.models.ordem_servico import OSPneu, OrdemServico
    from backend.app.models.contato import Contato
    from backend.app.models.medida import Medida
    from backend.app.models.desenho import Desenho

    result = db.query(
        OSPneu.id,
        OSPneu.numserie,
        OSPneu.numfogo,
        OrdemServico.numos,
        Contato.nome.label("cliente_nome"),
        Medida.descricao.label("medida_desc"),
        Desenho.descricao.label("desenho_desc")
    ).join(OrdemServico, OSPneu.id_ordem == OrdemServico.id)\
     .join(Contato, OrdemServico.id_contato == Contato.id)\
     .outerjoin(Medida, OSPneu.id_medida == Medida.id)\
     .outerjoin(Desenho, OSPneu.id_desenho == Desenho.id)\
     .filter(OSPneu.codbarra == barcode).first()

    if not result:
        result = db.query(
            OSPneu.id,
            OSPneu.numserie,
            OSPneu.numfogo,
            OrdemServico.numos,
            Contato.nome.label("cliente_nome"),
            Medida.descricao.label("medida_desc"),
            Desenho.descricao.label("desenho_desc")
        ).join(OrdemServico, OSPneu.id_ordem == OrdemServico.id)\
         .join(Contato, OrdemServico.id_contato == Contato.id)\
         .outerjoin(Medida, OSPneu.id_medida == Medida.id)\
         .outerjoin(Desenho, OSPneu.id_desenho == Desenho.id)\
         .filter(OSPneu.numfogo == barcode).first()

    if not result:
        return {"error": "Pneu não localizado com este código."}

    return {
        "id": result.id,
        "numserie": result.numserie,
        "numfogo": result.numfogo,
        "numos": result.numos,
        "cliente": result.cliente_nome,
        "medida": result.medida_desc,
        "desenho": result.desenho_desc
    }

@router.post("/", response_model=ApontamentoResponse)
def create_apontamento(obj_in: ApontamentoCreate, db: Session = Depends(get_db)) -> Any:
    db_obj = Apontamento(
        id_pneu=obj_in.id_pneu,
        id_setor=obj_in.id_setor,
        id_operador=obj_in.id_operador,
        id_retrabalho=0,
        inicio=obj_in.inicio,
        termino=obj_in.termino,
        tempo=obj_in.tempo,
        obs=obj_in.obs,
        codbarra=obj_in.codbarra,
        status=obj_in.status or 'F'
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return ApontamentoResponse.model_validate(db_obj)

@router.put("/{id}/", response_model=ApontamentoResponse)
def update_apontamento(id: int, obj_in: ApontamentoUpdate, db: Session = Depends(get_db)) -> Any:
    db_obj = db.query(Apontamento).filter(Apontamento.id == id).first()
    if not db_obj:
        return {"error": "Apontamento não localizado."}
    
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return ApontamentoResponse.model_validate(db_obj)

@router.delete("/{id}")
def delete_apontamento(id: int, db: Session = Depends(get_db)) -> Any:
    db_obj = db.query(Apontamento).filter(Apontamento.id == id).first()
    if not db_obj:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Apontamento não localizado.")

    db.delete(db_obj)
    db.commit()
    return {"success": True}
