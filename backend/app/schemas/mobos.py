from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.contato import ContatoBase
from app.schemas.vendedor import VendedorBase

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
    id_vendedor: Optional[int] = None

class MobPneuCreate(MobPneuBase):
    pass

class MobPneuUpdate(MobPneuBase):
    id: Optional[int] = None

class MobPneu(MobPneuBase):
    id: int
    id_mobos: int
    datalan: Optional[datetime] = None
    sincronizado: Optional[str] = "N"
    
    class Config:
        from_attributes = True

class MobOSBase(BaseModel):
    id_contato: int
    qpneu: Optional[int] = 0
    vtotal: Optional[float] = 0.0
    msgmob: Optional[str] = None
    id_vendedor: Optional[int] = None

class MobOSCreate(MobOSBase):
    pneus: List[MobPneuCreate] = []

class MobOSUpdate(MobOSBase):
    pneus: List[MobPneuUpdate] = []

class MobOS(MobOSBase):
    id: int
    dataos: Optional[datetime] = None
    datalan: Optional[datetime] = None
    sincronizado: Optional[str] = "N"
    pneus: List[MobPneu] = []
    contato: Optional[ContatoBase] = None
    vendedor: Optional[VendedorBase] = None
    
    class Config:
        from_attributes = True
