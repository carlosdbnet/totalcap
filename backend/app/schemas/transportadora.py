from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class TransportadoraBase(BaseModel):
    codigo: Optional[str] = None
    nome: str
    endereco: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    fone: Optional[str] = None
    fax: Optional[str] = None
    cpfcnpj: Optional[str] = None
    inscricao: Optional[str] = None
    placaveic: Optional[str] = None
    ufplaca: Optional[str] = None
    ativo: bool = True

class TransportadoraCreate(TransportadoraBase):
    pass

class TransportadoraUpdate(BaseModel):
    codigo: Optional[str] = None
    nome: Optional[str] = None
    endereco: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    fone: Optional[str] = None
    fax: Optional[str] = None
    cpfcnpj: Optional[str] = None
    inscricao: Optional[str] = None
    placaveic: Optional[str] = None
    ufplaca: Optional[str] = None
    ativo: Optional[bool] = None

class Transportadora(TransportadoraBase):
    id: int
    datalan: Optional[datetime] = None

    class Config:
        from_attributes = True
