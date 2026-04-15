from sqlalchemy.orm import Session
from app.models.regiao import Regiao
from app.schemas.regiao import RegiaoCreate, RegiaoUpdate

class RegiaoRepository:
    def get(self, db: Session, id: int) -> Regiao | None:
        return db.query(Regiao).filter(Regiao.id == id).first()

    def get_by_codigo(self, db: Session, codigo: str) -> Regiao | None:
        return db.query(Regiao).filter(Regiao.codigo == codigo).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> list[Regiao]:
        return db.query(Regiao).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: RegiaoCreate) -> Regiao:
        db_obj = Regiao(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Regiao, obj_in: RegiaoUpdate) -> Regiao:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: int) -> Regiao:
        obj = db.query(Regiao).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

regiao_repo = RegiaoRepository()
