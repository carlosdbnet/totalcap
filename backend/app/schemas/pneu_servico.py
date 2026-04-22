from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class PneuServicoBase(BaseModel):
    id_pneu: int
    id_servico: int
    id_ordem: Optional[int] = None
    quant: Optional[int] = 1
    valor: Optional[Decimal] = Decimal("0.00")
    vrtotal: Optional[Decimal] = Decimal("0.00")
    vrtabela: Optional[Decimal] = Decimal("0.00")
    pdescto: Optional[Decimal] = Decimal("0.00")
    pcomissao: Optional[Decimal] = Decimal("0.00")
    vrcomissao: Optional[Decimal] = Decimal("0.00")
    id_fatura: Optional[int] = None

class PneuServicoCreate(PneuServicoBase):
    pass

class PneuServicoUpdate(BaseModel):
    quant: Optional[int] = None
    valor: Optional[Decimal] = None
    vrtotal: Optional[Decimal] = None

class PneuServicoResponse(PneuServicoBase):
    id: int
    datalan: Optional[datetime] = None
    
    # Campo para facilitar exibição no front
    servico_descricao: Optional[str] = None

    class Config:
        from_attributes = True
