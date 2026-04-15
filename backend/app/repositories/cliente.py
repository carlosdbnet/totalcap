from sqlalchemy.orm import Session
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate

class ClienteRepository:
    def get(self, db: Session, id: int) -> Cliente | None:
        return db.query(Cliente).filter(Cliente.id == id).first()

    def get_by_documento(self, db: Session, documento: str) -> Cliente | None:
        return db.query(Cliente).filter(Cliente.documento == documento).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> list[Cliente]:
        return db.query(Cliente).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: ClienteCreate) -> Cliente:
        db_obj = Cliente(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Cliente, obj_in: ClienteUpdate) -> Cliente:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: int) -> Cliente:
        obj = db.query(Cliente).get(id)
        db.delete(obj)
        db.commit()
        return obj

cliente_repo = ClienteRepository()
