from backend.app.schemas.mobos import MobOS as MobOSSchema
from backend.app.models.mobos import MobOS
from backend.database import SessionLocal
from sqlalchemy.orm import joinedload
import json

db = SessionLocal()
try:
    coletas = db.query(MobOS).options(
        joinedload(MobOS.pneus),
        joinedload(MobOS.contato),
        joinedload(MobOS.vendedor)
    ).all()
    
    print(f"Total de coletas: {len(coletas)}")
    for c in coletas:
        # Tenta validar com o Schema
        schema_obj = MobOSSchema.model_validate(c)
        print(f"OS {c.id} validada com sucesso.")
        
except Exception as e:
    print(f"ERRO DE VALIDAÇÃO/DB: {e}")
finally:
    db.close()
