from pydantic import ConfigDict, BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class ApontamentoBase(BaseModel):
    id_pneu: int
    id_setor: Optional[int] = None
    id_operador: Optional[int] = None
    inicio: Optional[datetime] = None
    termino: Optional[datetime] = None
    tempo: Optional[Decimal] = None
    obs: Optional[str] = None
    status: Optional[str] = None
    codbarra: Optional[str] = None

class ApontamentoCreate(ApontamentoBase):
    pass

class ApontamentoUpdate(ApontamentoBase):
    id_pneu: Optional[int] = None

class ApontamentoResponse(ApontamentoBase):
    id: int
    datalan: Optional[datetime] = None
    userlan: Optional[str] = None
    
    # Campos extras para o frontend (via Joins)
    desc_setor: Optional[str] = None
    nome_operador: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
