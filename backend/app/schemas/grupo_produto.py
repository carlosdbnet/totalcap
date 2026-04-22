from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class GrupoProdutoBase(BaseModel):
    codigo: Optional[str] = None
    descricao: str
    ativo: Optional[bool] = True

class GrupoProdutoCreate(GrupoProdutoBase):
    pass

class GrupoProdutoUpdate(BaseModel):
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    ativo: Optional[bool] = None

class GrupoProduto(GrupoProdutoBase):
    id: int
    userlan: Optional[str] = None
    datalan: Optional[datetime] = None

    class Config:
        from_attributes = True
