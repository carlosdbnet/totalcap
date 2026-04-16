from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class Contato(Base):
    __tablename__ = "contato"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True, nullable=False)
    razaosocial = Column(String, nullable=True)
    cpfcnpj = Column(String, index=True, nullable=True)
    pessoa = Column(String(1), nullable=True) # F/J
    rg = Column(String, nullable=True)
    emitenterg = Column(String, nullable=True)
    inscestadual = Column(String, nullable=True)
    inscmunicipio = Column(String, nullable=True)
    
    # Identificação Adicional
    tipodoc = Column(String, nullable=True)
    cxpostal = Column(String, nullable=True)
    codigopais = Column(String, nullable=True)
    nomepais = Column(String, nullable=True)
    
    # Endereço Principal (Capa)
    rua = Column(String, nullable=True)
    numcasa = Column(String, nullable=True)
    complemento = Column(String, nullable=True)
    bairro = Column(String, nullable=True)
    cep = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    uf = Column(String(2), nullable=True)
    
    # Contatos
    foneprincipal = Column(String, nullable=True)
    email = Column(String, nullable=True)
    emailnfe = Column(String, nullable=True)
    site = Column(String, nullable=True)
    
    # Contatos Adicionais (Financeiro/Comercial)
    contato_comercial = Column(String, nullable=True)
    celular_comercial = Column(String, nullable=True)
    contato_financeiro = Column(String, nullable=True)
    celular_financeiro = Column(String, nullable=True)
    
    # Social / Conjuge
    nomepai = Column(String, nullable=True)
    nomemae = Column(String, nullable=True)
    nomeconjuge = Column(String, nullable=True)
    rgconjuge = Column(String, nullable=True)
    datanascto = Column(DateTime, nullable=True)
    nasctoconjuge = Column(DateTime, nullable=True)
    sexo = Column(String(1), nullable=True)
    ecivil = Column(String(1), nullable=True)
    
    # Financeiro e Histórico
    limicredito = Column(Numeric, nullable=True)
    prazomax = Column(Integer, nullable=True)
    diafat = Column(Integer, nullable=True)
    conceito = Column(String, nullable=True)
    datapricompra = Column(DateTime, nullable=True)
    dataultcompra = Column(DateTime, nullable=True)
    numcompra = Column(Integer, nullable=True)
    valpricompra = Column(Numeric, nullable=True)
    valmaicompra = Column(Numeric, nullable=True)
    valultcompra = Column(Numeric, nullable=True)
    datacad = Column(DateTime, nullable=True)
    dataspc = Column(DateTime, nullable=True)
    
    # Referências e Observações
    obs = Column(Text, nullable=True)
    ref_spc = Column(Text, nullable=True)
    ref_fin = Column(Text, nullable=True)
    ref_com = Column(Text, nullable=True)
    ref_prod = Column(Text, nullable=True)
    
    # FKs Auxiliares
    id_cidade = Column(Integer, ForeignKey("cidade.id"), nullable=True)
    id_area = Column(Integer, ForeignKey("area.id"), nullable=True)
    id_regiao = Column(Integer, ForeignKey("regiao.id"), nullable=True)
    id_vendedor = Column(Integer, ForeignKey("vendedor.id"), nullable=True)
    id_atividade = Column(Integer, ForeignKey("atividade.id"), nullable=True)
    id_banco = Column(Integer, ForeignKey("banco.id"), nullable=True)
    contribuinte = Column(Boolean, default=True)
    consumidor = Column(Boolean, default=True)
    flagcliente = Column(Boolean, default=True)
    flagfornecedor = Column(Boolean, default=False)
    flagtranspotador = Column(Boolean, default=False)
    flagcolaborador = Column(Boolean, default=False)
    flagvendedor = Column(Boolean, default=False)
    ativo = Column(Boolean, default=True)
    
    # FKs Auxiliares
    id_cidade = Column(Integer, ForeignKey("cidade.id"), nullable=True)
    id_area = Column(Integer, ForeignKey("area.id"), nullable=True)
    id_regiao = Column(Integer, ForeignKey("regiao.id"), nullable=True)
    id_vendedor = Column(Integer, ForeignKey("vendedor.id"), nullable=True)
    id_atividade = Column(Integer, ForeignKey("atividade.id"), nullable=True)
    
    # Relationships
    cidade_rel = relationship("Cidade")
    area_rel = relationship("Area")
    regiao_rel = relationship("Regiao")
    vendedor_rel = relationship("Vendedor")
    atividade_rel = relationship("Atividade")
    banco_rel = relationship("Banco")
    
    enderecos = relationship("ContatoEndereco", back_populates="contato", cascade="all, delete-orphan")
    emails = relationship("ContatoEmail", back_populates="contato", cascade="all, delete-orphan")
    infos = relationship("ContatoInfo", back_populates="contato", cascade="all, delete-orphan")

class ContatoEndereco(Base):
    __tablename__ = "contato_endereco"
    id = Column(Integer, primary_key=True, index=True)
    id_contato = Column(Integer, ForeignKey("contato.id"))
    tipo = Column(String, nullable=True) # Entrega, Cobrança, etc.
    rua = Column(String, nullable=True)
    numcasa = Column(String, nullable=True)
    complemento = Column(String, nullable=True)
    bairro = Column(String, nullable=True)
    cep = Column(String, nullable=True)
    cidade = Column(String, nullable=True)
    uf = Column(String(2), nullable=True)
    fone = Column(String, nullable=True)
    celular = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    contato = relationship("Contato", back_populates="enderecos")

class ContatoEmail(Base):
    __tablename__ = "contato_email"
    id = Column(Integer, primary_key=True, index=True)
    id_contato = Column(Integer, ForeignKey("contato.id"))
    email = Column(String, nullable=False)
    tipo = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)
    
    contato = relationship("Contato", back_populates="emails")

class ContatoInfo(Base):
    __tablename__ = "contato_info"
    id = Column(Integer, primary_key=True, index=True)
    id_contato = Column(Integer, ForeignKey("contato.id"))
    tipo = Column(String, nullable=True)
    descricao = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)
    
    contato = relationship("Contato", back_populates="infos")
