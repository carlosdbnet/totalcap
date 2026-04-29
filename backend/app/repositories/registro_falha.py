from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models.registro_falha import RegistroFalha
from backend.app.models.setor import Setor
from backend.app.models.operador import Operador
from backend.app.models.falha import Falha
from backend.app.models.ordem_servico import OSPneu
from backend.app.schemas.registro_falha import RegistroFalhaCreate

class RegistroFalhaRepository:
    def get_multi_with_names(self, db: Session, skip: int = 0, limit: int = 100):
        query = db.query(
            RegistroFalha,
            Setor.descricao.label("setor_nome"),
            Operador.nome.label("operador_nome"),
            Falha.descricao.label("falha_nome"),
            OSPneu.numserie.label("numserie")
        ).outerjoin(Setor, RegistroFalha.id_setor == Setor.id)\
         .outerjoin(Operador, RegistroFalha.id_operador == Operador.id)\
         .outerjoin(Falha, RegistroFalha.id_falha == Falha.id)\
         .outerjoin(OSPneu, RegistroFalha.id_pneu == OSPneu.id)\
         .order_by(desc(RegistroFalha.data))
         
        results = query.offset(skip).limit(limit).all()
        
        final_results = []
        for reg, setor_nome, op_nome, falha_nome, numserie in results:
            reg_dict = {
                "id": reg.id,
                "id_setor": reg.id_setor,
                "id_operador": reg.id_operador,
                "id_falha": reg.id_falha,
                "id_pneu": reg.id_pneu,
                "data": reg.data,
                "obs": reg.obs,
                "setor_nome": setor_nome,
                "operador_nome": op_nome,
                "falha_nome": falha_nome,
                "numserie": numserie
            }
            final_results.append(reg_dict)
            
        return final_results

    def create(self, db: Session, obj_in: RegistroFalhaCreate) -> RegistroFalha:
        db_obj = RegistroFalha(
            id_setor=obj_in.id_setor,
            id_operador=obj_in.id_operador,
            id_falha=obj_in.id_falha,
            id_pneu=obj_in.id_pneu,
            obs=obj_in.obs
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: int) -> RegistroFalha | None:
        obj = db.query(RegistroFalha).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

registro_falha_repo = RegistroFalhaRepository()
