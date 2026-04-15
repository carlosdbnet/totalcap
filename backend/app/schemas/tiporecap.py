from typing import Optional
from pydantic import BaseModel

class TipoRecapagemBase(BaseModel):
    codigo: str
    descricao: str
    ativo: Optional[bool] = True

class TipoRecapagemCreate(TipoRecapagemBase):
    pass

class TipoRecapagemUpdate(BaseModel):
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    ativo: Optional[bool] = None

class TipoRecapagem(TipoRecapagemBase):
    id: int

    class Config:
        from_attributes = True
