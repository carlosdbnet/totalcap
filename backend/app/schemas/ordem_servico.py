from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# --- PNEU (DETALHE) ---
class OSPneuBase(BaseModel):
    id_medida: Optional[int] = None
    id_marca: Optional[int] = None
    id_desenho: Optional[int] = None
    id_servico: Optional[int] = None
    id_tiporecap: Optional[int] = None
    serie: Optional[str] = None
    dot: Optional[str] = None
    matricula: Optional[str] = None
    valor: Optional[Decimal] = Decimal("0.00")
    status_item: Optional[str] = "AGUARDANDO"

class OSPneuCreate(OSPneuBase):
    pass

class OSPneuUpdate(OSPneuBase):
    id: Optional[int] = None # ID is needed to distinguish existing from new in updates

class OSPneuResponse(OSPneuBase):
    id: int
    id_os: int
    criado_em: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- ORDEM DE SERVICO (MESTRE) ---
class OrdemServicoBase(BaseModel):
    numero_os: str
    data_previsao: Optional[datetime] = None
    id_cliente: int
    id_vendedor: Optional[int] = None
    id_transportadora: Optional[int] = None
    observacao: Optional[str] = None
    status: Optional[str] = "ABERTA"

class OrdemServicoCreate(OrdemServicoBase):
    pneus: List[OSPneuCreate] = []

class OrdemServicoUpdate(BaseModel):
    numero_os: Optional[str] = None
    data_previsao: Optional[datetime] = None
    id_cliente: Optional[int] = None
    id_vendedor: Optional[int] = None
    id_transportadora: Optional[int] = None
    observacao: Optional[str] = None
    status: Optional[str] = None
    pneus: Optional[List[OSPneuUpdate]] = None

class OrdemServicoResponse(OrdemServicoBase):
    id: int
    data_emissao: datetime
    criado_em: datetime
    atualizado_em: Optional[datetime] = None
    pneus: List[OSPneuResponse] = []

    model_config = ConfigDict(from_attributes=True)
