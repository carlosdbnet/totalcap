from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class BancoBase(BaseModel):
    codigo: Optional[str] = None
    nome: str
    ativo: Optional[bool] = True

class BancoCreate(BancoBase):
    pass

class BancoUpdate(BaseModel):
    codigo: Optional[str] = None
    nome: Optional[str] = None
    ativo: Optional[bool] = None

class Banco(BancoBase):
    id: int

    class Config:
        from_attributes = True
