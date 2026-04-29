from sqlalchemy.orm import Session
from backend.app.repositories.regiao import regiao_repo
from backend.app.schemas.regiao import RegiaoCreate, RegiaoUpdate
from fastapi import HTTPException

class RegiaoService:
    def get_regioes(self, db: Session, skip: int = 0, limit: int = 100):
        return regiao_repo.get_multi(db, skip=skip, limit=limit)

    def create_regiao(self, db: Session, regiao_in: RegiaoCreate):
        # Validação de codigo unico
        codigo_existente = regiao_repo.get_by_codigo(db, codigo=regiao_in.codigo)
        if codigo_existente:
            raise HTTPException(status_code=400, detail="Registro Já Existe (Código)")
            
        # Validação de nome unico
        nome_existente = regiao_repo.get_by_nome(db, nome=regiao_in.nome)
        if nome_existente:
            raise HTTPException(status_code=400, detail="Registro Já Existe (Nome)")
            
        return regiao_repo.create(db, obj_in=regiao_in)

    def update_regiao(self, db: Session, regiao_id: int, regiao_in: RegiaoUpdate):
        regiao = regiao_repo.get(db, id=regiao_id)
        if not regiao:
            raise HTTPException(status_code=404, detail="Região não encontrada")
        
        # Se mudar o codigo, verifica se o novo codigo ja existe
        if regiao_in.codigo and regiao_in.codigo != regiao.codigo:
            if regiao_repo.get_by_codigo(db, codigo=regiao_in.codigo):
                raise HTTPException(status_code=400, detail="Este código já está em uso por outra região.")
        
        # Se mudar o nome, verifica se o novo nome ja existe
        if regiao_in.nome and regiao_in.nome != regiao.nome:
            if regiao_repo.get_by_nome(db, nome=regiao_in.nome):
                raise HTTPException(status_code=400, detail="Este nome já está em uso por outra região.")
                
        return regiao_repo.update(db, db_obj=regiao, obj_in=regiao_in)

    def delete_regiao(self, db: Session, regiao_id: int):
        regiao = regiao_repo.get(db, id=regiao_id)
        if not regiao:
            raise HTTPException(status_code=404, detail="Região não encontrada")
        return regiao_repo.remove(db, id=regiao_id)

regiao_service = RegiaoService()
