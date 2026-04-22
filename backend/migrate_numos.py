import sys
import os

# Adiciona o diretório atual ao sys.path para encontrar o módulo 'backend'
sys.path.append(os.getcwd())

from sqlalchemy import text
from backend.database import engine

def migrate():
    with engine.begin() as conn:
        print("Renaming mobos.numeroos to numos...")
        try:
            conn.execute(text("ALTER TABLE mobos RENAME COLUMN numeroos TO numos"))
            print("Success!")
        except Exception as e:
            if "already exists" in str(e) or "not found" in str(e):
                print(f"Bypassing: {e}")
            else:
                raise e

if __name__ == "__main__":
    migrate()
