from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VeiculoBase(BaseModel):
    placa: Optional[str] = None
    descricao: Optional[str] = None
    codven: Optional[str] = None
    tipo: Optional[str] = None
    comb: Optional[str] = None
    plaqueta: Optional[int] = None
    uf: Optional[str] = None
    codmod: Optional[str] = None
    renavam: Optional[str] = None
    chassi: Optional[str] = None
    ano: Optional[str] = None
    alienado: Optional[bool] = False
    bancofin: Optional[str] = None
    sinistro: Optional[bool] = False
    seguradora: Optional[str] = None
    antt: Optional[str] = None
    ativo: Optional[bool] = True

class VeiculoCreate(VeiculoBase):
    pass

class VeiculoUpdate(VeiculoBase):
    pass

class Veiculo(VeiculoBase):
    id: int
    userlan: Optional[str] = None
    datalan: Optional[datetime] = None

    class Config:
        from_attributes = True
