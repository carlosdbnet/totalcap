from sqlalchemy import text
from backend.database import engine

def check_cliente_contato():
    tables = ['clientes', 'contato', 'contato_endereco', 'contato_email', 'contato_info']
    with engine.connect() as conn:
        for table in tables:
            print(f"\n--- Table: {table} ---")
            res = conn.execute(text(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'"))
            rows = res.all()
            if not rows:
                print(f"Table '{table}' does not exist.")
            for r in rows:
                print(f"{r[0]}: {r[1]}")

if __name__ == "__main__":
    check_cliente_contato()
