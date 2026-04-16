from sqlalchemy.orm import Session
from backend.app.models.atividade import Atividade
from backend.app.schemas.atividade import AtividadeCreate, AtividadeUpdate

class AtividadeRepository:
    def get(self, db: Session, id: int) -> Atividade | None:
        return db.query(Atividade).filter(Atividade.id == id).first()

    def get_by_codigo(self, db: Session, codigo: str) -> Atividade | None:
        return db.query(Atividade).filter(Atividade.codigo == codigo).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> list[Atividade]:
        return db.query(Atividade).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: AtividadeCreate) -> Atividade:
        db_obj = Atividade(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Atividade, obj_in: AtividadeUpdate) -> Atividade:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: int) -> Atividade:
        obj = db.query(Atividade).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

atividade_repo = AtividadeRepository()
