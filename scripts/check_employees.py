import psycopg2
conn = psycopg2.connect("postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require")
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='employees' ORDER BY ordinal_position")
print([r[0] for r in cur.fetchall()])
conn.close()
