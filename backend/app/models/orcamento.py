from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from backend.app.models.base import Base

class Orcamento(Base):
    __tablename__ = "orcamento"

    id = Column(Integer, primary_key=True, index=True)
    id_ordem = Column(Integer, ForeignKey("ordemservico.id"), nullable=True)
    id_contato = Column(Integer, ForeignKey("contato.id"), nullable=True)
    id_vendedor = Column(Integer, ForeignKey("vendedor.id"), nullable=True)
    
    # Cabeçalho do Orçamento (Capa)
    datamov = Column(DateTime, default=func.now())
    vtotal = Column(Numeric(12, 2), default=0)
    vdesconto = Column(Numeric(12, 2), default=0)
    validade = Column(String, nullable=True)
    condicao = Column(String, nullable=True)
    obs = Column(Text, nullable=True)
    
    # Dados do Cliente (Snapshot no momento do orçamento)
    nome = Column(String, nullable=True)
    nomeresp = Column(String, nullable=True)
    foneresp = Column(String, nullable=True)
    email1 = Column(String, nullable=True)
    email2 = Column(String, nullable=True)
    
    # Endereço de Entrega (Snapshot)
    rua = Column(String, nullable=True)
    numcasa = Column(String, nullable=True)
    complemento = Column(String, nullable=True)
    bairro = Column(String, nullable=True)
    cep = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    uf = Column(String(2), nullable=True)
    cxpostal = Column(String, nullable=True)
    
    # Telefones e Contatos (Snapshot)
    foneres = Column(String, nullable=True)
    fonecom = Column(String, nullable=True)
    fax = Column(String, nullable=True)
    celular = Column(String, nullable=True)
    contato = Column(String, nullable=True)
    
    userlan = Column(String, nullable=True)
    datalan = Column(DateTime, server_default=func.now())

    # Relationships
    cli_contato = relationship("Contato")
    vendedor = relationship("Vendedor")
    items = relationship("OrcamentoItem", back_populates="orcamento", cascade="all, delete-orphan")

class OrcamentoItem(Base):
    __tablename__ = "orcamentoitem"

    id = Column(Integer, primary_key=True, index=True)
    id_orcam = Column(Integer, ForeignKey("orcamento.id"))
    id_medida = Column(Integer, ForeignKey("medida.id"), nullable=True)
    id_desenho = Column(Integer, ForeignKey("desenho.id"), nullable=True)
    id_recap = Column(Integer, ForeignKey("tiporecap.id"), nullable=True)
    
    descricao = Column(String, nullable=True)
    medida = Column(String, nullable=True)
    marca = Column(String, nullable=True)
    servico = Column(String, nullable=True)
    desenho = Column(String, nullable=True)
    numfogo = Column(String, nullable=True)
    dot = Column(String, nullable=True)
    
    quant = Column(Numeric(12, 2), default=1)
    valor = Column(Numeric(12, 2), default=0)
    vrtotal = Column(Numeric(12, 2), default=0)

    orcamento = relationship("Orcamento", back_populates="items")
