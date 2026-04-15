from sqlalchemy.orm import Session
from app.models.area import Area
from app.schemas.area import AreaCreate, AreaUpdate

class AreaRepository:
    def get(self, db: Session, id: int) -> Area | None:
        return db.query(Area).filter(Area.id == id).first()

    def get_by_nome(self, db: Session, nome: str) -> Area | None:
        return db.query(Area).filter(Area.nome == nome).first()

    def get_by_codigo(self, db: Session, codigo: str) -> Area | None:
        return db.query(Area).filter(Area.codigo == codigo).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> list[Area]:
        return db.query(Area).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: AreaCreate) -> Area:
        db_obj = Area(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Area, obj_in: AreaUpdate) -> Area:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: int) -> Area:
        obj = db.query(Area).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

area_repo = AreaRepository()
