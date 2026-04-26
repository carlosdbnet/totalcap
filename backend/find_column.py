from backend.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    res = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
    tables = [row[0] for row in res]
    print(f"Tabelas: {tables}")
    
    for table in tables:
        res_cols = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'"))
        cols = [row[0] for row in res_cols]
        if 'android_id' in cols or 'id_android' in cols:
            print(f"!!! ENCONTRADO em {table} colunas {cols}")
