import psycopg2, sys
sys.stdout.reconfigure(encoding="utf-8")
conn = psycopg2.connect("postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require")
conn.autocommit = True
cur = conn.cursor()

# Make E004, E006, E007 have recent/active probation dates
cur.execute("UPDATE contracts SET start_date='2026-02-01', probation_end='2026-05-01', end_date='2027-02-01' WHERE employee_id='E004'")
cur.execute("UPDATE contracts SET start_date='2026-01-15', probation_end='2026-04-15', end_date='2028-01-15' WHERE employee_id='E006'")
cur.execute("UPDATE contracts SET start_date='2025-12-01', probation_end='2026-03-10' WHERE employee_id='E007'")

cur.execute("SELECT c.employee_id, e.name, c.probation_end FROM contracts c JOIN employees e ON e.id=c.employee_id ORDER BY c.probation_end DESC")
for r in cur.fetchall():
    print(f"  {r[0]} {r[1]}: probation ends {r[2]}")
conn.close()
print("Done")
