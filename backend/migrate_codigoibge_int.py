import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from backend.database import SessionLocal

def migrate_codigoibge_int():
    db = SessionLocal()
    try:
        # Tabela cidade
        print("Migrando tabela cidade...")
        result = db.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='cidade'"))
        cidade_cols = {row[0]: row[1] for row in result}
        
        if 'codibge' in cidade_cols:
            print("Renomeando e convertendo codibge para codigoibge (integer) na tabela cidade...")
            db.execute(text("ALTER TABLE cidade RENAME COLUMN codibge TO codigoibge;"))
            db.execute(text("UPDATE cidade SET codigoibge = NULL WHERE TRIM(codigoibge) = '';"))
            db.execute(text("ALTER TABLE cidade ALTER COLUMN codigoibge TYPE INTEGER USING (codigoibge::integer);"))
            print("Sucesso na tabela cidade.")
        elif 'codigoibge' in cidade_cols:
            print(f"A coluna codigoibge já existe (tipo: {cidade_cols['codigoibge']}).")
            if 'int' not in cidade_cols['codigoibge'].lower():
                db.execute(text("UPDATE cidade SET codigoibge = NULL WHERE TRIM(codigoibge) = '';"))
                db.execute(text("ALTER TABLE cidade ALTER COLUMN codigoibge TYPE INTEGER USING (codigoibge::integer);"))
                print("Convertido para Integer.")

        # Tabela contato
        print("Migrando tabela contato...")
        result_contato = db.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='contato'"))
        contato_cols = {row[0]: row[1] for row in result_contato}
        
        target_col = None
        target_type = None
        for col, dtype in contato_cols.items():
            if col.lower() == 'codigoibge':
                target_col = col
                target_type = dtype
                break
                
        if target_col:
            if target_col != 'codigoibge':
                print(f"Renomeando {target_col} para codigoibge...")
                db.execute(text(f'ALTER TABLE contato RENAME COLUMN "{target_col}" TO codigoibge;'))
            
            if 'int' not in target_type.lower():
                print("Convertendo coluna codigoibge para integer na tabela contato...")
                db.execute(text("UPDATE contato SET codigoibge = NULL WHERE TRIM(codigoibge) = '';"))
                db.execute(text("ALTER TABLE contato ALTER COLUMN codigoibge TYPE INTEGER USING (codigoibge::integer);"))
                print("Sucesso na tabela contato.")
            else:
                print("Coluna codigoibge na tabela contato já é Integer.")
        else:
            print("A coluna codigoibge não foi encontrada na tabela contato.")

        db.commit()
        print("Migração concluída com sucesso!")
        
    except Exception as e:
        db.rollback()
        print(f"Erro durante a migração: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_codigoibge_int()
