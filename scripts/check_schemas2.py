import psycopg2, json
conn = psycopg2.connect("postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require")
cur = conn.cursor()

# Active loans
print("=== ACTIVE LOANS ===")
cur.execute("SELECT id, employee_id, loan_type, amount, remaining, monthly_installment, installments_left, status FROM loans WHERE status IN ('active','approved') LIMIT 10")
for r in cur.fetchall(): print(r)

# Advance salary from loans
print("\n=== ADVANCE SALARY LOANS ===")
cur.execute("SELECT id, employee_id, loan_type, amount, remaining, monthly_installment, status FROM loans WHERE loan_type ILIKE '%advance%' LIMIT 5")
for r in cur.fetchall(): print(r)

# GOSI policy
print("\n=== GOSI POLICY ===")
cur.execute("SELECT config FROM policies WHERE category = 'gosi'")
r = cur.fetchone()
if r:
    cfg = r[0] if isinstance(r[0], dict) else json.loads(r[0])
    print(json.dumps(cfg, indent=2))
else:
    print("Not found — all policies:")
    cur.execute("SELECT category FROM policies")
    print([x[0] for x in cur.fetchall()])

conn.close()
