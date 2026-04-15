from sqlalchemy.orm import Session
from app.repositories.area import area_repo
from app.schemas.area import AreaCreate, AreaUpdate
from fastapi import HTTPException

class AreaService:
    def get_areas(self, db: Session, skip: int = 0, limit: int = 100):
        return area_repo.get_multi(db, skip=skip, limit=limit)

    def create_area(self, db: Session, area_in: AreaCreate):
        # Validação de nome unico
        area_existente = area_repo.get_by_nome(db, nome=area_in.nome)
        if area_existente:
            raise HTTPException(status_code=400, detail="Uma área com este nome já existe.")
        
        # Validação de codigo unico
        codigo_existente = area_repo.get_by_codigo(db, codigo=area_in.codigo)
        if codigo_existente:
            raise HTTPException(status_code=400, detail="Já existe uma área com este código.")
            
        return area_repo.create(db, obj_in=area_in)

    def update_area(self, db: Session, area_id: int, area_in: AreaUpdate):
        area = area_repo.get(db, id=area_id)
        if not area:
            raise HTTPException(status_code=404, detail="Área não encontrada")
        
        # Se mudar o nome, verifica se jah existe outro com o mesmo nome
        if area_in.nome and area_in.nome != area.nome:
            if area_repo.get_by_nome(db, nome=area_in.nome):
                raise HTTPException(status_code=400, detail="Outra área já usa este nome.")
        
        # Se mudar o codigo, verifica se jah existe outro com o mesmo codigo
        if area_in.codigo and area_in.codigo != area.codigo:
            if area_repo.get_by_codigo(db, codigo=area_in.codigo):
                raise HTTPException(status_code=400, detail="Outra área já usa este código.")
                
        return area_repo.update(db, db_obj=area, obj_in=area_in)

    def delete_area(self, db: Session, area_id: int):
        area = area_repo.get(db, id=area_id)
        if not area:
            raise HTTPException(status_code=404, detail="Área não encontrada")
        return area_repo.remove(db, id=area_id)

area_service = AreaService()
