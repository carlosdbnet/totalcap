from backend.database import engine
from sqlalchemy import text

def reset_tables():
    print("Limpando tabela area...")
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS area CASCADE"))
        conn.commit()
    print("Sucesso!")

if __name__ == "__main__":
    reset_tables()
