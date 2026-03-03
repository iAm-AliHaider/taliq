"""Gap #3: Generate EOS provisions for all employees
Schema: id, employee_id, period_month, period_year, years_of_service, monthly_basic, monthly_provision, cumulative_provision, calculation_basis, created_at
"""
import psycopg2
from datetime import date, datetime
DB = 'postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'

conn = psycopg2.connect(DB)
cur = conn.cursor()

cur.execute("DELETE FROM eos_provisions")
print(f"Cleared {cur.rowcount} old rows")

cur.execute("SELECT id, name, join_date, basic_salary, housing_allowance FROM employees ORDER BY id")
employees = cur.fetchall()

today = date(2026, 3, 3)

for eid, name, join_date, basic, housing in employees:
    jd = join_date if isinstance(join_date, date) else datetime.strptime(str(join_date)[:10], '%Y-%m-%d').date()
    years = (today - jd).days / 365.25
    monthly = (basic or 0) + (housing or 0)
    
    # Saudi Labor Law EOS: first 5y = 0.5 mo/yr, after = 1 mo/yr
    if years <= 5:
        cumulative = years * 0.5 * monthly
    else:
        cumulative = (5 * 0.5 * monthly) + ((years - 5) * 1.0 * monthly)
    
    # Monthly provision = cumulative / months worked
    months_worked = max((today - jd).days / 30.44, 1)
    monthly_prov = round(cumulative / months_worked, 2)
    cumulative = round(cumulative, 2)
    
    basis = f"Saudi Labor Law Art.84: {'0.5' if years<=5 else '0.5+1.0'} mo/yr"
    
    cur.execute("""INSERT INTO eos_provisions 
        (employee_id, period_month, period_year, years_of_service, monthly_basic, monthly_provision, cumulative_provision, calculation_basis)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (eid, 3, 2026, round(years, 2), monthly, monthly_prov, cumulative, basis))
    
    print(f"  {eid} {name}: {years:.1f}y, monthly={monthly}, cumulative_eos={cumulative}")

conn.commit()
conn.close()
print("\nGap #3 DONE")
