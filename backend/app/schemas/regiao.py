from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class RegiaoBase(BaseModel):
    codigo: str
    nome: str
    ativo: Optional[bool] = True

class RegiaoCreate(RegiaoBase):
    pass

class RegiaoUpdate(RegiaoBase):
    codigo: Optional[str] = None
    nome: Optional[str] = None

class RegiaoResponse(RegiaoBase):
    id: int
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
