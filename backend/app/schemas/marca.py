from typing import Optional
from pydantic import BaseModel

class MarcaBase(BaseModel):
    codigo: Optional[str] = None
    descricao: str
    ativo: Optional[bool] = True

class MarcaCreate(MarcaBase):
    pass

class MarcaUpdate(BaseModel):
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    ativo: Optional[bool] = None

class Marca(MarcaBase):
    id: int

    class Config:
        from_attributes = True
