from sqlalchemy.orm import Session
from app.repositories.cliente import cliente_repo
from app.schemas.cliente import ClienteCreate, ClienteUpdate
from fastapi import HTTPException

class ClienteService:
    def get_clientes(self, db: Session, skip: int = 0, limit: int = 100):
        return cliente_repo.get_multi(db, skip=skip, limit=limit)

    def create_cliente(self, db: Session, cliente_in: ClienteCreate):
        cliente_existente = cliente_repo.get_by_documento(db, documento=cliente_in.documento)
        if cliente_existente:
            raise HTTPException(status_code=400, detail="Documento já registrado.")
        return cliente_repo.create(db, obj_in=cliente_in)

    def update_cliente(self, db: Session, cliente_id: int, cliente_in: ClienteUpdate):
        cliente = cliente_repo.get(db, id=cliente_id)
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente não encontrado")
        return cliente_repo.update(db, db_obj=cliente, obj_in=cliente_in)

cliente_service = ClienteService()
