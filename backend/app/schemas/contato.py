from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

# --- Endereço ---
class ContatoEnderecoBase(BaseModel):
    tipo: Optional[str] = None
    rua: Optional[str] = None
    numcasa: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    fone: Optional[str] = None
    celular: Optional[str] = None
    email: Optional[str] = None

class ContatoEnderecoCreate(ContatoEnderecoBase):
    pass

class ContatoEndereco(ContatoEnderecoBase):
    id: int
    class Config:
        from_attributes = True

# --- Email ---
class ContatoEmailBase(BaseModel):
    email: str
    tipo: Optional[str] = None
    ativo: Optional[bool] = True

class ContatoEmailCreate(ContatoEmailBase):
    pass

class ContatoEmail(ContatoEmailBase):
    id: int
    class Config:
        from_attributes = True

# --- Info ---
class ContatoInfoBase(BaseModel):
    tipo: Optional[str] = None
    descricao: Optional[str] = None
    ativo: Optional[bool] = True

class ContatoInfoCreate(ContatoInfoBase):
    pass

class ContatoInfo(ContatoInfoBase):
    id: int
    class Config:
        from_attributes = True

# --- Contato Master ---
class ContatoBase(BaseModel):
    nome: str
    razaosocial: Optional[str] = None
    cpfcnpj: Optional[str] = None
    pessoa: Optional[str] = None
    rg: Optional[str] = None
    emitenterg: Optional[str] = None
    inscestadual: Optional[str] = None
    inscmunicipio: Optional[str] = None
    tipodoc: Optional[str] = None
    cxpostal: Optional[str] = None
    codigopais: Optional[str] = None
    nomepais: Optional[str] = None
    
    rua: Optional[str] = None
    numcasa: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cep: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    
    foneprincipal: Optional[str] = None
    email: Optional[str] = None
    emailnfe: Optional[str] = None
    site: Optional[str] = None
    
    contato_comercial: Optional[str] = None
    celular_comercial: Optional[str] = None
    contato_financeiro: Optional[str] = None
    celular_financeiro: Optional[str] = None
    
    nomepai: Optional[str] = None
    nomemae: Optional[str] = None
    nomeconjuge: Optional[str] = None
    rgconjuge: Optional[str] = None
    datanascto: Optional[datetime] = None
    nasctoconjuge: Optional[datetime] = None
    sexo: Optional[str] = None
    ecivil: Optional[str] = None
    
    limicredito: Optional[float] = 0.0
    prazomax: Optional[int] = 0
    diafat: Optional[int] = 0
    conceito: Optional[str] = None
    datapricompra: Optional[datetime] = None
    dataultcompra: Optional[datetime] = None
    numcompra: Optional[int] = 0
    valpricompra: Optional[float] = 0.0
    valmaicompra: Optional[float] = 0.0
    valultcompra: Optional[float] = 0.0
    datacad: Optional[datetime] = None
    dataspc: Optional[datetime] = None

    obs: Optional[str] = None
    ref_spc: Optional[str] = None
    ref_fin: Optional[str] = None
    ref_com: Optional[str] = None
    ref_prod: Optional[str] = None

    codigoibge: Optional[int] = None
    id_area: Optional[int] = None
    id_regiao: Optional[int] = None
    id_vendedor: Optional[int] = None
    id_atividade: Optional[int] = None
    id_banco: Optional[int] = None
    
    contribuinte: Optional[bool] = True
    consumidor: Optional[bool] = True
    flagcliente: Optional[bool] = True
    flagfornecedor: Optional[bool] = False
    flagtranspotador: Optional[bool] = False
    flagcolaborador: Optional[bool] = False
    flagvendedor: Optional[bool] = False
    ativo: Optional[bool] = True

    class Config:
        from_attributes = True

class ContatoCreate(ContatoBase):
    enderecos: Optional[List[ContatoEnderecoCreate]] = []
    emails: Optional[List[ContatoEmailCreate]] = []
    infos: Optional[List[ContatoInfoCreate]] = []

class ContatoUpdate(ContatoBase):
    enderecos: Optional[List[ContatoEnderecoCreate]] = None
    emails: Optional[List[ContatoEmailCreate]] = None
    infos: Optional[List[ContatoInfoCreate]] = None

class Contato(ContatoBase):
    id: int
    enderecos: List[ContatoEndereco] = []
    emails: List[ContatoEmail] = []
    infos: List[ContatoInfo] = []

    class Config:
        from_attributes = True
