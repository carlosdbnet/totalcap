from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AreaBase(BaseModel):
    codigo: str
    nome: str
    ativo: Optional[bool] = True

class AreaCreate(AreaBase):
    pass

class AreaUpdate(AreaBase):
    codigo: Optional[str] = None
    nome: Optional[str] = None

class AreaResponse(AreaBase):
    id: int
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
