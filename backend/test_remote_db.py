from sqlalchemy import create_engine, text
import sys

# URL do config.py
POSTGRES_URL = "postgresql://neondb_owner:npg_TBWgl4SM1Ejn@ep-morning-water-acsrbm4u-pooler.sa-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

def test_conn():
    print(f"Testando conexao com: {POSTGRES_URL[:30]}...")
    try:
        engine = create_engine(POSTGRES_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"Sucesso! Resultado: {result.fetchone()}")
            
            # Verificar se a tabela de usuarios existe
            result = conn.execute(text("SELECT count(*) FROM usuarios"))
            print(f"Total de usuarios no banco: {result.fetchone()[0]}")
            
    except Exception as e:
        print(f"ERRO DE CONEXAO: {e}")

if __name__ == "__main__":
    test_conn()
