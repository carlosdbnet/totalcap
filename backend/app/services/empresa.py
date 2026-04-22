from sqlalchemy.orm import Session
from backend.app.repositories.empresa import empresa_repo
from backend.app.schemas.empresa import EmpresaCreate, EmpresaUpdate
from fastapi import HTTPException

class EmpresaService:
    def get_empresas(self, db: Session, skip: int = 0, limit: int = 100):
        return empresa_repo.get_multi(db, skip=skip, limit=limit)

    def get_empresa(self, db: Session, id: int):
        empresa = empresa_repo.get(db, id=id)
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")
        return empresa

    def create_empresa(self, db: Session, empresa_in: EmpresaCreate):
        if empresa_in.cnpj:
            empresa_existente = empresa_repo.get_by_cnpj(db, cnpj=empresa_in.cnpj)
            if empresa_existente:
                raise HTTPException(status_code=400, detail="Registro Já Existe")
            
        return empresa_repo.create(db, obj_in=empresa_in)

    def update_empresa(self, db: Session, empresa_id: int, empresa_in: EmpresaUpdate):
        empresa = empresa_repo.get(db, id=empresa_id)
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")
        
        if empresa_in.cnpj and empresa_in.cnpj != empresa.cnpj:
            if empresa_repo.get_by_cnpj(db, cnpj=empresa_in.cnpj):
                raise HTTPException(status_code=400, detail="Outra empresa já usa este CNPJ.")
                
        return empresa_repo.update(db, db_obj=empresa, obj_in=empresa_in)

    def delete_empresa(self, db: Session, empresa_id: int):
        empresa = empresa_repo.get(db, id=empresa_id)
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")
        return empresa_repo.remove(db, id=empresa_id)

empresa_service = EmpresaService()
