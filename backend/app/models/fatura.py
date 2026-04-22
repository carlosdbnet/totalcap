from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class Fatura(Base):
    __tablename__ = "fatura"

    id = Column(Integer, primary_key=True, index=True)
    id_empresa = Column(Integer, default=1)
    
    id_contato = Column(Integer, ForeignKey("contato.id"), nullable=False)
    id_planopag = Column(Integer, ForeignKey("planopag.id"), nullable=True)
    id_vendedor = Column(Integer, ForeignKey("vendedor.id"), nullable=True)
    id_tipodocto = Column(Integer, nullable=True)
    id_banco = Column(Integer, nullable=True)
    
    datafat = Column(DateTime, server_default=func.now())
    
    # Valores totais (somatório dos pneus)
    vrservico = Column(Numeric(10, 2), default=0.00)
    vrproduto = Column(Numeric(10, 2), default=0.00)
    vrcarcaca = Column(Numeric(10, 2), default=0.00)
    vrmontagem = Column(Numeric(10, 2), default=0.00)
    vrbonus = Column(Numeric(10, 2), default=0.00)
    vrtotal = Column(Numeric(10, 2), default=0.00)
    
    obs = Column(Text, nullable=True)
    
    userlan = Column(String, nullable=True)
    datalan = Column(DateTime, server_default=func.now())

    # Relacionamentos
    contato = relationship("Contato")
    planopag = relationship("PlanoPag")
    vendedor = relationship("Vendedor")
    pneus = relationship("OSPneu", back_populates="fatura")
    items = relationship("FaturaServico", back_populates="fatura", cascade="all, delete-orphan", foreign_keys="FaturaServico.id_fatura")
    parcelas = relationship("FaturaParcela", back_populates="fatura", cascade="all, delete-orphan", foreign_keys="FaturaParcela.id_fatura")

class FaturaServico(Base):
    __tablename__ = "fatura_servico"

    id = Column(Integer, primary_key=True, index=True)
    id_fatura = Column(Integer, ForeignKey("fatura.id"), nullable=False)
    id_empresa = Column(Integer, default=1)
    id_pneu = Column(Integer, ForeignKey("pneu.id"), nullable=True)
    id_pneusrv = Column(Integer, nullable=True)
    id_servico = Column(String(3), ForeignKey("servico.id"), nullable=True)
    codservico = Column(String(15), nullable=True)
    
    descricao = Column(String(255), nullable=True)
    vrtabela = Column(Numeric(10, 2), default=0.00)
    pdescto = Column(Numeric(10, 2), default=0.00)
    vrdescto = Column(Numeric(10, 2), default=0.00)
    valor = Column(Numeric(10, 2), default=0.00)
    quant = Column(Numeric(10, 2), default=1.0)
    vrtotal = Column(Numeric(10, 2), default=0.00)
    pcomissao = Column(Numeric(10, 2), default=0.00)

    userlan = Column(String(20), nullable=True)
    datalan = Column(DateTime, server_default=func.now())

    # Relacionamentos
    fatura = relationship("Fatura", back_populates="items")
    pneu = relationship("OSPneu")
    servico = relationship("Servico")

class FaturaParcela(Base):
    __tablename__ = "fatura_parcela"

    id = Column(Integer, primary_key=True, index=True)
    id_fatura = Column(Integer, ForeignKey("fatura.id"), nullable=False)
    id_empresa = Column(Integer, default=1)
    id_contato = Column(Integer, nullable=True)
    id_vendedor = Column(Integer, nullable=True)
    id_banco = Column(Integer, nullable=True)
    id_tipodocto = Column(Integer, nullable=True)
    
    datafat = Column(DateTime, nullable=True)
    vencto = Column(DateTime, nullable=True)
    valor = Column(Numeric(10, 2), default=0.00)
    
    pcomiss = Column(Numeric(10, 2), default=0.00)
    vrcomiss = Column(Numeric(10, 2), default=0.00)
    
    # Check fields
    chbanco = Column(String(3), nullable=True)
    chagencia = Column(String(4), nullable=True)
    chconta = Column(String(10), nullable=True)
    chnumcero = Column(String(20), nullable=True)
    chcpfcnpj = Column(String(18), nullable=True)
    chemitente = Column(String(80), nullable=True)
    chdataemi = Column(DateTime, nullable=True)
    
    userlan = Column(String(20), nullable=True)
    datalan = Column(DateTime, server_default=func.now())

    # Relacionamentos
    fatura = relationship("Fatura", back_populates="parcelas")
