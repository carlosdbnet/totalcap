from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from backend.app.schemas.ordem_servico import OSPneuResponse

class FaturaBase(BaseModel):
    id_empresa: Optional[int] = 1
    id_contato: int
    id_planopag: Optional[int] = None
    id_vendedor: Optional[int] = None
    id_tipodocto: Optional[int] = None
    id_banco: Optional[int] = None
    datafat: Optional[datetime] = None
    vrservico: Optional[Decimal] = Decimal("0.00")
    vrproduto: Optional[Decimal] = Decimal("0.00")
    vrcarcaca: Optional[Decimal] = Decimal("0.00")
    vrmontagem: Optional[Decimal] = Decimal("0.00")
    vrbonus: Optional[Decimal] = Decimal("0.00")
    vrtotal: Optional[Decimal] = Decimal("0.00")
    obs: Optional[str] = None
    userlan: Optional[str] = None

class FaturaParcelaBase(BaseModel):
    num_parcela: Optional[int] = None
    datafat: Optional[datetime] = None
    vencto: Optional[datetime] = None
    valor: Optional[Decimal] = Decimal("0.00")
    id_empresa: Optional[int] = 1
    id_contato: Optional[int] = None
    id_vendedor: Optional[int] = None
    id_banco: Optional[int] = None
    id_tipodocto: Optional[int] = None
    pcomiss: Optional[Decimal] = Decimal("0.00")
    vrcomiss: Optional[Decimal] = Decimal("0.00")
    chbanco: Optional[str] = None
    chagencia: Optional[str] = None
    chconta: Optional[str] = None
    chnumcero: Optional[str] = None
    chcpfcnpj: Optional[str] = None
    chemitente: Optional[str] = None
    chdataemi: Optional[datetime] = None

class FaturaCreate(FaturaBase):
    pneu_ids: List[int] = [] # IDs dos pneus que farão parte desta fatura
    parcelas: Optional[List[FaturaParcelaBase]] = None

class FaturaUpdate(BaseModel):
    id_contato: Optional[int] = None
    id_planopag: Optional[int] = None
    id_vendedor: Optional[int] = None
    obs: Optional[str] = None
    vrservico: Optional[Decimal] = None
    vrproduto: Optional[Decimal] = None
    vrcarcaca: Optional[Decimal] = None
    vrmontagem: Optional[Decimal] = None
    vrbonus: Optional[Decimal] = None
    vrtotal: Optional[Decimal] = None
    pneu_ids: Optional[List[int]] = None # Atualizar lista de pneus vinculados
    parcelas: Optional[List[FaturaParcelaBase]] = None

class FaturaServicoBase(BaseModel):
    id_empresa: Optional[int] = 1
    id_pneu: Optional[int] = None
    id_pneusrv: Optional[int] = None
    id_servico: Optional[str] = None
    codservico: Optional[str] = None
    descricao: Optional[str] = None
    vrtabela: Optional[Decimal] = Decimal("0.00")
    pdescto: Optional[Decimal] = Decimal("0.00")
    vrdescto: Optional[Decimal] = Decimal("0.00")
    valor: Optional[Decimal] = Decimal("0.00")
    quant: Optional[Decimal] = Decimal("1.00")
    vrtotal: Optional[Decimal] = Decimal("0.00")
    pcomissao: Optional[Decimal] = Decimal("0.00")
    userlan: Optional[str] = None
    datalan: Optional[datetime] = None

class FaturaServicoResponse(FaturaServicoBase):
    id: int
    id_fatura: int
    model_config = ConfigDict(from_attributes=True)

class FaturaParcelaResponse(FaturaParcelaBase):
    id: int
    id_fatura: int
    model_config = ConfigDict(from_attributes=True)

class FaturaResponse(FaturaBase):
    id: int
    datalan: datetime
    contato_nome: Optional[str] = None
    vendedor_nome: Optional[str] = None
    pneus: List[OSPneuResponse] = []
    items: List[FaturaServicoResponse] = []
    parcelas: List[FaturaParcelaResponse] = []

    model_config = ConfigDict(from_attributes=True)
