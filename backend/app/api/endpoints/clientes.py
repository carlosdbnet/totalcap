from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.app.models.cliente import Cliente as ClienteModel
from backend.app.models.contato import Contato as ContatoModel, ContatoEndereco, ContatoEmail, ContatoInfo
from backend.app.schemas.contato import Cliente, ClienteCreate, ClienteUpdate

router = APIRouter()

@router.get("/", response_model=List[Cliente])
def read_clientes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    return db.query(ClienteModel).options(
        joinedload(ClienteModel.contato).joinedload(ContatoModel.enderecos),
        joinedload(ClienteModel.contato).joinedload(ContatoModel.emails),
        joinedload(ClienteModel.contato).joinedload(ContatoModel.infos)
    ).offset(skip).limit(limit).all()

@router.post("/", response_model=Cliente)
def create_cliente(
    *,
    db: Session = Depends(get_db),
    cliente_in: ClienteCreate
) -> Any:
    # 1. Create Contato if provided
    contato_id = None
    if cliente_in.contato:
        contato_data = cliente_in.contato.dict(exclude={'enderecos', 'emails', 'infos'})
        db_contato = ContatoModel(**contato_data)
        
        # Add details
        for addr in cliente_in.contato.enderecos:
            db_contato.enderecos.append(ContatoEndereco(**addr.dict()))
        for mail in cliente_in.contato.emails:
            db_contato.emails.append(ContatoEmail(**mail.dict()))
        for info in cliente_in.contato.infos:
            db_contato.infos.append(ContatoInfo(**info.dict()))
            
        db.add(db_contato)
        db.flush() # Get ID
        contato_id = db_contato.id
    
    # 2. Create Cliente
    db_obj = ClienteModel(
        nome=cliente_in.nome,
        documento=cliente_in.documento,
        email=cliente_in.email,
        telefone=cliente_in.telefone,
        ativo=cliente_in.ativo,
        id_contato=contato_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Reload with all relationships
    return db.query(ClienteModel).options(
        joinedload(ClienteModel.contato).joinedload(ContatoModel.enderecos),
        joinedload(ClienteModel.contato).joinedload(ContatoModel.emails),
        joinedload(ClienteModel.contato).joinedload(ContatoModel.infos)
    ).filter(ClienteModel.id == db_obj.id).first()

@router.put("/{id}", response_model=Cliente)
def update_cliente(
    *,
    db: Session = Depends(get_db),
    id: int,
    cliente_in: ClienteUpdate
) -> Any:
    db_obj = db.query(ClienteModel).filter(ClienteModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    # Update main Cliente fields
    update_data = cliente_in.dict(exclude_unset=True, exclude={'contato'})
    for field in update_data:
        setattr(db_obj, field, update_data[field])
        
    # Update Contato if provided
    if cliente_in.contato:
        if not db_obj.contato:
            # Create new if doesn't exist
            contato_data = cliente_in.contato.dict(exclude={'enderecos', 'emails', 'infos'})
            db_contato = ContatoModel(**contato_data)
            db_obj.contato = db_contato
        else:
            # Update existing
            contato_update = cliente_in.contato.dict(exclude_unset=True, exclude={'enderecos', 'emails', 'infos'})
            for field in contato_update:
                setattr(db_obj.contato, field, contato_update[field])
        
        # Sync details (Simple approach: clear and recreat for updates in this specific complex case)
        if cliente_in.contato.enderecos is not None:
            db_obj.contato.enderecos = [ContatoEndereco(**addr.dict()) for addr in cliente_in.contato.enderecos]
        if cliente_in.contato.emails is not None:
            db_obj.contato.emails = [ContatoEmail(**mail.dict()) for mail in cliente_in.contato.emails]
        if cliente_in.contato.infos is not None:
            db_obj.contato.infos = [ContatoInfo(**info.dict()) for info in cliente_in.contato.infos]

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db.query(ClienteModel).options(
        joinedload(ClienteModel.contato).joinedload(ContatoModel.enderecos),
        joinedload(ClienteModel.contato).joinedload(ContatoModel.emails),
        joinedload(ClienteModel.contato).joinedload(ContatoModel.infos)
    ).filter(ClienteModel.id == db_obj.id).first()

@router.delete("/{id}", response_model=Cliente)
def delete_cliente(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    db_obj = db.query(ClienteModel).filter(ClienteModel.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
        
    # Cascade delete is handled by SQLAlchemy relationship or DB FKs
    db.delete(db_obj)
    db.commit()
    return db_obj
