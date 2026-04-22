from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class BancoBase(BaseModel):
    codigo: Optional[str] = None
    nome: str
    razaosocial: Optional[str] = None
    endereco: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    contato: Optional[str] = None
    fone: Optional[str] = None
    cnpj: Optional[str] = None
    ativo: Optional[bool] = True
    userlan: Optional[str] = None

class BancoCreate(BancoBase):
    pass

class BancoUpdate(BaseModel):
    codigo: Optional[str] = None
    nome: Optional[str] = None
    razaosocial: Optional[str] = None
    endereco: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    contato: Optional[str] = None
    fone: Optional[str] = None
    cnpj: Optional[str] = None
    ativo: Optional[bool] = None
    userlan: Optional[str] = None

class Banco(BancoBase):
    id: int
    datalan: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
