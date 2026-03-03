import psycopg2, sys
DB = 'postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'

def run(sql, params=None, fetch=True):
    conn = psycopg2.connect(DB)
    cur = conn.cursor()
    cur.execute(sql, params)
    if fetch:
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        conn.close()
        return cols, rows
    else:
        conn.commit()
        n = cur.rowcount
        conn.close()
        return n

# Check GOSI lines for run 4
cols, rows = run("""
    SELECT employee_id, employee_name, paycode_code, amount 
    FROM payroll_lines WHERE run_id=4 AND paycode_code IN ('GOSI_EE','GOSI_ER')
    ORDER BY employee_id, paycode_code
""")
print("Current GOSI lines in PR-2026-04:")
for r in rows:
    print(f"  {r[0]} {r[1]}: {r[2]} = {r[3]}")

# Check employees for nationality + salary to verify rates
cols2, rows2 = run("SELECT id, name, nationality, basic_salary, housing_allowance FROM employees ORDER BY id")
print("\nEmployees:")
for r in rows2:
    eid, name, nat, basic, housing = r
    insurable = min((basic or 0) + (housing or 0), 45000)
    insurable = max(insurable, 1500)
    is_saudi = nat and 'saudi' in str(nat).lower() and 'non' not in str(nat).lower()
    ee_rate = 0.0975 if is_saudi else 0.0
    er_rate = 0.1175 if is_saudi else 0.02
    expected_ee = round(insurable * ee_rate, 2)
    expected_er = round(insurable * er_rate, 2)
    print(f"  {eid} {name}: nat={nat}, insurable={insurable}, expected EE={expected_ee}, ER={expected_er}")

# Now check if amounts match expected
print("\nVerifying run 4 GOSI amounts...")
gosi_map = {}
for r in rows:
    key = (r[0], r[2])  # (employee_id, paycode_code)
    gosi_map[key] = float(r[3])

needs_fix = False
for r in rows2:
    eid, name, nat, basic, housing = r
    insurable = min((basic or 0) + (housing or 0), 45000)
    insurable = max(insurable, 1500)
    is_saudi = nat and 'saudi' in str(nat).lower() and 'non' not in str(nat).lower()
    ee_rate = 0.0975 if is_saudi else 0.0
    er_rate = 0.1175 if is_saudi else 0.02
    expected_ee = round(insurable * ee_rate, 2)
    expected_er = round(insurable * er_rate, 2)
    actual_ee = gosi_map.get((eid, 'GOSI_EE'), 0)
    actual_er = gosi_map.get((eid, 'GOSI_ER'), 0)
    if abs(actual_ee - expected_ee) > 0.01 or abs(actual_er - expected_er) > 0.01:
        print(f"  MISMATCH {eid}: EE actual={actual_ee} expected={expected_ee}, ER actual={actual_er} expected={expected_er}")
        needs_fix = True

if not needs_fix:
    print("  All GOSI amounts are correct at 9.75%/11.75%!")
else:
    print("  FIX NEEDED - will recalculate")
