import sys
import os
from sqlalchemy import create_engine, text

# Adiciona o diretório raiz ao sys.path para importar o settings
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.config import settings

def migrate():
    url = settings.POSTGRES_URL
    print(f"Conectando ao banco de dados...")
    engine = create_engine(url)
    
    with engine.connect() as conn:
        print("Renomeando colunas em 'pneu'...")
        try:
            conn.execute(text("ALTER TABLE pneu RENAME COLUMN id_marca TO id_produto"))
            print("Coluna 'id_marca' renomeada para 'id_produto' na tabela 'pneu'.")
        except Exception as e:
            print(f"Erro ao renomear em 'pneu': {e}")

        print("Renomeando colunas em 'mobpneu'...")
        try:
            conn.execute(text("ALTER TABLE mobpneu RENAME COLUMN id_marca TO id_produto"))
            print("Coluna 'id_marca' renomeada para 'id_produto' na tabela 'mobpneu'.")
        except Exception as e:
            print(f"Erro ao renomear em 'mobpneu': {e}")
        
        conn.commit()
    print("Migração concluída.")

if __name__ == "__main__":
    migrate()
