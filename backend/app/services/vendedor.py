from sqlalchemy.orm import Session
from backend.app.repositories.vendedor import vendedor_repo
from backend.app.schemas.vendedor import VendedorCreate, VendedorUpdate
from fastapi import HTTPException

class VendedorService:
    def get_vendedores(self, db: Session, skip: int = 0, limit: int = 100):
        return vendedor_repo.get_multi(db, skip=skip, limit=limit)

    def create_vendedor(self, db: Session, vendedor_in: VendedorCreate):
        if vendedor_in.codigo:
            existing = vendedor_repo.get_by_codigo(db, codigo=vendedor_in.codigo)
            if existing:
                raise HTTPException(status_code=400, detail="Registro Já Existe")
        return vendedor_repo.create(db, obj_in=vendedor_in)

    def update_vendedor(self, db: Session, vendedor_id: int, vendedor_in: VendedorUpdate):
        vendedor = vendedor_repo.get(db, id=vendedor_id)
        if not vendedor:
            raise HTTPException(status_code=404, detail="Vendedor não encontrado")
        
        if vendedor_in.codigo and vendedor_in.codigo != vendedor.codigo:
            existing = vendedor_repo.get_by_codigo(db, codigo=vendedor_in.codigo)
            if existing:
                raise HTTPException(status_code=400, detail="Este código já está em uso.")
                
        return vendedor_repo.update(db, db_obj=vendedor, obj_in=vendedor_in)

    def delete_vendedor(self, db: Session, vendedor_id: int):
        vendedor = vendedor_repo.get(db, id=vendedor_id)
        if not vendedor:
            raise HTTPException(status_code=404, detail="Vendedor não encontrado")
        return vendedor_repo.remove(db, id=vendedor_id)

vendedor_service = VendedorService()
