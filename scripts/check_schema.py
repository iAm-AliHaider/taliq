import psycopg2
DB = 'postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DB)
cur = conn.cursor()

# paycodes schema
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='paycodes' ORDER BY ordinal_position")
print("paycodes cols:", [r[0] for r in cur.fetchall()])

cur.execute("SELECT * FROM paycodes ORDER BY id")
cols = [d[0] for d in cur.description]
print("Cols:", cols)
for r in cur.fetchall():
    print(dict(zip(cols, r)))

conn.close()
