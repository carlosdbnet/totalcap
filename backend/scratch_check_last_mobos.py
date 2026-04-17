import psycopg2
db_url = "postgresql://neondb_owner:npg_TBWgl4SM1Ejn@ep-morning-water-acsrbm4u-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute("SELECT * FROM mobos ORDER BY id DESC LIMIT 1")
row = cur.fetchone()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'mobos' ORDER BY ordinal_position")
cols = [c[0] for c in cur.fetchall()]

print("Ultima linha gravada em 'mobos':")
if row:
    result = dict(zip(cols, row))
    for k, v in result.items():
        print(f"{k}: {v}")
else:
    print("Nenhuma linha encontrada.")

cur.close()
conn.close()
