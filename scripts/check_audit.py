import psycopg2
DB = 'postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DB)
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='audit_log' ORDER BY ordinal_position")
print('audit_log cols:', [r[0] for r in cur.fetchall()])
cur.execute("SELECT COUNT(*) FROM audit_log")
print('rows:', cur.fetchone()[0])
conn.close()
