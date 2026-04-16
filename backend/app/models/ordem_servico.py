from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class OrdemServico(Base):
    __tablename__ = "ordem_servico"

    id = Column(Integer, primary_key=True, index=True)
    numero_os = Column(String, unique=True, index=True, nullable=False)
    data_emissao = Column(DateTime(timezone=True), server_default=func.now())
    data_previsao = Column(DateTime(timezone=True), nullable=True)
    
    id_cliente = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    id_vendedor = Column(Integer, ForeignKey("vendedor.id"), nullable=True)
    id_transportadora = Column(Integer, ForeignKey("transportadora.id"), nullable=True)
    
    observacao = Column(Text, nullable=True)
    status = Column(String, default="ABERTA") # ABERTA, PRODUCAO, FINALIZADA, CANCELADA
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamentos
    cliente = relationship("Cliente")
    vendedor = relationship("Vendedor")
    transportadora = relationship("Transportadora")
    pneus = relationship("OSPneu", back_populates="os", cascade="all, delete-orphan")

class OSPneu(Base):
    __tablename__ = "os_pneu"

    id = Column(Integer, primary_key=True, index=True)
    id_os = Column(Integer, ForeignKey("ordem_servico.id"), nullable=False)
    
    id_medida = Column(Integer, ForeignKey("medida.id"), nullable=True)
    id_marca = Column(Integer, ForeignKey("marca.id"), nullable=True)
    id_desenho = Column(Integer, ForeignKey("desenho.id"), nullable=True)
    id_servico = Column(Integer, ForeignKey("servico.id"), nullable=True)
    id_tiporecap = Column(Integer, ForeignKey("tiporecap.id"), nullable=True)
    
    serie = Column(String, nullable=True)
    dot = Column(String, nullable=True)
    matricula = Column(String, nullable=True)
    valor = Column(Numeric(10, 2), default=0.00)
    status_item = Column(String, default="AGUARDANDO") # AGUARDANDO, PROCESSO, PRONTO
    
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    os = relationship("OrdemServico", back_populates="pneus")
    medida = relationship("Medida")
    marca = relationship("Marca")
    desenho = relationship("Desenho")
    servico = relationship("Servico")
    tiporecap = relationship("TipoRecapagem")
