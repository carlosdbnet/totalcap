import psycopg2
db_url = "postgresql://neondb_owner:npg_TBWgl4SM1Ejn@ep-morning-water-acsrbm4u-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
conn = psycopg2.connect(db_url)
cur = conn.cursor()

# Check columns and defaults for mobos
cur.execute("""
    SELECT column_name, column_default, is_nullable, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'mobpneu' 
    ORDER BY ordinal_position
""")
cols = cur.fetchall()
print("Table: mobpneu")
for col in cols:
    print(f"Col: {col[0]}, Default: {col[1]}, Nullable: {col[2]}, Type: {col[3]}")

cur.close()
conn.close()
