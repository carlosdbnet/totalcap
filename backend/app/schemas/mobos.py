from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from backend.app.schemas.contato import ContatoBase
from backend.app.schemas.vendedor import VendedorBase

class MobPneuBase(BaseModel):
    id_medida: Optional[int] = None
    id_marca: Optional[int] = None
    id_desenho: Optional[int] = None
    id_recap: Optional[int] = None
    valor: Optional[float] = 0.0
    piso: Optional[str] = None
    numserie: Optional[str] = None
    numfogo: Optional[str] = None
    dot: Optional[str] = None
    doriginal: Optional[str] = None
    qreforma: Optional[int] = 0
    uso: Optional[str] = None
    garantia: Optional[str] = None
    obs: Optional[str] = None
    medidanova: Optional[str] = None
    marcanova: Optional[str] = None
    desenhonovo: Optional[str] = None

class MobPneuCreate(MobPneuBase):
    pass

class MobPneuUpdate(MobPneuBase):
    id: Optional[int] = None

class MobPneu(MobPneuBase):
    id: int
    id_mobos: int
    datalan: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class MobOSBase(BaseModel):
    id_contato: Optional[int] = None
    qpneu: Optional[int] = 0
    vtotal: Optional[float] = 0.0
    msgmob: Optional[str] = None
    id_vendedor: int
    
    # Novos campos do cabeçalho (Normalizados para minúsculo)
    numos: Optional[int] = None
    cpfcnpj: Optional[str] = None
    nome: Optional[str] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    fone: Optional[str] = None
    veiculo: Optional[str] = None
    formapagto: Optional[str] = None
    vendedor_ocr: Optional[str] = None
    servicocomgarantia: Optional[str] = None
    tipoveiculo: Optional[str] = None
    somentesepar: Optional[str] = None
    podealterardesenho: Optional[str] = None
    status: Optional[str] = ""

class MobOSCreate(MobOSBase):
    pneus: List[MobPneuCreate] = []

class MobOSUpdate(MobOSBase):
    pneus: List[MobPneuUpdate] = []

class MobOS(MobOSBase):
    id: int
    dataos: Optional[datetime] = None
    datalan: Optional[datetime] = None
    status: Optional[str] = ""
    pneus: List[MobPneu] = []
    contato: Optional[ContatoBase] = None
    vendedor: Optional[VendedorBase] = None
    
    class Config:
        from_attributes = True
