from sqlalchemy.orm import Session
from backend.app.repositories.atividade import atividade_repo
from backend.app.schemas.atividade import AtividadeCreate, AtividadeUpdate
from fastapi import HTTPException

class AtividadeService:
    def get_atividades(self, db: Session, skip: int = 0, limit: int = 100):
        return atividade_repo.get_multi(db, skip=skip, limit=limit)

    def create_atividade(self, db: Session, atividade_in: AtividadeCreate):
        atividade_existente = atividade_repo.get_by_codigo(db, codigo=atividade_in.codigo)
        if atividade_existente:
            raise HTTPException(status_code=400, detail="Já existe uma atividade cadastrada com este código.")
        return atividade_repo.create(db, obj_in=atividade_in)

    def update_atividade(self, db: Session, atividade_id: int, atividade_in: AtividadeUpdate):
        atividade = atividade_repo.get(db, id=atividade_id)
        if not atividade:
            raise HTTPException(status_code=404, detail="Atividade não encontrada")
        
        if atividade_in.codigo and atividade_in.codigo != atividade.codigo:
            atividade_existente = atividade_repo.get_by_codigo(db, codigo=atividade_in.codigo)
            if atividade_existente:
                raise HTTPException(status_code=400, detail="Este código já está em uso por outra atividade.")
                
        return atividade_repo.update(db, db_obj=atividade, obj_in=atividade_in)

    def delete_atividade(self, db: Session, atividade_id: int):
        atividade = atividade_repo.get(db, id=atividade_id)
        if not atividade:
            raise HTTPException(status_code=404, detail="Atividade não encontrada")
        return atividade_repo.remove(db, id=atividade_id)

atividade_service = AtividadeService()
