from typing import Optional
from pydantic import BaseModel

class EstadoBase(BaseModel):
    sigla: str
    nome: str
    ativo: Optional[bool] = True

class EstadoCreate(EstadoBase):
    pass

class EstadoUpdate(BaseModel):
    sigla: Optional[str] = None
    nome: Optional[str] = None
    ativo: Optional[bool] = None

class Estado(EstadoBase):
    id: int

    class Config:
        from_attributes = True
