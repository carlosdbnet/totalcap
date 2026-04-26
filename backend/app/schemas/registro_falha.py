from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class RegistroFalhaBase(BaseModel):
    id_setor: int
    id_operador: int
    id_falha: int
    id_pneu: Optional[int] = None
    obs: Optional[str] = None

class RegistroFalhaCreate(RegistroFalhaBase):
    pass

class RegistroFalhaResponse(RegistroFalhaBase):
    id: int
    data: datetime
    
    # Campos extras para o frontend (via Joins)
    setor_nome: Optional[str] = None
    operador_nome: Optional[str] = None
    falha_nome: Optional[str] = None
    numserie: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
