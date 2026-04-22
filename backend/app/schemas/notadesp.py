from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

# NotadespItem Schemas
class NotadespItemBase(BaseModel):
    id_vendedor: Optional[int] = None
    id_veiculo: Optional[int] = None
    descricao: Optional[str] = None
    datamov: Optional[datetime] = None
    tipo: Optional[str] = None
    qlitro: Optional[Decimal] = 0
    vlitro: Optional[Decimal] = 0
    vtotal: Optional[Decimal] = 0
    kmanter: Optional[int] = None
    kmatual: Optional[int] = None
    dados: Optional[str] = None

class NotadespItemCreate(NotadespItemBase):
    pass

class NotadespItemUpdate(NotadespItemBase):
    pass

class NotadespItem(NotadespItemBase):
    id: int
    id_notadesp: int
    model_config = ConfigDict(from_attributes=True)

# Notadesp (Header) Schemas
class NotadespBase(BaseModel):
    id_contato: Optional[int] = None
    dataemi: Optional[datetime] = None
    cpfcnpj: Optional[str] = None
    nome: Optional[str] = None
    vtotal: Optional[Decimal] = 0
    id_vendedor: int
    status: Optional[str] = ""

class NotadespCreate(NotadespBase):
    itens: List[NotadespItemCreate] = []

class NotadespUpdate(NotadespBase):
    itens: List[NotadespItemCreate] = []

class Notadesp(NotadespBase):
    id: int
    datalan: datetime
    itens: List[NotadespItem] = []
    
    # Extra fields for grid display
    contato_nome: Optional[str] = None
    vendedor_nome: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
