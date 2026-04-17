import sys
import os
sys.path.append(os.getcwd())

import psycopg2
from backend.app.schemas.mobos import MobOS as MobOSSchema
from backend.app.models.mobos import MobOS
from backend.database import SessionLocal
from sqlalchemy.orm import joinedload

# 1. Check Data in DB directly
db_url = "postgresql://neondb_owner:npg_TBWgl4SM1Ejn@ep-morning-water-acsrbm4u-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute("SELECT id, id_contato, id_vendedor, numeroos, sincronizado FROM mobos")
rows = cur.fetchall()
print(f"Linhas em mobos (DB): {rows}")

cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'mobpneu'")
pneu_cols = [c[0] for c in cur.fetchall()]
print(f"Colunas em mobpneu: {pneu_cols}")

conn.close()

# 2. Check SQLAlchemy and Pydantic
db = SessionLocal()
try:
    print("\nTestando SQLAlchemy...")
    coletas = db.query(MobOS).options(
        joinedload(MobOS.pneus),
        joinedload(MobOS.contato),
        joinedload(MobOS.vendedor)
    ).all()
    print(f"Coletas carregadas pelo SQLAlchemy: {len(coletas)}")
    
    for c in coletas:
        print(f"Validando OS {c.id}...")
        try:
            data = MobOSSchema.model_validate(c)
            print(f"OS {c.id} validada com sucesso!")
        except Exception as ve:
            print(f"ERRO DE VALIDAÇAO na OS {c.id}: {ve}")
            
except Exception as e:
    print(f"ERRO GERAL: {e}")
finally:
    db.close()
