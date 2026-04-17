import psycopg2
db_url = "postgresql://neondb_owner:npg_TBWgl4SM1Ejn@ep-morning-water-acsrbm4u-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute("SELECT * FROM mobpneu WHERE id_mobos = 7")
rows = cur.fetchall()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'mobpneu' ORDER BY ordinal_position")
cols = [c[0] for c in cur.fetchall()]

print("Itens da Coleta ID 7:")
for row in rows:
    result = dict(zip(cols, row))
    print(f"Pneu ID {result.get('id')}: {result}")

cur.close()
conn.close()
