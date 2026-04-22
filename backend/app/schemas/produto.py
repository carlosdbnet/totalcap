from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class GrupoProdutoSimple(BaseModel):
    id: int
    codigo: Optional[str] = None
    descricao: str

    class Config:
        from_attributes = True

class ProdutoBase(BaseModel):
    codprod: str
    id_grupo: Optional[int] = None
    numfab: Optional[str] = None
    descricao: Optional[str] = None
    unidade: Optional[str] = None
    embalag: Optional[str] = None
    precoven: Optional[float] = 0.0
    ativo: Optional[bool] = True

class ProdutoCreate(ProdutoBase):
    pass

class ProdutoUpdate(BaseModel):
    codprod: Optional[str] = None
    id_grupo: Optional[int] = None
    numfab: Optional[str] = None
    descricao: Optional[str] = None
    unidade: Optional[str] = None
    embalag: Optional[str] = None
    precoven: Optional[float] = None
    ativo: Optional[bool] = None

class Produto(ProdutoBase):
    id: int
    datalan: Optional[datetime] = None
    grupo: Optional[GrupoProdutoSimple] = None

    class Config:
        from_attributes = True
