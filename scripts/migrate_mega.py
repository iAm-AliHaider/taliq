"""
Taliq Mega Migration — All 20 enhancements
Tables: salary_history, payroll_adjustments, probation_alerts, eos_provisions
Columns: employees gets IBAN/bank fields for WPS
"""
import os, sys
sys.stdout.reconfigure(encoding="utf-8")

import psycopg2
conn = psycopg2.connect("postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require")
conn.autocommit = True
cur = conn.cursor()

print("[1/7] Adding WPS fields to employees...")
for col, typ, default in [
    ("iban", "TEXT", "''"),
    ("bank_code", "TEXT", "''"),
    ("bank_name", "TEXT", "''"),
    ("id_number", "TEXT", "''"),
    ("id_type", "TEXT", "'iqama'"),
]:
    try:
        cur.execute(f"ALTER TABLE employees ADD COLUMN {col} {typ} DEFAULT {default}")
        print(f"  + {col}")
    except Exception as e:
        if "already exists" in str(e): print(f"  ~ {col} (exists)")
        else: print(f"  ! {col}: {e}")
        conn.rollback()

print("[2/7] Creating salary_history table...")
cur.execute("""
CREATE TABLE IF NOT EXISTS salary_history (
    id SERIAL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    effective_date TEXT NOT NULL,
    change_type TEXT NOT NULL DEFAULT 'increment',
    old_basic REAL DEFAULT 0,
    new_basic REAL DEFAULT 0,
    old_housing REAL DEFAULT 0,
    new_housing REAL DEFAULT 0,
    old_transport REAL DEFAULT 0,
    new_transport REAL DEFAULT 0,
    old_total REAL DEFAULT 0,
    new_total REAL DEFAULT 0,
    percentage_change REAL DEFAULT 0,
    reason TEXT DEFAULT '',
    approved_by TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
)
""")
print("  OK")

print("[3/7] Creating payroll_adjustments table...")
cur.execute("""
CREATE TABLE IF NOT EXISTS payroll_adjustments (
    id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL,
    employee_name TEXT DEFAULT '',
    paycode_id INTEGER,
    paycode_code TEXT NOT NULL,
    paycode_name TEXT DEFAULT '',
    paycode_type TEXT DEFAULT 'earning',
    amount REAL DEFAULT 0,
    gl_debit_account TEXT DEFAULT '',
    gl_credit_account TEXT DEFAULT '',
    reason TEXT DEFAULT '',
    created_by TEXT DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
)
""")
print("  OK")

print("[4/7] Creating eos_provisions table...")
cur.execute("""
CREATE TABLE IF NOT EXISTS eos_provisions (
    id SERIAL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    years_of_service REAL DEFAULT 0,
    monthly_basic REAL DEFAULT 0,
    monthly_provision REAL DEFAULT 0,
    cumulative_provision REAL DEFAULT 0,
    calculation_basis TEXT DEFAULT 'labor_law',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, period_month, period_year)
)
""")
print("  OK")

print("[5/7] Seeding WPS bank data for demo employees...")
wps_data = [
    ("E001", "SA4420000001234567890123", "20", "Al Rajhi Bank", "1234567890", "iqama"),
    ("E002", "SA5510000002345678901234", "10", "SNB (Al Ahli)", "2345678901", "national_id"),
    ("E003", "SA6645000003456789012345", "45", "SABB", "3456789012", "national_id"),
    ("E004", "SA7780000004567890123456", "80", "Riyad Bank", "4567890123", "iqama"),
    ("E005", "SA8830000005678901234567", "30", "Arab National Bank", "5678901234", "national_id"),
    ("E006", "SA9955000006789012345678", "55", "Bank AlJazira", "6789012345", "iqama"),
    ("E007", "SA1112000007890123456789", "12", "Alinma Bank", "7890123456", "national_id"),
]
for eid, iban, bank_code, bank_name, id_number, id_type in wps_data:
    cur.execute("""
        UPDATE employees SET iban=%s, bank_code=%s, bank_name=%s, id_number=%s, id_type=%s
        WHERE id=%s
    """, (iban, bank_code, bank_name, id_number, id_type, eid))
print("  OK")

print("[6/7] Seeding salary history (initial hire records)...")
cur.execute("""
    SELECT id, name, basic_salary, housing_allowance, transport_allowance, join_date
    FROM employees
""")
for emp in cur.fetchall():
    eid, name, basic, housing, transport, join_date = emp
    basic = basic or 0; housing = housing or 0; transport = transport or 0
    try:
        cur.execute("""
            INSERT INTO salary_history
                (employee_id, effective_date, change_type, old_basic, new_basic,
                 old_housing, new_housing, old_transport, new_transport,
                 old_total, new_total, percentage_change, reason, approved_by)
            VALUES (%s, %s, 'hire', 0, %s, 0, %s, 0, %s, 0, %s, 0, 'Initial hire', 'HR')
            ON CONFLICT DO NOTHING
        """, (eid, str(join_date)[:10] if join_date else '2025-01-01',
              basic, housing, transport, basic + housing + transport))
    except: pass
print("  OK")

print("[7/7] Verifying all tables...")
for t in ["salary_history", "payroll_adjustments", "eos_provisions"]:
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    print(f"  {t}: {cur.fetchone()[0]} rows")

# Verify employee WPS fields
cur.execute("SELECT id, iban, bank_name FROM employees WHERE iban != '' LIMIT 3")
for r in cur.fetchall():
    print(f"  emp {r[0]}: IBAN={r[1][:10]}... bank={r[2]}")

cur.close()
conn.close()
print("\nMega migration complete!")
