from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class TipoDoctoBase(BaseModel):
    codigo: str
    descricao: Optional[str] = None
    ativo: Optional[bool] = True

class TipoDoctoCreate(TipoDoctoBase):
    pass

class TipoDoctoUpdate(BaseModel):
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    ativo: Optional[bool] = None

class TipoDoctoResponse(TipoDoctoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
