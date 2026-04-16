"""create_os_tables

Revision ID: 79ffb3146ceb
Revises: c9f225ef4367
Create Date: 2026-04-16 09:16:20.707511

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '79ffb3146ceb'
down_revision: Union[str, Sequence[str], None] = 'c9f225ef4367'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. ORDEM_SERVICO
    op.create_table(
        'ordem_servico',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('numero_os', sa.String(), nullable=False),
        sa.Column('data_emissao', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('data_previsao', sa.DateTime(timezone=True), nullable=True),
        sa.Column('id_cliente', sa.Integer(), nullable=False),
        sa.Column('id_vendedor', sa.Integer(), nullable=True),
        sa.Column('id_transportadora', sa.Integer(), nullable=True),
        sa.Column('observacao', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('atualizado_em', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['id_cliente'], ['clientes.id'], ),
        sa.ForeignKeyConstraint(['id_transportadora'], ['transportadora.id'], ),
        sa.ForeignKeyConstraint(['id_vendedor'], ['vendedor.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ordem_servico_id'), 'ordem_servico', ['id'], unique=False)
    op.create_index(op.f('ix_ordem_servico_numero_os'), 'ordem_servico', ['numero_os'], unique=True)

    # 2. OS_PNEU
    op.create_table(
        'os_pneu',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('id_os', sa.Integer(), nullable=False),
        sa.Column('id_medida', sa.Integer(), nullable=True),
        sa.Column('id_marca', sa.Integer(), nullable=True),
        sa.Column('id_desenho', sa.Integer(), nullable=True),
        sa.Column('id_servico', sa.Integer(), nullable=True),
        sa.Column('id_tiporecap', sa.Integer(), nullable=True),
        sa.Column('serie', sa.String(), nullable=True),
        sa.Column('dot', sa.String(), nullable=True),
        sa.Column('matricula', sa.String(), nullable=True),
        sa.Column('valor', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('status_item', sa.String(), nullable=True),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['id_desenho'], ['desenho.id'], ),
        sa.ForeignKeyConstraint(['id_marca'], ['marca.id'], ),
        sa.ForeignKeyConstraint(['id_medida'], ['medida.id'], ),
        sa.ForeignKeyConstraint(['id_os'], ['ordem_servico.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['id_servico'], ['servico.id'], ),
        sa.ForeignKeyConstraint(['id_tiporecap'], ['tiporecap.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_os_pneu_id'), 'os_pneu', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_os_pneu_id'), table_name='os_pneu')
    op.drop_table('os_pneu')
    op.drop_index(op.f('ix_ordem_servico_numero_os'), table_name='ordem_servico')
    op.drop_index(op.f('ix_ordem_servico_id'), table_name='ordem_servico')
    op.drop_table('ordem_servico')
