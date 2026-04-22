from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.app.models.grupo_produto import GrupoProduto as GrupoProdutoModel
from backend.app.schemas.grupo_produto import GrupoProduto, GrupoProdutoCreate, GrupoProdutoUpdate

router = APIRouter()

@router.get("/", response_model=list[GrupoProduto])
def read_grupos_produto(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: str = ""
) -> Any:
    query = db.query(GrupoProdutoModel)
    if search:
        query = query.filter(GrupoProdutoModel.descricao.ilike(f"%{search}%"))
    return query.order_by(GrupoProdutoModel.descricao).offset(skip).limit(limit).all()

@router.post("/", response_model=GrupoProduto)
def create_grupo_produto(
    *,
    db: Session = Depends(get_db),
    grupo_produto_in: GrupoProdutoCreate
) -> Any:
    db_obj = GrupoProdutoModel(**grupo_produto_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=GrupoProduto)
def update_grupo_produto(
    *,
    db: Session = Depends(get_db),
    id: int,
    grupo_produto_in: GrupoProdutoUpdate
) -> Any:
    db_obj = db.query(GrupoProdutoModel).filter(GrupoProdutoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Grupo de produto não encontrado")
    
    update_data = grupo_produto_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}")
def delete_grupo_produto(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(GrupoProdutoModel).filter(GrupoProdutoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Grupo de produto não encontrado")
    db.delete(db_obj)
    db.commit()
    return {"status": "success", "message": "Grupo de produto removido com sucesso"}
