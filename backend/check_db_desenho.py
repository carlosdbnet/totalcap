from sqlalchemy import text
from backend.database import engine

def check_desenho():
    with engine.connect() as conn:
        print("Checking columns for table 'desenho'...")
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'desenho'"))
        for r in res:
            print(f"{r[0]}: {r[1]}")

if __name__ == "__main__":
    check_desenho()
