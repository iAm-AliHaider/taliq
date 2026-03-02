"""
Taliq — GL Accounts + Paycodes + Payroll JV Migration
Creates 5 new tables and seeds standard Saudi HR paycodes with GL mappings.
"""
import os, sys
sys.stdout.reconfigure(encoding="utf-8")

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
)

import psycopg2
conn = psycopg2.connect(DB_URL)
conn.autocommit = True
cur = conn.cursor()

print("[1/5] Creating gl_accounts table...")
cur.execute("""
CREATE TABLE IF NOT EXISTS gl_accounts (
    id SERIAL PRIMARY KEY,
    account_number TEXT NOT NULL UNIQUE,
    account_name TEXT NOT NULL,
    account_name_ar TEXT DEFAULT '',
    account_type TEXT NOT NULL CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
    parent_account TEXT DEFAULT '',
    cost_center TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
)
""")
print("  OK")

print("[2/5] Creating paycodes table...")
cur.execute("""
CREATE TABLE IF NOT EXISTS paycodes (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_ar TEXT DEFAULT '',
    paycode_type TEXT NOT NULL CHECK (paycode_type IN ('earning','deduction','employer_contribution')),
    category TEXT DEFAULT 'salary',
    gl_debit_account TEXT DEFAULT '',
    gl_credit_account TEXT DEFAULT '',
    is_taxable BOOLEAN DEFAULT FALSE,
    is_gosi BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
)
""")
print("  OK")

print("[3/5] Creating payroll_runs table...")
cur.execute("""
CREATE TABLE IF NOT EXISTS payroll_runs (
    id SERIAL PRIMARY KEY,
    ref TEXT NOT NULL UNIQUE,
    period_label TEXT NOT NULL,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','approved','posted','cancelled')),
    total_gross REAL DEFAULT 0,
    total_deductions REAL DEFAULT 0,
    total_net REAL DEFAULT 0,
    total_gosi_employee REAL DEFAULT 0,
    total_gosi_employer REAL DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    run_by TEXT DEFAULT 'admin',
    notes TEXT DEFAULT '',
    posted_to_erp BOOLEAN DEFAULT FALSE,
    erp_ref TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    posted_at TIMESTAMP
)
""")
print("  OK")

print("[4/5] Creating payroll_lines + journal_vouchers + jv_lines tables...")
cur.execute("""
CREATE TABLE IF NOT EXISTS payroll_lines (
    id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    department TEXT DEFAULT '',
    paycode_id INTEGER REFERENCES paycodes(id),
    paycode_code TEXT NOT NULL,
    paycode_name TEXT NOT NULL,
    paycode_type TEXT NOT NULL,
    amount REAL DEFAULT 0,
    gl_debit_account TEXT DEFAULT '',
    gl_credit_account TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
)
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS journal_vouchers (
    id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES payroll_runs(id) ON DELETE CASCADE,
    jv_ref TEXT NOT NULL UNIQUE,
    jv_date DATE NOT NULL,
    description TEXT DEFAULT '',
    currency TEXT DEFAULT 'SAR',
    total_debit REAL DEFAULT 0,
    total_credit REAL DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','approved','posted','cancelled')),
    export_format TEXT DEFAULT '',
    exported_at TIMESTAMP,
    erp_ref TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
)
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS jv_lines (
    id SERIAL PRIMARY KEY,
    jv_id INTEGER REFERENCES journal_vouchers(id) ON DELETE CASCADE,
    line_no INTEGER NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    debit REAL DEFAULT 0,
    credit REAL DEFAULT 0,
    dimension_dept TEXT DEFAULT '',
    dimension_emp TEXT DEFAULT '',
    narration TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
)
""")
print("  OK")

print("[5/5] Seeding standard GL accounts + paycodes...")

