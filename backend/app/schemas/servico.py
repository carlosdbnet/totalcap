from typing import Optional
from pydantic import BaseModel

class ServicoBase(BaseModel):
    codigo: Optional[str] = None
    descricao: str
    id_medida: Optional[int] = None
    id_desenho: Optional[int] = None
    id_produto: Optional[int] = None
    id_recap: Optional[int] = None
    valor: Optional[float] = 0.0
    ativo: Optional[bool] = True
    grupo: Optional[str] = None

class ServicoCreate(ServicoBase):
    pass

class ServicoUpdate(BaseModel):
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    id_medida: Optional[int] = None
    id_desenho: Optional[int] = None
    id_produto: Optional[int] = None
    id_recap: Optional[int] = None
    valor: Optional[float] = None
    ativo: Optional[bool] = None
    grupo: Optional[str] = None

# Nested objects for the response
class MedidaSimple(BaseModel):
    id: int
    descricao: str
    class Config:
        from_attributes = True

class DesenhoSimple(BaseModel):
    id: int
    descricao: str
    class Config:
        from_attributes = True

class ProdutoSimple(BaseModel):
    id: int
    descricao: str
    class Config:
        from_attributes = True

class RecapSimple(BaseModel):
    id: int
    descricao: str
    class Config:
        from_attributes = True

class Servico(ServicoBase):
    id: int
    
    # Relationships for display
    medida: Optional[MedidaSimple] = None
    desenho: Optional[DesenhoSimple] = None
    produto: Optional[ProdutoSimple] = None
    recap: Optional[RecapSimple] = None

    class Config:
        from_attributes = True
