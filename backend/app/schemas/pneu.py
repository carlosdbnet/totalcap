from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal

class PneuBase(BaseModel):
    id_ordem: Optional[int] = None
    id_fatura: Optional[int] = None
    id_empresa: Optional[int] = None
    id_contato: Optional[int] = None
    id_medida: Optional[int] = None
    id_produto: Optional[int] = None  # id_marca no mobile
    id_desenho: Optional[int] = None
    id_recap: Optional[int] = None
    id_servico: Optional[int] = None
    id_vendedor: Optional[int] = None
    codbarra: Optional[str] = None
    numserie: Optional[str] = None
    numfogo: Optional[str] = None
    statuspro: Optional[bool] = False
    statusfat: Optional[bool] = False
    placa: Optional[str] = None

class PneuCreate(PneuBase):
    pass

class Pneu(PneuBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    numos: Optional[int] = None
    nome_cliente: Optional[str] = None
    dataentrada: Optional[datetime] = None
    vrtotal_os: Optional[float] = 0.0
    produto_desc: Optional[str] = None
    historico: Optional[List] = []
