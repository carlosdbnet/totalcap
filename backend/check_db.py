from backend.database import SessionLocal
from backend.app.models.area import Area
from backend.app.models.regiao import Regiao
from sqlalchemy import text

def check_db():
    db = SessionLocal()
    try:
        # Check tables existence
        print("Verificando tabelas no banco...")
        for table in ["area", "regiao"]:
            result = db.execute(text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}')")).scalar()
            print(f"Tabela '{table}' existe: {result}")
            
            if result:
                count = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print(f"Registros em '{table}': {count}")
    except Exception as e:
        print(f"Erro ao verificar banco: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
