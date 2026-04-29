from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.fatura_laudo import FaturaLaudo
from backend.app.models.laudo import Laudo
from backend.app.schemas.fatura_laudo import FaturaLaudoCreate, FaturaLaudoUpdate

class FaturaLaudoRepository:
    def get_by_fatura(self, db: Session, id_fatura: int):
        return db.query(
            FaturaLaudo, 
            Laudo.numlaudo, 
            Laudo.id_pneu, 
            Laudo.vrcredito, 
            Laudo.vrsaldo
        ).join(Laudo, FaturaLaudo.id_laudo == Laudo.id)\
         .filter(FaturaLaudo.id_fatura == id_fatura).all()

    def get(self, db: Session, id: int) -> FaturaLaudo | None:
        return db.query(FaturaLaudo).filter(FaturaLaudo.id == id).first()

    def exists(self, db: Session, id_fatura: int, id_laudo: int) -> bool:
        return db.query(FaturaLaudo).filter(
            FaturaLaudo.id_fatura == id_fatura,
            FaturaLaudo.id_laudo == id_laudo
        ).first() is not None

    def create(self, db: Session, obj_in: FaturaLaudoCreate) -> FaturaLaudo:
        db_obj = FaturaLaudo(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: FaturaLaudo, obj_in: FaturaLaudoUpdate) -> FaturaLaudo:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: int) -> FaturaLaudo | None:
        obj = self.get(db, id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

    def get_total_pago_laudo(self, db: Session, id_laudo: int) -> float:
        return db.query(func.sum(FaturaLaudo.valor)).filter(FaturaLaudo.id_laudo == id_laudo).scalar() or 0

fatura_laudo_repo = FaturaLaudoRepository()
