import sys
import os

# Add the parent directory to sys.path so we can import backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from backend.database import SessionLocal

def migrate_codigoibge():
    db = SessionLocal()
    try:
        # Check if id_cidade exists and codigoibge doesn't
        result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='contato'"))
        columns = [row[0] for row in result]
        
        if 'codigoibge' not in columns and 'id_cidade' in columns:
            print("Migrando coluna id_cidade para codigoibge...")
            
            # Step 1: Add new column
            db.execute(text("ALTER TABLE contato ADD COLUMN codigoibge VARCHAR(7);"))
            
            # Step 2: Populate it using the existing id_cidade relation with cidade table
            db.execute(text("""
                UPDATE contato 
                SET codigoibge = cidade.codibge 
                FROM cidade 
                WHERE contato.id_cidade = cidade.id;
            """))
            
            # Step 3: Drop old column and its constraints (like foreign keys)
            db.execute(text("ALTER TABLE contato DROP COLUMN id_cidade CASCADE;"))
            
            db.commit()
            print("Migração concluída com sucesso.")
        elif 'codigoibge' in columns:
            print("A coluna codigoibge já existe.")
        else:
            print("A coluna id_cidade não foi encontrada e codigoibge também não.")
            
    except Exception as e:
        db.rollback()
        print(f"Erro durante a migração: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_codigoibge()
