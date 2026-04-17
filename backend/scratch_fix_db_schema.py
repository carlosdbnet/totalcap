import psycopg2

db_url = "postgresql://neondb_owner:npg_TBWgl4SM1Ejn@ep-morning-water-acsrbm4u-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
conn = psycopg2.connect(db_url)
cur = conn.cursor()

commands = [
    # MOBOS
    "CREATE SEQUENCE IF NOT EXISTS mobos_id_seq",
    "ALTER TABLE mobos ALTER COLUMN id SET DEFAULT nextval('mobos_id_seq')",
    "SELECT setval('mobos_id_seq', COALESCE((SELECT MAX(id) FROM mobos), 1))",
    "ALTER TABLE mobos ALTER COLUMN qpneu SET DEFAULT 0",
    "ALTER TABLE mobos ALTER COLUMN vtotal SET DEFAULT 0",
    "ALTER TABLE mobos ALTER COLUMN numeroos DROP NOT NULL",
    #"ALTER TABLE mobos ALTER COLUMN sincronizado SET DEFAULT true", # Já está como boolean no banco

    # MOBPNEU
    "CREATE SEQUENCE IF NOT EXISTS mobpneu_id_seq",
    "ALTER TABLE mobpneu ALTER COLUMN id SET DEFAULT nextval('mobpneu_id_seq')",
    "SELECT setval('mobpneu_id_seq', COALESCE((SELECT MAX(id) FROM mobpneu), 1))",
    "ALTER TABLE mobpneu ALTER COLUMN id_medida DROP NOT NULL",
    "ALTER TABLE mobpneu ALTER COLUMN id_desenho DROP NOT NULL",
    "ALTER TABLE mobpneu ALTER COLUMN id_marca DROP NOT NULL",
    "ALTER TABLE mobpneu ALTER COLUMN id_recap DROP NOT NULL",
    "ALTER TABLE mobpneu ALTER COLUMN valor SET DEFAULT 0",
    "ALTER TABLE mobpneu ALTER COLUMN qreforma SET DEFAULT 0",
    "ALTER TABLE mobpneu ALTER COLUMN id_vendedor DROP NOT NULL",
    #"ALTER TABLE mobpneu ALTER COLUMN sincronizado SET DEFAULT true" 
]

print("Iniciando saneamento do banco de dados...")
for cmd in commands:
    try:
        print(f"Executando: {cmd}")
        cur.execute(cmd)
        conn.commit()
    except Exception as e:
        print(f"Erro ao executar '{cmd}': {e}")
        conn.rollback()

cur.close()
conn.close()
print("Saneamento concluído!")
