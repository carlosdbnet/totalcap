from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class MobOS(Base):
    __tablename__ = "mobos"

    id = Column(Integer, primary_key=True, index=True)
    id_contato = Column(Integer, ForeignKey("contato.id"), nullable=False)
    dataos = Column(DateTime(timezone=True), server_default=func.now())
    qpneu = Column(Integer, default=0)
    vtotal = Column(Numeric(10, 2), default=0.00)
    msgmob = Column(Text, nullable=True)
    id_vendedor = Column(Integer, ForeignKey("vendedor.id"), nullable=True)
    datalan = Column(DateTime(timezone=True), server_default=func.now())
    sincronizado = Column(String(1), default="N") # S/N

    # Relacionamentos
    contato = relationship("Contato")
    vendedor = relationship("Vendedor")
    pneus = relationship("MobPneu", back_populates="coleta", cascade="all, delete-orphan")

class MobPneu(Base):
    __tablename__ = "mobpneu"

    id = Column(Integer, primary_key=True, index=True)
    id_mobos = Column(Integer, ForeignKey("mobos.id"), nullable=False)
    
    id_medida = Column(Integer, ForeignKey("medida.id"), nullable=True)
    id_marca = Column(Integer, ForeignKey("marca.id"), nullable=True)
    id_desenho = Column(Integer, ForeignKey("desenho.id"), nullable=True)
    id_recap = Column(Integer, ForeignKey("tiporecap.id"), nullable=True)
    
    valor = Column(Numeric(10, 2), default=0.00)
    piso = Column(String, nullable=True)
    numserie = Column(String, nullable=True)
    numfogo = Column(String, nullable=True)
    dot = Column(String, nullable=True)
    doriginal = Column(String, nullable=True)
    qreforma = Column(Integer, default=0)
    uso = Column(String, nullable=True)
    garantia = Column(String, nullable=True)
    obs = Column(Text, nullable=True)
    medidanova = Column(String, nullable=True)
    marcanova = Column(String, nullable=True)
    
    id_vendedor = Column(Integer, ForeignKey("vendedor.id"), nullable=True)
    datalan = Column(DateTime(timezone=True), server_default=func.now())
    sincronizado = Column(String(1), default="N")

    # Relacionamentos
    coleta = relationship("MobOS", back_populates="pneus")
    medida = relationship("Medida")
    marca = relationship("Marca")
    desenho = relationship("Desenho")
    tiporecap = relationship("TipoRecapagem")
    vendedor = relationship("Vendedor")
