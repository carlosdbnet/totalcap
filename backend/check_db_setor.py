from sqlalchemy import text
from backend.database import engine

def check_setor():
    with engine.connect() as conn:
        print("Checking if 'setor' table exists and its columns...")
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'setor'"))
        rows = res.all()
        if not rows:
            print("Table 'setor' does not exist.")
        for r in rows:
            print(f"{r[0]}: {r[1]}")

if __name__ == "__main__":
    check_setor()
