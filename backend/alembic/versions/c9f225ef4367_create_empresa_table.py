"""create_empresa_table

Revision ID: c9f225ef4367
Revises: 41de1c660455
Create Date: 2026-04-16 08:50:05.351664

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9f225ef4367'
down_revision: Union[str, Sequence[str], None] = '41de1c660455'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'empresa',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(), nullable=False),
        sa.Column('razaosocial', sa.String(), nullable=True),
        sa.Column('endereco', sa.String(), nullable=True),
        sa.Column('numcasa', sa.String(), nullable=True),
        sa.Column('bairro', sa.String(), nullable=True),
        sa.Column('cep', sa.String(), nullable=True),
        sa.Column('cidade', sa.String(), nullable=True),
        sa.Column('uf', sa.String(length=2), nullable=True),
        sa.Column('telefone', sa.String(), nullable=True),
        sa.Column('cxpostal', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('cnpj', sa.String(), nullable=True),
        sa.Column('inscestadual', sa.String(), nullable=True),
        sa.Column('inscmunicipio', sa.String(), nullable=True),
        sa.Column('token', sa.String(), nullable=True),
        sa.Column('ativo', sa.Boolean(), nullable=True),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('atualizado_em', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_empresa_cnpj'), 'empresa', ['cnpj'], unique=True)
    op.create_index(op.f('ix_empresa_id'), 'empresa', ['id'], unique=False)
    op.create_index(op.f('ix_empresa_nome'), 'empresa', ['nome'], unique=False)
    op.create_index(op.f('ix_empresa_razaosocial'), 'empresa', ['razaosocial'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_empresa_razaosocial'), table_name='empresa')
    op.drop_index(op.f('ix_empresa_nome'), table_name='empresa')
    op.drop_index(op.f('ix_empresa_id'), table_name='empresa')
    op.drop_index(op.f('ix_empresa_cnpj'), table_name='empresa')
    op.drop_table('empresa')
