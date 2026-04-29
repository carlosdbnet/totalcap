from sqlalchemy.orm import Session
from backend.app.repositories.fatura_laudo import fatura_laudo_repo
from backend.app.models.laudo import Laudo
from backend.app.schemas.fatura_laudo import FaturaLaudoCreate, FaturaLaudoUpdate
from fastapi import HTTPException

class FaturaLaudoService:
    def get_by_fatura(self, db: Session, id_fatura: int):
        results = fatura_laudo_repo.get_by_fatura(db, id_fatura)
        final_results = []
        for fl, numlaudo, pneu_id, vrcredito, vrsaldo in results:
            item = {
                "id": fl.id,
                "id_fatura": fl.id_fatura,
                "id_laudo": fl.id_laudo,
                "valor": fl.valor,
                "datalan": fl.datalan,
                "userlan": fl.userlan,
                "numlaudo": numlaudo,
                "pneu_id": pneu_id,
                "vrcredito": vrcredito,
                "vrsaldo": vrsaldo
            }
            final_results.append(item)
        return final_results

    def recalculate_laudo_balance(self, db: Session, id_laudo: int):
        laudo = db.query(Laudo).filter(Laudo.id == id_laudo).first()
        if not laudo:
            return None
        
        total_pago = fatura_laudo_repo.get_total_pago_laudo(db, id_laudo)
        laudo.vrpago = total_pago
        laudo.vrsaldo = (laudo.vrcredito or 0) - total_pago
        
        db.add(laudo)
        db.commit()
        db.refresh(laudo)
        return laudo

    def create_link(self, db: Session, obj_in: FaturaLaudoCreate):
        if fatura_laudo_repo.exists(db, obj_in.id_fatura, obj_in.id_laudo):
            raise HTTPException(status_code=400, detail="Este laudo já está vinculado a esta fatura.")
            
        laudo = db.query(Laudo).filter(Laudo.id == obj_in.id_laudo).first()
        if not laudo:
            raise HTTPException(status_code=404, detail="Laudo não encontrado")
            
        db_item = fatura_laudo_repo.create(db, obj_in)
        self.recalculate_laudo_balance(db, obj_in.id_laudo)
        return db_item

    def update_link(self, db: Session, id: int, obj_in: FaturaLaudoUpdate):
        db_item = fatura_laudo_repo.get(db, id)
        if not db_item:
            raise HTTPException(status_code=404, detail="Vínculo não encontrado")
            
        updated_item = fatura_laudo_repo.update(db, db_item, obj_in)
        self.recalculate_laudo_balance(db, updated_item.id_laudo)
        return updated_item

    def remove_link(self, db: Session, id: int):
        db_item = fatura_laudo_repo.get(db, id)
        if not db_item:
            raise HTTPException(status_code=404, detail="Vínculo não encontrado")
            
        id_laudo = db_item.id_laudo
        fatura_laudo_repo.remove(db, id)
        self.recalculate_laudo_balance(db, id_laudo)
        return True

fatura_laudo_service = FaturaLaudoService()
