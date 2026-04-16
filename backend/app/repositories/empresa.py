from sqlalchemy.orm import Session
from app.models.empresa import Empresa
from app.schemas.empresa import EmpresaCreate, EmpresaUpdate

class EmpresaRepository:
    def get(self, db: Session, id: int) -> Empresa | None:
        return db.query(Empresa).filter(Empresa.id == id).first()

    def get_by_cnpj(self, db: Session, cnpj: str) -> Empresa | None:
        return db.query(Empresa).filter(Empresa.cnpj == cnpj).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> list[Empresa]:
        return db.query(Empresa).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: EmpresaCreate) -> Empresa:
        db_obj = Empresa(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Empresa, obj_in: EmpresaUpdate) -> Empresa:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: int) -> Empresa:
        obj = db.query(Empresa).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

empresa_repo = EmpresaRepository()
