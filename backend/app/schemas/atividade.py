from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AtividadeBase(BaseModel):
    codigo: str
    descricao: str
    ativo: Optional[bool] = True

class AtividadeCreate(AtividadeBase):
    pass

class AtividadeUpdate(AtividadeBase):
    codigo: Optional[str] = None
    descricao: Optional[str] = None

class AtividadeResponse(AtividadeBase):
    id: int
    datalan: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
