from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class DispositivoBase(BaseModel):
    android_id: str
    id_setor: Optional[int] = None
    autorizado: Optional[bool] = False

class DispositivoCreate(DispositivoBase):
    pass

class DispositivoUpdate(BaseModel):
    autorizado: bool

class SetorSimple(BaseModel):
    id: int
    descricao: str

    class Config:
        from_attributes = True

class Dispositivo(DispositivoBase):
    id: int
    data_solicitacao: Optional[datetime] = None
    datalan: Optional[datetime] = None
    setor: Optional[SetorSimple] = None

    class Config:
        from_attributes = True
