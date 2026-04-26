from sqlalchemy import text
from backend.database import engine

def search_simple(search_term):
    tables = [
        "usuario", "operador", "contato", "vendedor", "mobos", "ordemservico", "pneu", "medida", "marca", "desenho"
    ]
    
    with engine.connect() as conn:
        for table in tables:
            try:
                # Pega colunas
                res_cols = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'"))
                cols = [row[0] for row in res_cols]
                
                for col in cols:
                    try:
                        query = text(f"SELECT count(*) FROM {table} WHERE {col}::text ILIKE :term")
                        count = conn.execute(query, {"term": f"%{search_term}%"}).scalar()
                        if count > 0:
                            print(f"ENCONTRADO {count} registros na tabela '{table}', coluna '{col}'")
                    except:
                        pass
            except:
                pass

if __name__ == "__main__":
    search_simple("3c9")
