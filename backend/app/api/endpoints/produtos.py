from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.app.models.produto import Produto as ProdutoModel
from backend.app.schemas.produto import Produto, ProdutoCreate, ProdutoUpdate

router = APIRouter()

@router.get("/", response_model=list[Produto])
def read_produtos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 500,
    search: str = ""
) -> Any:
    query = db.query(ProdutoModel).options(joinedload(ProdutoModel.grupo))
    if search:
        query = query.filter(ProdutoModel.descricao.ilike(f"%{search}%"))
    return query.order_by(ProdutoModel.descricao).offset(skip).limit(limit).all()

@router.post("/", response_model=Produto)
def create_produto(
    *,
    db: Session = Depends(get_db),
    produto_in: ProdutoCreate
) -> Any:
    db_obj = ProdutoModel(**produto_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=Produto)
def update_produto(
    *,
    db: Session = Depends(get_db),
    id: int,
    produto_in: ProdutoUpdate
) -> Any:
    db_obj = db.query(ProdutoModel).filter(ProdutoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    update_data = produto_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}")
def delete_produto(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(ProdutoModel).filter(ProdutoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    db.delete(db_obj)
    db.commit()
    return {"status": "success", "message": "Produto removido com sucesso"}
