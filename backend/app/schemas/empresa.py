from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class EmpresaBase(BaseModel):
    nome: str
    razaosocial: Optional[str] = None
    endereco: Optional[str] = None
    numcasa: Optional[str] = None
    bairro: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    telefone: Optional[str] = None
    cxpostal: Optional[str] = None
    email: Optional[str] = None
    cnpj: Optional[str] = None
    inscestadual: Optional[str] = None
    inscmunicipio: Optional[str] = None
    token: Optional[str] = None
    ativo: Optional[bool] = True

class EmpresaCreate(EmpresaBase):
    pass

class EmpresaUpdate(BaseModel):
    nome: Optional[str] = None
    razaosocial: Optional[str] = None
    endereco: Optional[str] = None
    numcasa: Optional[str] = None
    bairro: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    telefone: Optional[str] = None
    cxpostal: Optional[str] = None
    email: Optional[str] = None
    cnpj: Optional[str] = None
    inscestadual: Optional[str] = None
    inscmunicipio: Optional[str] = None
    token: Optional[str] = None
    ativo: Optional[bool] = None

class EmpresaResponse(EmpresaBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
