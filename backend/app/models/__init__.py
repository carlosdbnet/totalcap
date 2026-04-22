from backend.app.models.base import Base
from backend.app.models.apontamento import Apontamento
from backend.app.models.area import Area
from backend.app.models.atividade import Atividade
from backend.app.models.banco import Banco
from backend.app.models.cidade import Cidade
from backend.app.models.contato import Contato, ContatoEndereco, ContatoEmail, ContatoInfo
from backend.app.models.departamento import Departamento
from backend.app.models.desenho import Desenho
from backend.app.models.empresa import Empresa
from backend.app.models.estado import Estado
from backend.app.models.marca import Marca
from backend.app.models.medida import Medida
from backend.app.models.mobos import MobOS, MobPneu
from backend.app.models.operador import Operador
from backend.app.models.ordem_servico import OrdemServico, OSPneu
from backend.app.models.regiao import Regiao
from backend.app.models.servico import Servico
from backend.app.models.setor import Setor
from backend.app.models.tiporecap import TipoRecapagem
from backend.app.models.transportadora import Transportadora
from backend.app.models.usuario import Usuario
from backend.app.models.vendedor import Vendedor
from backend.app.models.produto import Produto
from backend.app.models.grupo_produto import GrupoProduto
from backend.app.models.fatura import Fatura, FaturaServico, FaturaParcela
from backend.app.models.planopag import PlanoPag
from backend.app.models.tipodocto import TipoDocto
from backend.app.models.despesa import Despesa
from backend.app.models.veiculo import Veiculo
from backend.app.models.notadesp import Notadesp
from backend.app.models.notadesp_item import NotadespItem
