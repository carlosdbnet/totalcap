from typing import Optional
from pydantic import BaseModel

class CidadeBase(BaseModel):
    nome: str
    uf: str
    codigoibge: Optional[int] = None
    ativo: Optional[bool] = True

class CidadeCreate(CidadeBase):
    pass

class CidadeUpdate(BaseModel):
    nome: Optional[str] = None
    uf: Optional[str] = None
    codigoibge: Optional[int] = None
    ativo: Optional[bool] = None

class Cidade(CidadeBase):
    id: int

    class Config:
        from_attributes = True
