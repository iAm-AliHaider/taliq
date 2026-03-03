import psycopg2, json, sys
sys.stdout.reconfigure(encoding="utf-8")

conn = psycopg2.connect("postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require")
cur = conn.cursor()

# All tables
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
tables = [r[0] for r in cur.fetchall()]
print(f"=== {len(tables)} TABLES ===")
for t in tables: print(f"  {t}")

# Row counts
print("\n=== ROW COUNTS ===")
for t in tables:
    try:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        print(f"  {t}: {cur.fetchone()[0]}")
    except:
        conn.rollback()
        print(f"  {t}: ERROR")

# Check employee fields completeness
print("\n=== EMPLOYEE DATA GAPS ===")
cur.execute("SELECT id, name, iban, bank_code, id_number, nationality, manager_id, email, phone FROM employees")
for r in cur.fetchall():
    gaps = []
    if not r[2]: gaps.append("iban")
    if not r[3]: gaps.append("bank_code")
    if not r[4]: gaps.append("id_number")
    if not r[5]: gaps.append("nationality")
    if not r[6]: gaps.append("manager_id")
    if not r[7]: gaps.append("email")
    if not r[8]: gaps.append("phone")
    if gaps: print(f"  {r[0]} {r[1]}: missing {', '.join(gaps)}")
    else: print(f"  {r[0]} {r[1]}: complete")

# Check stale payroll runs (old GOSI rates)
print("\n=== PAYROLL RUNS ===")
cur.execute("SELECT id, ref, status, total_gross, total_deductions, total_net, employee_count FROM payroll_runs ORDER BY id")
for r in cur.fetchall():
    print(f"  {r[1]} ({r[2]}): gross={r[3]} ded={r[4]} net={r[5]} emps={r[6]}")

# Check policy categories
print("\n=== POLICIES ===")
cur.execute("SELECT category FROM policies ORDER BY category")
for r in cur.fetchall(): print(f"  {r[0]}")

# Check contracts for probation
print("\n=== CONTRACTS (probation) ===")
cur.execute("SELECT employee_id, contract_type, probation_end, start_date, end_date FROM contracts")
for r in cur.fetchall():
    print(f"  {r[0]}: type={r[1]} probation_end={r[2]} start={r[3]} end={r[4]}")

conn.close()
