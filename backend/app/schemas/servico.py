from typing import Optional
from pydantic import BaseModel

class ServicoBase(BaseModel):
    codservico: Optional[str] = None
    descricao: str
    piso: Optional[str] = None
    id_medida: Optional[int] = None
    id_desenho: Optional[int] = None
    id_marca: Optional[int] = None
    id_recap: Optional[int] = None
    ativo: Optional[bool] = True

class ServicoCreate(ServicoBase):
    pass

class ServicoUpdate(BaseModel):
    codservico: Optional[str] = None
    descricao: Optional[str] = None
    piso: Optional[str] = None
    id_medida: Optional[int] = None
    id_desenho: Optional[int] = None
    id_marca: Optional[int] = None
    id_recap: Optional[int] = None
    ativo: Optional[bool] = None

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

class MarcaSimple(BaseModel):
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
    marca: Optional[MarcaSimple] = None
    recap: Optional[RecapSimple] = None

    class Config:
        from_attributes = True
