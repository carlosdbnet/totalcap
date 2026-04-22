from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class PneuServico(Base):
    __tablename__ = "pneu_servico"

    id = Column(Integer, primary_key=True, index=True)
    id_pneu = Column(Integer, ForeignKey("pneu.id"), nullable=False)
    id_servico = Column(Integer, ForeignKey("servico.id"), nullable=False)
    id_ordem = Column(Integer, ForeignKey("ordemservico.id"), nullable=True)
    id_empresa = Column(Integer, default=1)
    
    quant = Column(Integer, default=1)
    valor = Column(Numeric(10, 2), default=0.00)
    vrtotal = Column(Numeric(10, 2), default=0.00)
    vrtabela = Column(Numeric(10, 2), default=0.00)
    
    pdescto = Column(Numeric(10, 2), default=0.00)
    pzmedio = Column(Numeric(10, 2), default=0.00)
    pcomissao = Column(Numeric(10, 2), default=0.00)
    vrcomissao = Column(Numeric(10, 2), default=0.00)
    
    id_fatura = Column(Integer, nullable=True)
    id_tabela = Column(Integer, nullable=True)
    
    datapro = Column(DateTime, nullable=True)
    datafat = Column(DateTime, nullable=True)
    datalan = Column(DateTime, server_default=func.now())
    userlan = Column(String(20), nullable=True)

    # Relacionamentos
    pneu = relationship("OSPneu")
    servico = relationship("Servico")
    os = relationship("OrdemServico")
