import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlalchemy import text
from backend.database import SessionLocal

def check_tables():
    db = SessionLocal()
    try:
        # Check tables
        result = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        tables = [row[0] for row in result]
        print("Tabelas:", tables)
        
        if 'contato' in tables:
            res = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='contato'"))
            cols = [row[0] for row in res]
            print("Colunas de contato:", cols)
            
        if 'cliente' in tables:
            res = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='cliente'"))
            cols = [row[0] for row in res]
            print("Colunas de cliente:", cols)
            
    finally:
        db.close()

if __name__ == "__main__":
    check_tables()
