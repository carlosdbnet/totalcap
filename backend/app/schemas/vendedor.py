from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime

class VendedorBase(BaseModel):
    codigo: Optional[str] = None
    apelido: Optional[str] = None
    nome: str
    id_area: Optional[int] = None
    id_regiao: Optional[int] = None
    endereco: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    fone: Optional[str] = None
    cpfcnpj: Optional[str] = None
    cargo: Optional[str] = None
    ativo: Optional[bool] = True

    model_config = ConfigDict(from_attributes=True)

class VendedorCreate(VendedorBase):
    pass

class VendedorUpdate(VendedorBase):
    nome: Optional[str] = None

class VendedorResponse(VendedorBase):
    id: int
    datalan: Optional[datetime] = None
    # Incluiremos nomes de área e região para facilitar o frontend
    area_nome: Optional[str] = None
    regiao_nome: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj: Any, *args, **kwargs):
        data = super().model_validate(obj, *args, **kwargs)
        if hasattr(obj, 'area') and obj.area:
            data.area_nome = obj.area.nome
        if hasattr(obj, 'regiao') and obj.regiao:
            data.regiao_nome = obj.regiao.nome
        return data
