from sqlalchemy import text
from backend.database import engine

def check_servico():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'servico'"))
        for r in res:
            print(f"{r[0]}: {r[1]}")

if __name__ == "__main__":
    check_servico()