# --- GL ACCOUNTS ---
gl_accounts = [
    # Earnings (Dr side — Expense accounts)
    ("5100", "Basic Salary Expense",          "مصروف الراتب الأساسي",         "expense"),
    ("5101", "Housing Allowance Expense",     "مصروف بدل السكن",              "expense"),
    ("5102", "Transport Allowance Expense",   "مصروف بدل المواصلات",          "expense"),
    ("5103", "Other Allowances Expense",      "مصروف البدلات الأخرى",         "expense"),
    ("5104", "Overtime Expense",              "مصروف العمل الإضافي",          "expense"),
    ("5110", "GOSI Employer Contribution",    "مصروف التأمينات الاجتماعية",   "expense"),
    ("5120", "End of Service Provision",      "مخصص نهاية الخدمة",            "expense"),
    ("5130", "Annual Leave Provision",        "مخصص الإجازة السنوية",         "expense"),
    # Deductions (Cr side — Liability accounts)
    ("2100", "Salaries Payable",              "الرواتب المستحقة الدفع",        "liability"),
    ("2101", "GOSI Employee Payable",         "التأمينات المستحقة - موظف",     "liability"),
    ("2102", "GOSI Employer Payable",         "التأمينات المستحقة - صاحب عمل","liability"),
    ("2103", "Advance Salary Payable",        "السلف المستحقة الدفع",          "liability"),
    ("2104", "Loan Deduction Payable",        "استقطاعات القروض",              "liability"),
    ("2105", "Income Tax Payable",            "ضريبة الدخل المستحقة",          "liability"),
    ("2110", "EOS Provision Payable",         "مخصص نهاية الخدمة المستحق",    "liability"),
    ("2111", "Annual Leave Provision Payable","مخصص الإجازة المستحق",         "liability"),
    # Bank
    ("1010", "Bank Account — Payroll",        "حساب البنك — الرواتب",         "asset"),
    ("1011", "Petty Cash",                    "الصندوق",                       "asset"),
]

for acc in gl_accounts:
    cur.execute("""
        INSERT INTO gl_accounts (account_number, account_name, account_name_ar, account_type)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (account_number) DO NOTHING
    """, acc)

# --- PAYCODES ---
# (code, name, name_ar, type, category, gl_debit, gl_credit, is_gosi, sort)
paycodes = [
    # EARNINGS
    ("BASIC",     "Basic Salary",          "الراتب الأساسي",          "earning", "salary",       "5100", "2100", True,  1),
    ("HOUSING",   "Housing Allowance",     "بدل السكن",               "earning", "allowance",    "5101", "2100", True,  2),
    ("TRANSPORT", "Transport Allowance",   "بدل المواصلات",           "earning", "allowance",    "5102", "2100", True,  3),
    ("OTHER_ALW", "Other Allowances",      "بدلات أخرى",              "earning", "allowance",    "5103", "2100", False, 4),
    ("OVERTIME",  "Overtime Pay",          "أجر العمل الإضافي",       "earning", "overtime",     "5104", "2100", False, 5),
    ("BONUS",     "Bonus / Incentive",     "مكافأة / حافز",           "earning", "bonus",        "5103", "2100", False, 6),
    ("ANNUAL_LV", "Annual Leave Salary",   "أجر الإجازة السنوية",     "earning", "leave",        "5130", "2111", False, 7),
    ("EOS",       "End of Service",        "مكافأة نهاية الخدمة",     "earning", "eos",          "5120", "2110", False, 8),
    # DEDUCTIONS
    ("GOSI_EMP",  "GOSI — Employee (9%)",  "التأمينات - موظف (9٪)",   "deduction",              "gosi", "2100", "2101", True,  10),
    ("LOAN_DED",  "Loan Deduction",        "استقطاع القرض",            "deduction",              "loan", "2100", "2104", False, 11),
    ("ADV_DED",   "Advance Salary Deduction", "خصم السلفة",           "deduction",              "advance", "2100", "2103", False, 12),
    ("INCOME_TAX","Income Tax (Non-Saudi)","ضريبة الدخل (غير سعودي)",  "deduction",              "tax",  "2100", "2105", False, 13),
    ("OTHER_DED", "Other Deductions",      "خصومات أخرى",             "deduction",              "other","2100", "2100", False, 14),
    # EMPLOYER CONTRIBUTIONS
    ("GOSI_CO",   "GOSI — Employer (11.75%)", "التأمينات - صاحب عمل (11.75٪)", "employer_contribution", "gosi", "5110", "2102", True, 20),
]

for p in paycodes:
    cur.execute("""
        INSERT INTO paycodes (code, name, name_ar, paycode_type, category, gl_debit_account, gl_credit_account, is_gosi, sort_order)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (code) DO NOTHING
    """, p)

print("  OK — seeded", len(gl_accounts), "GL accounts +", len(paycodes), "paycodes")

cur.close()
conn.close()
print("\nMigration complete!")
