from backend.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    res = conn.execute(text("SELECT * FROM credencial WHERE android_id LIKE '3c9%'"))
    rows = [dict(row._mapping) for row in res]
    print(f"Registros encontrados em 'credencial': {rows}")
