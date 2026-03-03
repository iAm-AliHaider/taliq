import psycopg2
DB = 'postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DB)
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='payroll_runs' ORDER BY ordinal_position")
print("payroll_runs:", [r[0] for r in cur.fetchall()])
conn.close()
