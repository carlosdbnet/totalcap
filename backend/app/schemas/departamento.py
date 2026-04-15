from typing import Optional
from pydantic import BaseModel

class DepartamentoBase(BaseModel):
    descricao: str
    ativo: Optional[bool] = True

class DepartamentoCreate(DepartamentoBase):
    pass

class DepartamentoUpdate(BaseModel):
    descricao: Optional[str] = None
    ativo: Optional[bool] = None

class Departamento(DepartamentoBase):
    id: int

    class Config:
        from_attributes = True
