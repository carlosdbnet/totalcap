from typing import Optional
from pydantic import BaseModel

class CidadeBase(BaseModel):
    nome: str
    uf: str
    codigo_ibge: Optional[str] = None
    ativo: Optional[bool] = True

class CidadeCreate(CidadeBase):
    pass

class CidadeUpdate(BaseModel):
    nome: Optional[str] = None
    uf: Optional[str] = None
    codigo_ibge: Optional[str] = None
    ativo: Optional[bool] = None

class Cidade(CidadeBase):
    id: int

    class Config:
        from_attributes = True
