from sqlalchemy.orm import Session, joinedload
from app.models.vendedor import Vendedor
from app.schemas.vendedor import VendedorCreate, VendedorUpdate

class VendedorRepository:
    def get(self, db: Session, id: int) -> Vendedor | None:
        return db.query(Vendedor).options(
            joinedload(Vendedor.area),
            joinedload(Vendedor.regiao)
        ).filter(Vendedor.id == id).first()

    def get_by_codigo(self, db: Session, codigo: str) -> Vendedor | None:
        return db.query(Vendedor).filter(Vendedor.codigo == codigo).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> list[Vendedor]:
        return db.query(Vendedor).options(
            joinedload(Vendedor.area),
            joinedload(Vendedor.regiao)
        ).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: VendedorCreate) -> Vendedor:
        db_obj = Vendedor(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return self.get(db, db_obj.id) # Re-fetch with relationships

    def update(self, db: Session, db_obj: Vendedor, obj_in: VendedorUpdate) -> Vendedor:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return self.get(db, db_obj.id)

    def remove(self, db: Session, id: int) -> Vendedor:
        obj = db.query(Vendedor).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

vendedor_repo = VendedorRepository()
