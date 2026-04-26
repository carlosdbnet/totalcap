from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class OrdemServico(Base):
    __tablename__ = "ordemservico"

    id = Column(Integer, primary_key=True, index=True)
    id_empresa = Column(Integer, default=1)
    numos = Column(Integer, unique=True, index=True, nullable=False)
    dataentrada = Column(DateTime, server_default=func.now())
    dataprevisao = Column(DateTime, nullable=True)
    
    id_contato = Column(Integer, ForeignKey("contato.id"), nullable=False)
    id_vendedor = Column(Integer, ForeignKey("vendedor.id"), nullable=True)
    id_planopag = Column(Integer, ForeignKey("planopag.id"), nullable=True)
    
    status = Column(String, default="A") # Mapeado: A=Aberta, P=Produção, F=Finalizada, C=Cancelada
    
    id_mobos = Column(Integer, nullable=True)     # ID da coleta mobos
    obs_fatura = Column(Text, nullable=True)     # Observação da OS

    # Campos Financeiros
    vrservico = Column(Numeric(10, 2), default=0.00)
    vrproduto = Column(Numeric(10, 2), default=0.00)
    vrcarcaca = Column(Numeric(10, 2), default=0.00)
    vrbonus = Column(Numeric(10, 2), default=0.00)
    vrmontagem = Column(Numeric(10, 2), default=0.00)
    vrtotal = Column(Numeric(10, 2), default=0.00)
    pcomissao = Column(Numeric(10, 2), default=0.00)
    vrcomissao = Column(Numeric(10, 2), default=0.00)

    datalan = Column(DateTime, server_default=func.now())
    userlan = Column(String, nullable=True)

    # Relacionamentos
    contato = relationship("Contato")
    vendedor = relationship("Vendedor")
    pneus = relationship("OSPneu", back_populates="os", cascade="all, delete-orphan")

class OSPneu(Base):
    __tablename__ = "pneu"

    id = Column(Integer, primary_key=True, index=True)
    id_ordem = Column(Integer, ForeignKey("ordemservico.id"), nullable=False)
    id_empresa = Column(Integer, default=1)
    
    id_medida = Column(Integer, ForeignKey("medida.id"), nullable=True)
    id_marca = Column("id_produto", Integer, ForeignKey("produto.id"), nullable=True)
    id_desenho = Column(Integer, ForeignKey("desenho.id"), nullable=True)
    id_recap = Column(Integer, ForeignKey("tiporecap.id"), nullable=True)
    id_servico = Column(Integer, ForeignKey("servico.id"), nullable=True)
    
    numserie = Column(String, nullable=True)
    numfogo = Column(String, nullable=True)
    dot = Column(String, nullable=True)
    valor = Column(Numeric(10, 2), default=0.00)
    statuspro = Column(Boolean, default=False) # True=Em Produção
    statusfat = Column(Boolean, default=False) # True=Faturado/Pronto
    codbarra = Column(String, nullable=True) # Código de barras para identificação
    placa = Column(String, nullable=True)
    desenhoriginal = Column(String, nullable=True)
    
    obs = Column(Text, nullable=True)
    
    # Campos obrigatórios do banco legado
    id_contato = Column(Integer, nullable=False)
    id_vendedor = Column(Integer, nullable=False)
    qreforma = Column(Integer, default=0, nullable=False)
    quant = Column(Integer, default=1, nullable=False)
    
    # Campos financeiros extras obrigatórios
    vrtotal = Column(Numeric(10, 2), default=0.00, nullable=False)
    vrtabela = Column(Numeric(10, 2), default=0.00, nullable=False)
    pdescto = Column(Numeric(10, 2), default=0.00, nullable=False)
    vrdescto = Column(Numeric(10, 2), default=0.00, nullable=False)
    valornfe = Column(Numeric(10, 2), default=0.00, nullable=False)
    vrservico = Column(Numeric(10, 2), default=0.00, nullable=False)
    vrcarcaca = Column(Numeric(10, 2), default=0.00, nullable=False)
    vrcustomp = Column(Numeric(10, 2), default=0.00, nullable=False)
    vrcustosrv = Column(Numeric(10, 2), default=0.00, nullable=False)
    qservico = Column(Numeric(10, 2), default=0.00, nullable=False)
    id_fatura = Column(Integer, ForeignKey("fatura.id"), nullable=True)

    datalan = Column(DateTime, server_default=func.now())

    # Relacionamentos
    os = relationship("OrdemServico", back_populates="pneus")
    medida = relationship("Medida")
    marca = relationship("Produto")
    desenho = relationship("Desenho")
    servico = relationship("Servico")
    tiporecap = relationship("TipoRecapagem")
    fatura = relationship("Fatura", back_populates="pneus")
