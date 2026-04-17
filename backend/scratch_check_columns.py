import psycopg2
import os
from dotenv import load_dotenv

db_url = "postgresql://neondb_owner:npg_TBWgl4SM1Ejn@ep-morning-water-acsrbm4u-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

if not db_url:
    print("DATABASE_URL not found in .env")
    exit(1)

conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'mobos'")
columns = [row[0] for row in cur.fetchall()]
print(f"Columns in 'mobos': {columns}")

cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'mobpneu'")
columns_pneu = [row[0] for row in cur.fetchall()]
print(f"Columns in 'mobpneu': {columns_pneu}")

cur.close()
conn.close()
