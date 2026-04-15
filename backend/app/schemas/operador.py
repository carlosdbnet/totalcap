from typing import Optional
from pydantic import BaseModel

class OperadorBase(BaseModel):
    codigo: Optional[str] = None
    nome: str
    cargo: Optional[str] = None
    id_setor: Optional[int] = None
    id_depto: Optional[int] = None
    ativo: Optional[bool] = True

class OperadorCreate(OperadorBase):
    pass

class OperadorUpdate(BaseModel):
    codigo: Optional[str] = None
    nome: Optional[str] = None
    cargo: Optional[str] = None
    id_setor: Optional[int] = None
    id_depto: Optional[int] = None
    ativo: Optional[bool] = None

# Nested objects for display
class SetorSimple(BaseModel):
    id: int
    descricao: str
    class Config:
        from_attributes = True

class DepartamentoSimple(BaseModel):
    id: int
    descricao: str
    class Config:
        from_attributes = True

class Operador(OperadorBase):
    id: int
    setor: Optional[SetorSimple] = None
    departamento: Optional[DepartamentoSimple] = None

    class Config:
        from_attributes = True
