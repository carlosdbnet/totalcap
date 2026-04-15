from typing import Optional
from pydantic import BaseModel

class DesenhoBase(BaseModel):
    codigo: Optional[str] = None
    descricao: str
    ativo: Optional[bool] = True

class DesenhoCreate(DesenhoBase):
    pass

class DesenhoUpdate(BaseModel):
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    ativo: Optional[bool] = None

class Desenho(DesenhoBase):
    id: int

    class Config:
        from_attributes = True
