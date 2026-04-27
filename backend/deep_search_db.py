from sqlalchemy import text
from backend.database import engine

def search_everywhere(search_term):
    with engine.connect() as conn:
        # Pega todas as tabelas
        tables_res = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
        tables = [row[0] for row in tables_res]
        
        for table in tables:
            # Pega colunas de texto/char
            cols_res = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}' AND data_type IN ('character varying', 'text', 'character')"))
            cols = [row[0] for row in cols_res]
            
            if not cols:
                continue
                
            for col in cols:
                try:
                    search_query = text(f"SELECT * FROM {table} WHERE {col}::text ILIKE :term LIMIT 5")
                    res = conn.execute(search_query, {"term": f"%{search_term}%"})
                    rows = res.fetchall()
                    if rows:
                        print(f"ENCONTRADO na tabela '{table}', coluna '{col}':")
                        for r in rows:
                            print(f"  {r}")
                except Exception as e:
                    # Algumas colunas podem dar erro de cast ou algo assim
                    pass

if __name__ == "__main__":
    search_everywhere("3c9")
