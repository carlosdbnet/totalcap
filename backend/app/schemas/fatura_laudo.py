from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime

class FaturaLaudoBase(BaseModel):
    id_laudo: int
    valor: Decimal

class FaturaLaudoCreate(FaturaLaudoBase):
    id_fatura: int

class FaturaLaudoUpdate(BaseModel):
    valor: Optional[Decimal] = None

class FaturaLaudo(FaturaLaudoBase):
    id: int
    id_fatura: int
    datalan: datetime
    userlan: Optional[str] = None
    
    # Extra info for the grid
    numlaudo: Optional[int] = None
    pneu_id: Optional[int] = None
    vrcredito: Optional[Decimal] = None
    vrsaldo: Optional[Decimal] = None

    class Config:
        from_attributes = True
