import psycopg2
conn = psycopg2.connect("postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require")
cur = conn.cursor()
for t in ['audit_log', 'performance_reviews', 'performance_goals', 'employee_trainings']:
    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name='{t}' ORDER BY ordinal_position")
    print(f"{t}: {[r[0] for r in cur.fetchall()]}")
conn.close()
