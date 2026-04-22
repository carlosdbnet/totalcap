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
    id_recap: Optional[int] = None
    numserie: Optional[str] = None
    numfogo: Optional[str] = None
    dot: Optional[str] = None
    valor: Optional[Decimal] = Decimal("0.00")
    statuspro: Optional[bool] = False
    statusfat: Optional[bool] = False
    codbarra: Optional[str] = None
    obs: Optional[str] = None
    
    # Novos campos para sincronia legado
    id_contato: Optional[int] = None
    id_vendedor: Optional[int] = None
    qreforma: Optional[int] = 0
    quant: Optional[int] = 1
    vrservico: Optional[Decimal] = Decimal("0.00")
    vrcarcaca: Optional[Decimal] = Decimal("0.00")
    qservico: Optional[Decimal] = Decimal("0.00")
    id_fatura: Optional[int] = None

class OSPneuCreate(OSPneuBase):
    pass

class OSPneuUpdate(OSPneuBase):
    id: Optional[int] = None

class OSPneuResponse(OSPneuBase):
    id: int
    id_ordem: int
    datalan: datetime
    statuspro_label: Optional[str] = "AGUARDANDO"
    
    model_config = ConfigDict(from_attributes=True)

# --- ORDEM DE SERVICO (MESTRE) ---
class OrdemServicoBase(BaseModel):
    numos: int
    dataprevisao: Optional[datetime] = None
    dataentrada: Optional[datetime] = None
    id_contato: int
    id_vendedor: Optional[int] = None
    id_planopag: Optional[int] = None
    id_mobos: Optional[int] = None
    observacao: Optional[str] = None
    status: Optional[str] = "A"

    # Campos Financeiros
    vrservico: Optional[Decimal] = Decimal("0.00")
    vrproduto: Optional[Decimal] = Decimal("0.00")
    vrcarcaca: Optional[Decimal] = Decimal("0.00")
    vrbonus: Optional[Decimal] = Decimal("0.00")
    vrmontagem: Optional[Decimal] = Decimal("0.00")
    vrtotal: Optional[Decimal] = Decimal("0.00")
    pcomissao: Optional[Decimal] = Decimal("0.00")
    vrcomissao: Optional[Decimal] = Decimal("0.00")

class OrdemServicoCreate(OrdemServicoBase):
    id_coleta: Optional[int] = None
    pneus: List[OSPneuCreate] = []

class OrdemServicoUpdate(BaseModel):
    numos: Optional[int] = None
    dataprevisao: Optional[datetime] = None
    dataentrada: Optional[datetime] = None
    id_contato: Optional[int] = None
    id_vendedor: Optional[int] = None
    id_planopag: Optional[int] = None
    id_mobos: Optional[int] = None
    observacao: Optional[str] = None
    status: Optional[str] = None
    pneus: Optional[List[OSPneuUpdate]] = None
    
    # Campos Financeiros
    vrservico: Optional[Decimal] = None
    vrproduto: Optional[Decimal] = None
    vrcarcaca: Optional[Decimal] = None
    vrbonus: Optional[Decimal] = None
    vrmontagem: Optional[Decimal] = None
    vrtotal: Optional[Decimal] = None
    pcomissao: Optional[Decimal] = None
    vrcomissao: Optional[Decimal] = None

class OrdemServicoResponse(OrdemServicoBase):
    id: int
    dataentrada: Optional[datetime] = None
    datalan: datetime
    contato_nome: Optional[str] = None
    pneus: List[OSPneuResponse] = []

    model_config = ConfigDict(from_attributes=True)

class PneuSearchResult(BaseModel):
    pneu_id: int
    numserie: Optional[str] = None
    numfogo: Optional[str] = None
    codbarra: Optional[str] = None
    dot: Optional[str] = None
    statuspro: bool
    statusfat: bool
    statuspro_label: str
    
    # Resolvidos (Lookups)
    medida_nome: Optional[str] = None
    marca_nome: Optional[str] = None
    desenho_nome: Optional[str] = None
    servico_nome: Optional[str] = None
    tiporecap_nome: Optional[str] = None
    
    # Contexto da OS
    os_id: int
    numos: int
    contato_nome: Optional[str] = None
    dataentrada: datetime
    id_servico_base: Optional[int] = None
    valor_pneu: Optional[float] = 0.0
    qservico: Optional[float] = 0.0
    vrservico: Optional[float] = 0.0
    id_vendedor: Optional[int] = None
    id_contato: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)
