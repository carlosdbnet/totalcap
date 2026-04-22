import sys
import os
sys.path.append(os.getcwd())

from sqlalchemy import text
from backend.database import engine

def check_db():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'mobos'"))
        columns = [r[0] for r in res]
        print(f"Columns in 'mobos': {columns}")

if __name__ == "__main__":
    check_db()
