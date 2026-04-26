from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class FalhaBase(BaseModel):
    codigo: int
    descricao: Optional[str] = None
    observacao: Optional[str] = None
    msg_email: Optional[str] = None
    ativo: Optional[bool] = True

class FalhaCreate(FalhaBase):
    pass

class FalhaUpdate(BaseModel):
    codigo: Optional[int] = None
    descricao: Optional[str] = None
    observacao: Optional[str] = None
    msg_email: Optional[str] = None
    ativo: Optional[bool] = None

class Falha(FalhaBase):
    id: int
    datalan: Optional[datetime] = None

    class Config:
        from_attributes = True