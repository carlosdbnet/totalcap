from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from typing import List, Any
from backend.database import get_db
from backend.app.models.orcamento import Orcamento, OrcamentoItem
from backend.app.schemas.orcamento import OrcamentoCreate, OrcamentoRead, OrcamentoUpdate

router = APIRouter()

@router.get("/", response_model=List[OrcamentoRead])
def read_orcamentos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Lista orçamentos com paginação.
    """
    query = db.query(Orcamento).options(
        joinedload(Orcamento.cli_contato),
        joinedload(Orcamento.vendedor),
        joinedload(Orcamento.items)
    )
    
    orcamentos = query.order_by(Orcamento.datamov.desc()).offset(skip).limit(limit).all()
    
    for o in orcamentos:
        if o.cli_contato: o.contato_nome = o.cli_contato.nome
        if o.vendedor: o.vendedor_nome = o.vendedor.nome
    
    return orcamentos

@router.post("/", response_model=OrcamentoRead)
def create_orcamento(obj_in: OrcamentoCreate, db: Session = Depends(get_db)) -> Any:
    """
    Cria um novo orçamento com seus itens (ID Manual para DB Legado).
    """
    # 1. Gerar ID para o Orçamento
    max_id = db.execute(text("SELECT COALESCE(MAX(id), 0) FROM orcamento")).scalar()
    new_id = (max_id or 0) + 1
    
    data = obj_in.dict(exclude={"items"})
    db_obj = Orcamento(**data, id=new_id)
    db.add(db_obj)
    db.flush()
    
    # 2. Gerar IDs para os itens
    max_item_id = db.execute(text("SELECT COALESCE(MAX(id), 0) FROM orcamentoitem")).scalar()
    curr_item_id = (max_item_id or 0) + 1
    
    for item_in in obj_in.items:
        db_item = OrcamentoItem(**item_in.dict(), id=curr_item_id, id_orcam=db_obj.id)
        db.add(db_item)
        curr_item_id += 1
    
    db.commit()
    db.refresh(db_obj)

    if db_obj.cli_contato: db_obj.contato_nome = db_obj.cli_contato.nome
    if db_obj.vendedor: db_obj.vendedor_nome = db_obj.vendedor.nome
    return db_obj

@router.put("/{id}", response_model=OrcamentoRead)
def update_orcamento(id: int, obj_in: OrcamentoUpdate, db: Session = Depends(get_db)) -> Any:
    """
    Atualiza um orçamento.
    """
    db_obj = db.query(Orcamento).filter(Orcamento.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    update_data = obj_in.dict(exclude={"items"}, exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    if obj_in.items is not None:
        # Remover itens atuais
        db.query(OrcamentoItem).filter(OrcamentoItem.id_orcam == id).delete()
        
        # Inserir novos com novos IDs
        max_item_id = db.execute(text("SELECT COALESCE(MAX(id), 0) FROM orcamentoitem")).scalar()
        curr_item_id = (max_item_id or 0) + 1
        
        for item_in in obj_in.items:
            db_item = OrcamentoItem(**item_in.dict(), id=curr_item_id, id_orcam=id)
            db.add(db_item)
            curr_item_id += 1
            
    db.commit()
    db.refresh(db_obj)

    if db_obj.cli_contato: db_obj.contato_nome = db_obj.cli_contato.nome
    if db_obj.vendedor: db_obj.vendedor_nome = db_obj.vendedor.nome
    return db_obj

@router.get("/{id}", response_model=OrcamentoRead)
def read_orcamento(id: int, db: Session = Depends(get_db)) -> Any:
    """
    Retorna um orçamento específico.
    """
    db_obj = db.query(Orcamento).options(
        joinedload(Orcamento.cli_contato),
        joinedload(Orcamento.vendedor),
        joinedload(Orcamento.items)
    ).filter(Orcamento.id == id).first()
    
    if not db_obj:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    if db_obj.cli_contato: db_obj.contato_nome = db_obj.cli_contato.nome
    if db_obj.vendedor: db_obj.vendedor_nome = db_obj.vendedor.nome
    return db_obj

@router.delete("/{id}")
def delete_orcamento(id: int, db: Session = Depends(get_db)) -> Any:
    """
    Exclui um orçamento.
    """
    db_obj = db.query(Orcamento).filter(Orcamento.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    db.delete(db_obj)
    db.commit()
    return {"status": "success", "message": "Orçamento excluído"}
