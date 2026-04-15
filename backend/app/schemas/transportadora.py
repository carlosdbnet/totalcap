from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class TransportadoraBase(BaseModel):
    razao_social: str
    nome_fantasia: Optional[str] = None
    cnpj: Optional[str] = None
    endereco: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    fone: Optional[str] = None
    email: Optional[str] = None
    contato: Optional[str] = None
    ativo: bool = True

class TransportadoraCreate(TransportadoraBase):
    pass

class TransportadoraUpdate(BaseModel):
    razao_social: Optional[str] = None
    nome_fantasia: Optional[str] = None
    cnpj: Optional[str] = None
    endereco: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    fone: Optional[str] = None
    email: Optional[str] = None
    contato: Optional[str] = None
    ativo: Optional[bool] = None

class Transportadora(TransportadoraBase):
    id: int
    datalan: Optional[datetime] = None

    class Config:
        from_attributes = True
