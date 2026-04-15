from sqlalchemy import create_engine, text

def check_counts():
    url = "postgresql://neondb_owner:npg_TBWgl4SM1Ejn@ep-morning-water-acsrbm4u-pooler.sa-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
    engine = create_engine(url)
    with engine.connect() as conn:
        tables = ['pneu', 'marca', 'cliente', 'area', 'regiao', 'tabgeral', 'clientes']
        for table in tables:
            try:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print(f"Tabela {table}: {count} registros")
            except Exception as e:
                print(f"Tabela {table}: ERRO ({e})")

if __name__ == "__main__":
    check_counts()
