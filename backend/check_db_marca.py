from sqlalchemy import text
from backend.database import engine

def check_marca():
    with engine.connect() as conn:
        print("Checking columns for table 'marca'...")
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'marca'"))
        for r in res:
            print(f"{r[0]}: {r[1]}")

if __name__ == "__main__":
    check_marca()
