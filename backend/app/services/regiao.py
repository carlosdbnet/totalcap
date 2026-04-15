from sqlalchemy.orm import Session
from app.repositories.regiao import regiao_repo
from app.schemas.regiao import RegiaoCreate, RegiaoUpdate
from fastapi import HTTPException

class RegiaoService:
    def get_regioes(self, db: Session, skip: int = 0, limit: int = 100):
        return regiao_repo.get_multi(db, skip=skip, limit=limit)

    def create_regiao(self, db: Session, regiao_in: RegiaoCreate):
        regiao_existente = regiao_repo.get_by_codigo(db, codigo=regiao_in.codigo)
        if regiao_existente:
            raise HTTPException(status_code=400, detail="Já existe uma região cadastrada com este código.")
        return regiao_repo.create(db, obj_in=regiao_in)

    def update_regiao(self, db: Session, regiao_id: int, regiao_in: RegiaoUpdate):
        regiao = regiao_repo.get(db, id=regiao_id)
        if not regiao:
            raise HTTPException(status_code=404, detail="Região não encontrada")
        
        # Se mudar o codigo, verifica se o novo codigo ja existe
        if regiao_in.codigo and regiao_in.codigo != regiao.codigo:
            regiao_existente = regiao_repo.get_by_codigo(db, codigo=regiao_in.codigo)
            if regiao_existente:
                raise HTTPException(status_code=400, detail="Este código já está em uso por outra região.")
                
        return regiao_repo.update(db, db_obj=regiao, obj_in=regiao_in)

    def delete_regiao(self, db: Session, regiao_id: int):
        regiao = regiao_repo.get(db, id=regiao_id)
        if not regiao:
            raise HTTPException(status_code=404, detail="Região não encontrada")
        return regiao_repo.remove(db, id=regiao_id)

regiao_service = RegiaoService()
