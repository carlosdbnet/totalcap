from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base
# Importar modelos relacionados para registro no SQLAlchemy
from backend.app.models.contato import Contato
from backend.app.models.vendedor import Vendedor
from backend.app.models.medida import Medida
from backend.app.models.marca import Marca
from backend.app.models.desenho import Desenho
from backend.app.models.tiporecap import TipoRecapagem
from backend.app.models.cidade import Cidade
from backend.app.models.area import Area
from backend.app.models.regiao import Regiao
from backend.app.models.atividade import Atividade
from backend.app.models.banco import Banco
from backend.app.models.estado import Estado

class MobOS(Base):
    __tablename__ = "mobos"

    id = Column(Integer, primary_key=True, index=True)
    id_contato = Column(Integer, ForeignKey("contato.id"), nullable=True)
    dataos = Column(DateTime(timezone=True), server_default=func.now())
    qpneu = Column(Integer, default=0)
    vtotal = Column(Numeric(10, 2), default=0.00)
    msgmob = Column(Text, nullable=True)
    id_vendedor = Column(Integer, ForeignKey("vendedor.id"), nullable=False)
    
    # Novos Campos solicitados pelo usuário (Normalizados para minúsculo)
    numos = Column(Integer, nullable=True)
    cpfcnpj = Column(String, nullable=True)
    nome = Column(String, nullable=True)
    endereco = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    uf = Column(String, nullable=True)
    fone = Column(String, nullable=True)
    veiculo = Column(String, nullable=True)
    formapagto = Column(String, nullable=True)
    vendedor_ocr = Column("vendedor", String, nullable=True)
    servicocomgarantia = Column(String, nullable=True)
    tipoveiculo = Column(String, nullable=True)
    somentesepar = Column(String, nullable=True)
    podealterardesenho = Column(String, nullable=True)

    datalan = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="")

    # Relacionamentos
    contato = relationship("Contato")
    vendedor = relationship("Vendedor")
    pneus = relationship("MobPneu", back_populates="coleta", cascade="all, delete-orphan")

class MobPneu(Base):
    __tablename__ = "mobpneu"

    id = Column(Integer, primary_key=True, index=True)
    id_mobos = Column(Integer, ForeignKey("mobos.id"), nullable=False)
    
    id_medida = Column(Integer, ForeignKey("medida.id"), nullable=True)
    id_marca = Column("id_produto", Integer, ForeignKey("marca.id"), nullable=True)
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
    desenhonovo = Column(String, nullable=True)
    
    datalan = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    coleta = relationship("MobOS", back_populates="pneus")
    medida = relationship("Medida")
    marca = relationship("Marca")
    desenho = relationship("Desenho")
    tiporecap = relationship("TipoRecapagem")
