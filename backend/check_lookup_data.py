import sys
import os
sys.path.append(os.getcwd())

from backend.database import SessionLocal
from sqlalchemy import text

def check_lookups():
    db = SessionLocal()
    tables = ['medida', 'marca', 'desenho', 'servico', 'tiporecap']
    try:
        for t in tables:
            try:
                count = db.execute(text(f"SELECT count(*) FROM {t}")).scalar()
                print(f"Tabela {t}: {count} registros")
            except Exception as e:
                print(f"Erro ao acessar tabela {t}: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_lookups()
