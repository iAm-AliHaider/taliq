"""Gap #1: Fix payroll run 4 - add missing GOSI lines, fix paycode names, recalculate totals"""
import psycopg2
DB = 'postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'

conn = psycopg2.connect(DB)
cur = conn.cursor()

# Fix paycode names (9% -> 9.75%)
cur.execute("UPDATE paycodes SET name='GOSI Employee (9.75%%)', name_ar='%s' WHERE code='GOSI_EMP'" % 'التأمينات - موظف (9.75٪)')
cur.execute("UPDATE paycodes SET name='GOSI Employer (11.75%%)', name_ar='%s' WHERE code='GOSI_CO'" % 'التأمينات - صاحب عمل (11.75٪)')
print("Fixed paycode names")

# Get employees
cur.execute("SELECT id, name, nationality, basic_salary, housing_allowance, department FROM employees ORDER BY id")
employees = cur.fetchall()

# Get GOSI paycode info
cur.execute("SELECT id, code, gl_debit_account, gl_credit_account FROM paycodes WHERE code IN ('GOSI_EMP','GOSI_CO')")
paycodes = {r[1]: {'id': r[0], 'dr': r[2], 'cr': r[3]} for r in cur.fetchall()}

# Delete existing GOSI lines for run 4
cur.execute("DELETE FROM payroll_lines WHERE run_id=4 AND paycode_code IN ('GOSI_EMP','GOSI_CO','GOSI_EE','GOSI_ER')")
print(f"Deleted {cur.rowcount} old GOSI lines")

total_gosi_ee = 0
total_gosi_er = 0

for eid, name, nat, basic, housing, dept in employees:
    insurable = min((basic or 0) + (housing or 0), 45000)
    insurable = max(insurable, 1500)
    is_saudi = nat and 'saudi' in str(nat).lower() and 'non' not in str(nat).lower()
    
    ee_rate = 0.0975 if is_saudi else 0.0
    er_rate = 0.1175 if is_saudi else 0.02
    ee_amt = round(insurable * ee_rate, 2)
    er_amt = round(insurable * er_rate, 2)
    
    if ee_amt > 0:
        cur.execute("""INSERT INTO payroll_lines 
            (run_id, employee_id, employee_name, department, paycode_id, paycode_code, paycode_name, paycode_type, amount, gl_debit_account, gl_credit_account)
            VALUES (4, %s, %s, %s, %s, 'GOSI_EMP', 'GOSI Employee (9.75%%)', 'deduction', %s, %s, %s)""",
            (eid, name, dept, paycodes['GOSI_EMP']['id'], ee_amt, paycodes['GOSI_EMP']['dr'], paycodes['GOSI_EMP']['cr']))
    
    cur.execute("""INSERT INTO payroll_lines 
        (run_id, employee_id, employee_name, department, paycode_id, paycode_code, paycode_name, paycode_type, amount, gl_debit_account, gl_credit_account)
        VALUES (4, %s, %s, %s, %s, 'GOSI_CO', 'GOSI Employer (11.75%%)', 'employer_contribution', %s, %s, %s)""",
        (eid, name, dept, paycodes['GOSI_CO']['id'], er_amt, paycodes['GOSI_CO']['dr'], paycodes['GOSI_CO']['cr']))
    
    total_gosi_ee += ee_amt
    total_gosi_er += er_amt
    print(f"  {eid} {name}: EE={ee_amt}, ER={er_amt} ({'Saudi' if is_saudi else 'Non-Saudi'})")

# Recalculate run totals
cur.execute("SELECT COALESCE(SUM(amount),0) FROM payroll_lines WHERE run_id=4 AND paycode_type='earning'")
total_gross = float(cur.fetchone()[0])
cur.execute("SELECT COALESCE(SUM(amount),0) FROM payroll_lines WHERE run_id=4 AND paycode_type='deduction'")
total_deductions = float(cur.fetchone()[0])
total_net = total_gross - total_deductions

cur.execute("""UPDATE payroll_runs SET 
    total_gross=%s, total_deductions=%s, total_net=%s,
    total_gosi_employee=%s, total_gosi_employer=%s
    WHERE id=4""", (total_gross, total_deductions, total_net, total_gosi_ee, total_gosi_er))

conn.commit()
conn.close()
print(f"\nRun 4 totals: gross={total_gross}, ded={total_deductions}, net={total_net}")
print(f"GOSI: EE={total_gosi_ee}, ER={total_gosi_er}")
print("Gap #1 DONE")
