from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator
from decimal import Decimal

class LaudoBase(BaseModel):
    id_empresa: Optional[int] = 1
    id_pneu: int
    id_contato: int
    id_medida: int
    id_desenho: int
    id_recap: int
    
    numlaudo: int
    datasol: Optional[datetime] = None
    numos: int
    
    numserie: Optional[str] = None
    numfogo: Optional[str] = None
    dot: Optional[str] = None
    desenhoriginal: Optional[str] = None
    piso: Optional[str] = None
    
    vrservico: Decimal = Decimal("0.00")
    borracha: Optional[str] = None
    carcaca: Optional[str] = None
    qreforma: int = 0
    placa: Optional[str] = None
    uso: Optional[str] = None
    garantia: Optional[str] = None
    codresp: Optional[str] = None
    estado: Optional[str] = None
    defeito: Optional[str] = None
    causa: Optional[str] = None
    
    dataprod: Optional[datetime] = None
    dataexa: Optional[datetime] = None
    respgara: Optional[str] = None
    laudo: Optional[str] = None
    motivo: Optional[str] = None
    tiporepo: Optional[str] = None
    
    percdesg: Decimal = Decimal("0.00")
    percrepo: Decimal = Decimal("0.00")
    percrefor: Decimal = Decimal("0.00")
    servrepo: Optional[str] = None
    
    vrcredito: Decimal = Decimal("0.00")
    vrpago: Decimal = Decimal("0.00")
    vrsaldo: Decimal = Decimal("0.00")
    vrestornocomissao: Decimal = Decimal("0.00")
    
    notarep: Optional[int] = None
    statrep: Optional[str] = None
    datarep: Optional[datetime] = None
    qremanescente: Decimal = Decimal("0.00")
    
    alegacao: Optional[Any] = None
    examinador: Optional[str] = None
    laudofab: int = 0
    profundidade: Decimal = Decimal("0.00")
    serienf: Optional[str] = None
    numnota: int = 0
    datafat: Optional[datetime] = None
    userexa: Optional[str] = None
    dataresul: Optional[datetime] = None
    
    obs: Optional[str] = None
    obs2: Optional[str] = None
    status: Optional[str] = "A"

    @field_validator('alegacao', mode='before')
    @classmethod
    def decode_alegacao(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, (bytes, memoryview)):
            try:
                return bytes(v).decode('utf-8', errors='ignore')
            except:
                return str(v)
        return str(v)

class LaudoCreate(BaseModel):
    # LaudoCreate permite campos opcionais para facilitar a criação via API
    # mas o id_pneu, id_contato etc são necessários.
    id_empresa: Optional[int] = 1
    id_pneu: int
    id_contato: int
    id_medida: int
    id_desenho: int
    id_recap: int
    numlaudo: Optional[int] = 0
    datasol: Optional[datetime] = None
    numos: int
    
    numserie: Optional[str] = None
    numfogo: Optional[str] = None
    dot: Optional[str] = None
    desenhoriginal: Optional[str] = None
    piso: Optional[str] = None
    vrservico: Decimal = Decimal("0.00")
    borracha: Optional[str] = None
    carcaca: Optional[str] = None
    qreforma: int = 0
    placa: Optional[str] = None
    uso: Optional[str] = None
    garantia: Optional[str] = None
    codresp: Optional[str] = None
    estado: Optional[str] = None
    defeito: Optional[str] = None
    causa: Optional[str] = None
    dataprod: Optional[datetime] = None
    dataexa: Optional[datetime] = None
    respgara: Optional[str] = None
    laudo: Optional[str] = None
    motivo: Optional[str] = None
    tiporepo: Optional[str] = None
    percdesg: Decimal = Decimal("0.00")
    percrepo: Decimal = Decimal("0.00")
    percrefor: Decimal = Decimal("0.00")
    servrepo: Optional[str] = None
    vrcredito: Decimal = Decimal("0.00")
    vrpago: Decimal = Decimal("0.00")
    vrsaldo: Decimal = Decimal("0.00")
    vrestornocomissao: Decimal = Decimal("0.00")
    notarep: Optional[int] = None
    statrep: Optional[str] = None
    datarep: Optional[datetime] = None
    qremanescente: Decimal = Decimal("0.00")
    alegacao: Optional[Any] = None
    examinador: Optional[str] = None
    laudofab: int = 0
    profundidade: Decimal = Decimal("0.00")
    serienf: Optional[str] = None
    numnota: int = 0
    datafat: Optional[datetime] = None
    userexa: Optional[str] = None
    dataresul: Optional[datetime] = None
    obs: Optional[str] = None
    obs2: Optional[str] = None
    status: Optional[str] = "A"

    @field_validator('alegacao', mode='before')
    @classmethod
    def encode_alegacao(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.encode('utf-8')
        return v

class LaudoUpdate(LaudoCreate):
    pass

class LaudoResponse(LaudoBase):
    id: int
    userlan: Optional[str] = None
    datalan: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
