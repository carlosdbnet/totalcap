from typing import Optional
from pydantic import BaseModel

class SetorBase(BaseModel):
    codigo: Optional[str] = None
    descricao: str
    sequencia: Optional[int] = 0
    tempomedio: Optional[int] = 0
    tempominimo: Optional[int] = 0
    qmeta: Optional[int] = 0
    proxsetor: Optional[str] = None
    sopassagem: Optional[bool] = False
    avaliacao: Optional[bool] = False
    falha: Optional[bool] = False
    consumomp: Optional[bool] = False
    faturamento: Optional[bool] = False
    expedicao: Optional[bool] = False
    supervisao: Optional[bool] = False
    ativo: Optional[bool] = True

class SetorCreate(SetorBase):
    pass

class SetorUpdate(BaseModel):
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    sequencia: Optional[int] = None
    tempomedio: Optional[int] = None
    tempominimo: Optional[int] = None
    qmeta: Optional[int] = None
    proxsetor: Optional[str] = None
    sopassagem: Optional[bool] = None
    avaliacao: Optional[bool] = None
    falha: Optional[bool] = None
    consumomp: Optional[bool] = None
    faturamento: Optional[bool] = None
    expedicao: Optional[bool] = None
    supervisao: Optional[bool] = None
    ativo: Optional[bool] = None

class Setor(SetorBase):
    id: int

    class Config:
        from_attributes = True
