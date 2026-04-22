from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

class OrcamentoItemBase(BaseModel):
    id_medida: Optional[int] = None
    id_desenho: Optional[int] = None
    id_recap: Optional[int] = None
    descricao: Optional[str] = None
    medida: Optional[str] = None
    marca: Optional[str] = None
    servico: Optional[str] = None
    desenho: Optional[str] = None
    numfogo: Optional[str] = None
    dot: Optional[str] = None
    quant: Decimal = Decimal('1.0')
    valor: Decimal = Decimal('0.0')
    vrtotal: Decimal = Decimal('0.0')

class OrcamentoItemCreate(OrcamentoItemBase):
    pass

class OrcamentoItemRead(OrcamentoItemBase):
    id: int
    class Config:
        from_attributes = True

class OrcamentoBase(BaseModel):
    id_ordem: Optional[int] = None
    id_contato: Optional[int] = None
    id_vendedor: Optional[int] = None
    datamov: datetime = datetime.now()
    vtotal: Decimal = Decimal('0.0')
    vdesconto: Decimal = Decimal('0.0')
    validade: Optional[str] = None
    condicao: Optional[str] = None
    obs: Optional[str] = None
    
    nome: Optional[str] = None
    nomeresp: Optional[str] = None
    foneresp: Optional[str] = None
    email1: Optional[str] = None
    email2: Optional[str] = None
    
    rua: Optional[str] = None
    numcasa: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    cxpostal: Optional[str] = None
    
    foneres: Optional[str] = None
    fonecom: Optional[str] = None
    fax: Optional[str] = None
    celular: Optional[str] = None
    contato: Optional[str] = None

class OrcamentoCreate(OrcamentoBase):
    items: List[OrcamentoItemCreate]

class OrcamentoUpdate(OrcamentoBase):
    items: Optional[List[OrcamentoItemCreate]] = None

class OrcamentoRead(OrcamentoBase):
    id: int
    datalan: datetime
    items: List[OrcamentoItemRead]
    contato_nome: Optional[str] = None
    vendedor_nome: Optional[str] = None
    
    class Config:
        from_attributes = True
