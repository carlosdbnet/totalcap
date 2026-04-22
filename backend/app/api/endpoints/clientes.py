from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.app.models.contato import Contato as ContatoModel, ContatoEndereco, ContatoEmail, ContatoInfo
from backend.app.schemas.contato import Contato as ContatoSchema, ContatoCreate, ContatoUpdate

router = APIRouter()

@router.get("/", response_model=List[ContatoSchema])
def read_clientes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    # Retorna contatos que são marcados como clientes
    contatos = db.query(ContatoModel).options(
        joinedload(ContatoModel.enderecos),
        joinedload(ContatoModel.emails),
        joinedload(ContatoModel.infos)
    ).filter(ContatoModel.flagcliente == True).offset(skip).limit(limit).all()
    print(f"Encontrados {len(contatos)} clientes (contatos)")
    return contatos

@router.post("/", response_model=ContatoSchema)
def create_cliente(
    *,
    db: Session = Depends(get_db),
    cliente_in: ContatoCreate
) -> Any:
    contato_data = cliente_in.dict(exclude={'enderecos', 'emails', 'infos'})
    db_obj = ContatoModel(**contato_data)
    
    # Add details
    if cliente_in.enderecos:
        for addr in cliente_in.enderecos:
            db_obj.enderecos.append(ContatoEndereco(**addr.dict()))
    if cliente_in.emails:
        for mail in cliente_in.emails:
            db_obj.emails.append(ContatoEmail(**mail.dict()))
    if cliente_in.infos:
        for info in cliente_in.infos:
            db_obj.infos.append(ContatoInfo(**info.dict()))
            
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=ContatoSchema)
def update_cliente(
    *,
    db: Session = Depends(get_db),
    id: int,
    cliente_in: ContatoUpdate
) -> Any:
    db_obj = db.query(ContatoModel).filter(ContatoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
        
    # Update main Contato fields
    update_data = cliente_in.dict(exclude_unset=True, exclude={'enderecos', 'emails', 'infos'})
    for field in update_data:
        setattr(db_obj, field, update_data[field])
        
    # Sync details
    if cliente_in.enderecos is not None:
        db_obj.enderecos = [ContatoEndereco(**addr.dict()) for addr in cliente_in.enderecos]
    if cliente_in.emails is not None:
        db_obj.emails = [ContatoEmail(**mail.dict()) for mail in cliente_in.emails]
    if cliente_in.infos is not None:
        db_obj.infos = [ContatoInfo(**info.dict()) for info in cliente_in.infos]

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{id}", response_model=ContatoSchema)
def delete_cliente(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(ContatoModel).filter(ContatoModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Contato não encontrado")
        
    db.delete(db_obj)
    db.commit()
    return db_obj
