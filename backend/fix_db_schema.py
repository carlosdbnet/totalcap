from sqlalchemy import create_engine, text
import sys
import os

sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))
from backend.config import settings

engine = create_engine(settings.POSTGRES_URL)

with engine.connect() as conn:
    print("Checking 'id_contato' in 'clientes'...")
    try:
        conn.execute(text("ALTER TABLE clientes ADD COLUMN id_contato INTEGER REFERENCES contato(id)"))
        conn.commit()
        print("Column 'id_contato' added successfully.")
    except Exception as e:
        print(f"Error adding column: {e}")

    print("Checking 'codibge' and 'userlan' in 'cidade'...")
    try:
        conn.execute(text("ALTER TABLE cidade RENAME COLUMN codigo_ibge TO codibge"))
        conn.commit()
    except Exception as e:
        print(f"Note: {e}")

    try:
        conn.execute(text("ALTER TABLE cidade ADD COLUMN userlan VARCHAR(20)"))
        conn.execute(text("ALTER TABLE cidade ADD COLUMN datalan TIMESTAMP"))
        conn.commit()
    except Exception as e:
        print(f"Note: {e}")

    print("Checking 'uf' in 'estado'...")
    try:
        conn.execute(text("ALTER TABLE estado RENAME COLUMN sigla TO uf"))
        conn.commit()
    except Exception as e:
        print(f"Note: {e}")

    try:
        conn.execute(text("ALTER TABLE estado ADD COLUMN userlan VARCHAR(20)"))
        conn.execute(text("ALTER TABLE estado ADD COLUMN datalan TIMESTAMP"))
        conn.commit()
    except Exception as e:
        print(f"Note: {e}")
