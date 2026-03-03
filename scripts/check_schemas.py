import psycopg2, json
conn = psycopg2.connect("postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require")
cur = conn.cursor()

for table in ["loans", "payments", "policies"]:
    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name='{table}' ORDER BY ordinal_position")
    cols = cur.fetchall()
    print(f"\n=== {table} ===")
    for c in cols: print(f"  {c[0]} ({c[1]})")

# Sample loan data
print("\n=== ACTIVE LOANS SAMPLE ===")
cur.execute("SELECT id, ref, employee_id, loan_type, amount, remaining_balance, monthly_installment, status FROM loans WHERE status IN ('active','approved') LIMIT 5")
for r in cur.fetchall(): print(r)

# Sample policies GOSI
print("\n=== GOSI POLICY ===")
cur.execute("SELECT category, config FROM policies WHERE category = 'gosi'")
r = cur.fetchone()
if r: print(r[1])
else: print("No gosi policy found")

conn.close()
