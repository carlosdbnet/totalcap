from sqlalchemy import create_engine, text
import sys
import os

sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))
from config import settings

engine = create_engine(settings.POSTGRES_URL)

with engine.connect() as conn:
    print("Checking 'id_banco' in 'contato'...")
    try:
        conn.execute(text("ALTER TABLE contato ADD COLUMN id_banco INTEGER REFERENCES banco(id)"))
        conn.commit()
        print("Column 'id_banco' added successfully.")
    except Exception as e:
        print(f"Note: {e}")
