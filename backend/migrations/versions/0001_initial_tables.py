"""initial tables

Revision ID: 0001
Revises: 
Create Date: 2026-07-12 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. wellbeing_challenges table
    op.create_table(
        'wellbeing_challenges',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('target_frequency', sa.Integer(), nullable=False),
        sa.Column('cycle_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. activity_logs table
    op.create_table(
        'activity_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('employee_id', sa.UUID(), nullable=False),
        sa.Column('challenge_id', sa.UUID(), nullable=False),
        sa.Column('activity_type', sa.String(length=100), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('proof_url', sa.String(length=1024), nullable=True),
        sa.Column('date_logged', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['challenge_id'], ['wellbeing_challenges.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_activity_logs_date_logged'), 'activity_logs', ['date_logged'], unique=False)
    op.create_index(op.f('ix_activity_logs_employee_id'), 'activity_logs', ['employee_id'], unique=False)
    op.create_index(op.f('ix_activity_logs_challenge_id'), 'activity_logs', ['challenge_id'], unique=False)

    # 4. employee_participations table
    op.create_table(
        'employee_participations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('employee_id', sa.UUID(), nullable=False),
        sa.Column('activity_id', sa.UUID(), nullable=True),
        sa.Column('proof_url', sa.String(length=1024), nullable=True),
        sa.Column('approval_status', sa.String(length=50), nullable=False),
        sa.Column('points_earned', sa.Integer(), nullable=False),
        sa.Column('vouch_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['activity_id'], ['activity_logs.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_employee_participations_approval_status'), 'employee_participations', ['approval_status'], unique=False)
    op.create_index(op.f('ix_employee_participations_employee_id'), 'employee_participations', ['employee_id'], unique=False)
    op.create_index(op.f('ix_employee_participations_activity_id'), 'employee_participations', ['activity_id'], unique=False)

    # 5. peer_verifications table
    op.create_table(
        'peer_verifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('participation_id', sa.UUID(), nullable=False),
        sa.Column('voucher_employee_id', sa.UUID(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['participation_id'], ['employee_participations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['voucher_employee_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('participation_id', 'voucher_employee_id', name='uq_participation_voucher')
    )
    op.create_index(op.f('ix_peer_verifications_participation_id'), 'peer_verifications', ['participation_id'], unique=False)
    op.create_index(op.f('ix_peer_verifications_voucher_employee_id'), 'peer_verifications', ['voucher_employee_id'], unique=False)

    # 6. streak_reward_logs table
    op.create_table(
        'streak_reward_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('employee_id', sa.UUID(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('week_number', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('employee_id', 'year', 'week_number', name='uq_employee_streak_week')
    )
    op.create_index(op.f('ix_streak_reward_logs_employee_id'), 'streak_reward_logs', ['employee_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_streak_reward_logs_employee_id'), table_name='streak_reward_logs')
    op.drop_table('streak_reward_logs')
    op.drop_index(op.f('ix_peer_verifications_voucher_employee_id'), table_name='peer_verifications')
    op.drop_index(op.f('ix_peer_verifications_participation_id'), table_name='peer_verifications')
    op.drop_table('peer_verifications')
    op.drop_index(op.f('ix_employee_participations_activity_id'), table_name='employee_participations')
    op.drop_index(op.f('ix_employee_participations_employee_id'), table_name='employee_participations')
    op.drop_index(op.f('ix_employee_participations_approval_status'), table_name='employee_participations')
    op.drop_table('employee_participations')
    op.drop_index(op.f('ix_activity_logs_challenge_id'), table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_employee_id'), table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_date_logged'), table_name='activity_logs')
    op.drop_table('activity_logs')
    op.drop_table('wellbeing_challenges')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
