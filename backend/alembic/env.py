from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.config import settings
from backend.app.models.base import Base
# Importar todos os modelos aqui para que o Alembic os detecte
from backend.app.models.cliente import Cliente
from backend.app.models.contato import Contato, ContatoEndereco
from backend.app.models.area import Area
from backend.app.models.regiao import Regiao
from backend.app.models.atividade import Atividade
from backend.app.models.vendedor import Vendedor
from backend.app.models.empresa import Empresa
from backend.app.models.cidade import Cidade
from backend.app.models.estado import Estado
from backend.app.models.medida import Medida
from backend.app.models.marca import Marca
from backend.app.models.desenho import Desenho
from backend.app.models.tiporecap import TipoRecapagem
from backend.app.models.servico import Servico
from backend.app.models.setor import Setor
from backend.app.models.departamento import Departamento
from backend.app.models.operador import Operador
from backend.app.models.banco import Banco
from backend.app.models.transportadora import Transportadora
from backend.app.models.usuario import Usuario
from backend.app.models.ordem_servico import OrdemServico, OSPneu

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """

    def include_object(object, name, type_, reflected, compare_to):
        if type_ == "table" and reflected and name not in target_metadata.tables:
            return False
        return True

    url = settings.POSTGRES_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = settings.POSTGRES_URL
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    def include_object(object, name, type_, reflected, compare_to):
        if type_ == "table" and reflected and name not in target_metadata.tables:
            return False
        return True

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
