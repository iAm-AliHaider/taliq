"""Taliq HR Database — Neon Postgres persistent storage."""

import os
import json
import psycopg2
import psycopg2.extras
from datetime import date, datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")


def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    return conn


def _dict_row(cursor):
    """Convert cursor row to dict."""
    if cursor.description is None:
        return None
    cols = [d[0] for d in cursor.description]
    def row_to_dict(row):
        return dict(zip(cols, row)) if row else None
    return row_to_dict


def _fetchone(cursor):
    row = cursor.fetchone()
    if not row or not cursor.description:
        return None
    cols = [d[0] for d in cursor.description]
    return dict(zip(cols, row))


def _fetchall(cursor):
    rows = cursor.fetchall()
    if not cursor.description:
        return []
    cols = [d[0] for d in cursor.description]
    return [dict(zip(cols, row)) for row in rows]


def init_db():
    """Create tables and seed demo data if empty."""
    conn = get_db()
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_ar TEXT,
        position TEXT,
        department TEXT,
        email TEXT,
        phone TEXT,
        join_date TEXT,
        grade TEXT,
        level TEXT,
        manager_id TEXT,
        nationality TEXT,
        basic_salary REAL,
        housing_allowance REAL,
        transport_allowance REAL,
        annual_leave INTEGER DEFAULT 30,
        sick_leave INTEGER DEFAULT 30,
        emergency_leave INTEGER DEFAULT 5,
        study_leave INTEGER DEFAULT 15,
        pin TEXT DEFAULT '1234'
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS leave_requests (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        leave_type TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        days INTEGER NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        approver_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS document_requests (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        document_type TEXT NOT NULL,
        status TEXT DEFAULT 'requested',
        estimated_date TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        loan_type TEXT NOT NULL,
        amount REAL NOT NULL,
        remaining REAL NOT NULL,
        monthly_installment REAL,
        installments_left INTEGER,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT,
        priority TEXT DEFAULT 'normal',
        acknowledged_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 60,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS travel_requests (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        destination TEXT NOT NULL,
        travel_type TEXT DEFAULT 'business',
        start_date TEXT,
        end_date TEXT,
        days INTEGER,
        per_diem REAL,
        total_allowance REAL,
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        date TEXT NOT NULL,
        clock_in TEXT,
        clock_out TEXT,
        status TEXT DEFAULT 'present',
        hours_worked REAL DEFAULT 0,
        overtime_hours REAL DEFAULT 0,
        overtime_status TEXT DEFAULT 'none',
        location TEXT DEFAULT 'office',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(employee_id, date)
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS interviews (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE,
        candidate_name TEXT NOT NULL,
        position TEXT NOT NULL,
        interviewer_id TEXT,
        stage TEXT DEFAULT 'hr_screening',
        status TEXT DEFAULT 'in_progress',
        current_question INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 5,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        average_score REAL,
        notes TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS interview_responses (
        id SERIAL PRIMARY KEY,
        interview_id INTEGER NOT NULL REFERENCES interviews(id),
        question_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL,
        answer_summary TEXT,
        score INTEGER DEFAULT 0,
        feedback TEXT,
        answered_at TIMESTAMP DEFAULT NOW()
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS performance_reviews (
        id SERIAL PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        reviewer_id TEXT NOT NULL,
        period TEXT NOT NULL,
        rating INTEGER DEFAULT 3,
        goals_met INTEGER DEFAULT 0,
        total_goals INTEGER DEFAULT 5,
        strengths TEXT,
        improvements TEXT,
        comments TEXT,
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS performance_goals (
        id SERIAL PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        goal TEXT NOT NULL,
        target TEXT,
        progress INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        due_date TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS training_courses (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        provider TEXT,
        duration_hours REAL DEFAULT 4,
        category TEXT DEFAULT 'general',
        mandatory INTEGER DEFAULT 0,
        status TEXT DEFAULT 'available'
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS employee_trainings (
        id SERIAL PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        course_id INTEGER NOT NULL REFERENCES training_courses(id),
        enrollment_date TEXT DEFAULT CURRENT_DATE::TEXT,
        completion_date TEXT,
        score REAL,
        certificate_ref TEXT,
        status TEXT DEFAULT 'enrolled'
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS grievances (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        category TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT,
        severity TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'submitted',
        assigned_to TEXT,
        resolution TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    conn.commit()

    # Seed if empty
    c.execute("SELECT COUNT(*) FROM employees")
    if c.fetchone()[0] == 0:
        _seed_data(c)
        conn.commit()

    c.execute("SELECT COUNT(*) FROM training_courses")
    if c.fetchone()[0] == 0:
        _seed_training_courses(c)
        conn.commit()

    conn.close()


def _seed_data(c):
    employees = [
        ("E001", "Ahmed Al-Rashidi", "أحمد الرشيدي", "Senior Software Engineer", "Information Technology", "ahmed.rashidi@mrna.sa", "+966501234567", "2020-03-15", "35", "5", "E003", "Saudi", 12000, 3000, 1500, 22, 28, 4, 15, "1234"),
        ("E002", "Fatima Al-Zahrani", "فاطمة الزهراني", "HR Manager", "Human Resources", "fatima.zahrani@mrna.sa", "+966502345678", "2018-01-10", "37", "6", "E005", "Saudi", 18000, 4500, 2000, 15, 30, 5, 15, "2345"),
        ("E003", "Mohammed Al-Otaibi", "محمد العتيبي", "IT Manager", "Information Technology", "mohammed.otaibi@mrna.sa", "+966503456789", "2017-06-01", "38", "6", "E005", "Saudi", 22000, 5500, 2500, 10, 25, 3, 15, "3456"),
        ("E004", "Sara Al-Ghamdi", "سارة الغامدي", "Financial Analyst", "Finance", "sara.ghamdi@mrna.sa", "+966504567890", "2021-09-01", "34", "4", "E003", "Saudi", 10000, 2500, 1200, 28, 30, 5, 15, "4567"),
        ("E005", "Khalid Al-Harbi", "خالد الحربي", "CHRO", "Executive", "khalid.harbi@mrna.sa", "+966505678901", "2015-01-15", "40", "7", None, "Saudi", 35000, 8750, 3500, 5, 20, 2, 15, "5678"),
        ("E006", "Nour Al-Shammari", "نور الشمري", "Recruitment Specialist", "Human Resources", "nour.shammari@mrna.sa", "+966506789012", "2022-03-20", "33", "4", "E002", "Saudi", 8500, 2125, 1000, 26, 30, 5, 15, "6789"),
        ("E007", "Rajesh Kumar", "راجيش كومار", "DevOps Engineer", "Information Technology", "rajesh.kumar@mrna.sa", "+966507890123", "2019-11-01", "35", "5", "E003", "Indian", 11000, 2750, 1300, 18, 30, 5, 0, "7890"),
    ]
    for e in employees:
        c.execute("INSERT INTO employees VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", e)

    # Seed loans
    c.execute("INSERT INTO loans (ref, employee_id, loan_type, amount, remaining, monthly_installment, installments_left, status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        ("LN-2026-001", "E001", "Interest-Free", 24000, 16000, 2000, 8, "active"))
    c.execute("INSERT INTO loans (ref, employee_id, loan_type, amount, remaining, monthly_installment, installments_left, status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        ("LN-2026-002", "E004", "Advance Salary", 10000, 5000, 2500, 2, "active"))

    # Seed announcements
    announcements = [
        ("Ramadan Working Hours", "During Ramadan, working hours will be 10 AM to 3 PM.", "HR Department", "important", 45, 60),
        ("Annual Performance Review", "2026 review cycle begins March 1st. Managers prepare KPI evaluations.", "Khalid Al-Harbi", "urgent", 12, 60),
        ("New Parking Policy", "Register vehicles through portal by March 15. Unregistered vehicles not allowed.", "Operations", "normal", 30, 60),
    ]
    for a in announcements:
        c.execute("INSERT INTO announcements (title, content, author, priority, acknowledged_count, total_count) VALUES (%s,%s,%s,%s,%s,%s)", a)

    # Seed leave requests
    leaves = [
        ("LR-2026-001", "E001", "annual", "2026-03-10", "2026-03-14", 5, "Family vacation", "pending", "E003"),
        ("LR-2026-002", "E004", "sick", "2026-02-25", "2026-02-26", 2, "Medical appointment", "pending", "E003"),
        ("LR-2026-003", "E006", "annual", "2026-03-20", "2026-03-25", 6, "Wedding attendance", "pending", "E002"),
        ("LR-2026-004", "E007", "annual", "2026-04-01", "2026-04-15", 15, "Annual home visit", "pending", "E003"),
    ]
    for l in leaves:
        c.execute("INSERT INTO leave_requests (ref, employee_id, leave_type, start_date, end_date, days, reason, status, approver_id) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)", l)

    # Seed document requests
    c.execute("INSERT INTO document_requests (ref, employee_id, document_type, status, estimated_date) VALUES (%s,%s,%s,%s,%s)",
        ("DOC-2026-001", "E001", "Salary Certificate", "ready", "2026-02-22"))
    c.execute("INSERT INTO document_requests (ref, employee_id, document_type, status, estimated_date) VALUES (%s,%s,%s,%s,%s)",
        ("DOC-2026-002", "E004", "Experience Certificate", "processing", "2026-02-27"))


def _seed_training_courses(c):
    courses = [
        ("Safety Compliance", "OSHA workplace safety standards and emergency procedures", "Internal", 8, "compliance", 1),
        ("Leadership Workshop", "Developing leadership skills for mid-level managers", "Dale Carnegie", 16, "leadership", 0),
        ("Excel Advanced", "Pivot tables, VLOOKUP, macros, and data analysis", "Microsoft", 6, "technical", 0),
        ("Project Management Professional", "PMP preparation and Agile methodology", "PMI", 40, "professional", 0),
        ("Cybersecurity Awareness", "Phishing prevention, password security, data protection", "Internal", 4, "compliance", 1),
        ("First Aid & CPR", "Emergency response and basic life support certification", "Red Crescent", 8, "safety", 1),
        ("Business Communication", "Professional writing and presentation skills", "External", 12, "professional", 0),
        ("Arabic Business Writing", "Formal correspondence and report writing in Arabic", "Internal", 6, "language", 0),
    ]
    for title, desc, provider, hours, cat, mandatory in courses:
        c.execute("INSERT INTO training_courses (title, description, provider, duration_hours, category, mandatory) VALUES (%s,%s,%s,%s,%s,%s)",
                  (title, desc, provider, hours, cat, mandatory))


# ── Query Functions ─────────────────────────────────────


def get_employee(emp_id: str) -> dict | None:
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM employees WHERE id = %s", (emp_id,))
    d = _fetchone(c)
    conn.close()
    if not d:
        return None
    d["salary"] = {
        "basic": d["basic_salary"],
        "housing": d["housing_allowance"],
        "transport": d["transport_allowance"],
        "total": d["basic_salary"] + d["housing_allowance"] + d["transport_allowance"],
        "currency": "SAR",
    }
    d["leave_balance"] = {
        "annual": d["annual_leave"],
        "sick": d["sick_leave"],
        "emergency": d["emergency_leave"],
        "study": d["study_leave"],
    }
    return d


def get_manager(emp_id: str) -> dict | None:
    emp = get_employee(emp_id)
    if emp and emp.get("manager_id"):
        return get_employee(emp["manager_id"])
    return None


# ── Leave CRUD ──────────────────────────────────────────


def submit_leave_request(emp_id, leave_type, start_date, end_date, days, reason):
    conn = get_db()
    c = conn.cursor()
    emp = get_employee(emp_id)
    approver = emp.get("manager_id") if emp else None
    c.execute("SELECT COUNT(*) FROM leave_requests")
    count = c.fetchone()[0]
    ref = f"LR-2026-{count + 1:03d}"
    c.execute("INSERT INTO leave_requests (ref, employee_id, leave_type, start_date, end_date, days, reason, status, approver_id) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        (ref, emp_id, leave_type, start_date, end_date, days, reason, "pending", approver))
    col = f"{leave_type}_leave"
    c.execute(f"UPDATE employees SET {col} = {col} - %s WHERE id = %s", (days, emp_id))
    conn.commit()
    c.execute("SELECT * FROM leave_requests WHERE ref = %s", (ref,))
    row = _fetchone(c)
    conn.close()
    return row


def get_leave_requests(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM leave_requests WHERE employee_id = %s ORDER BY created_at DESC", (emp_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def get_pending_approvals(manager_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT lr.*, e.name as employee_name FROM leave_requests lr JOIN employees e ON lr.employee_id = e.id WHERE lr.approver_id = %s AND lr.status = 'pending' ORDER BY lr.created_at DESC", (manager_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def approve_leave_request(ref, decision):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE leave_requests SET status = %s, updated_at = NOW() WHERE ref = %s", (decision, ref))
    conn.commit()
    c.execute("SELECT lr.*, e.name as employee_name FROM leave_requests lr JOIN employees e ON lr.employee_id = e.id WHERE lr.ref = %s", (ref,))
    row = _fetchone(c)
    conn.close()
    return row


# ── Document CRUD ───────────────────────────────────────


def create_document_request(emp_id, doc_type):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM document_requests")
    count = c.fetchone()[0]
    ref = f"DOC-2026-{count + 1:03d}"
    est = str(date.today() + timedelta(days=2))
    c.execute("INSERT INTO document_requests (ref, employee_id, document_type, status, estimated_date) VALUES (%s,%s,%s,%s,%s)",
        (ref, emp_id, doc_type, "requested", est))
    conn.commit()
    c.execute("SELECT * FROM document_requests WHERE ref = %s", (ref,))
    row = _fetchone(c)
    conn.close()
    return row


def get_document_requests(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM document_requests WHERE employee_id = %s ORDER BY created_at DESC", (emp_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


# ── Loan CRUD ───────────────────────────────────────────


def get_employee_loans(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM loans WHERE employee_id = %s AND status IN ('active', 'pending') ORDER BY created_at DESC", (emp_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def check_loan_eligibility(emp_id):
    emp = get_employee(emp_id)
    if not emp:
        return {"eligible": False, "reason": "Employee not found"}
    join = date.fromisoformat(emp["join_date"])
    years = (date.today() - join).days / 365.25
    if years < 1:
        return {"eligible": False, "reason": "Min 1 year service required"}
    loans = get_employee_loans(emp_id)
    basic = emp["salary"]["basic"]
    existing_emi = sum(l.get("monthly_installment", 0) or 0 for l in loans)
    max_emi = basic * 0.33
    available = max_emi - existing_emi
    if available <= 0:
        return {"eligible": False, "reason": f"EMI cap reached ({existing_emi:,.0f}/{max_emi:,.0f} SAR)"}
    return {"eligible": True, "max_amount": int(min(basic * 2, available * 12)), "max_emi": int(available), "service_years": round(years, 1)}


def create_loan(emp_id, loan_type, amount, months):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM loans")
    count = c.fetchone()[0]
    ref = f"LN-2026-{count + 1:03d}"
    monthly = round(amount / months, 2)
    c.execute("INSERT INTO loans (ref, employee_id, loan_type, amount, remaining, monthly_installment, installments_left, status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        (ref, emp_id, loan_type, amount, amount, monthly, months, "pending"))
    conn.commit()
    c.execute("SELECT * FROM loans WHERE ref = %s", (ref,))
    row = _fetchone(c)
    conn.close()
    return row


# ── Travel CRUD ─────────────────────────────────────────

PER_DIEM = {"chairman": {"intl": 3500, "local": 2000}, "c_level": {"intl": 1750, "local": 1200}, "other": {"intl": 1350, "local": 900}}

def get_per_diem(grade, international=False):
    g = int(grade) if grade and grade.isdigit() else 34
    tier = "chairman" if g >= 40 else "c_level" if g >= 38 else "other"
    return PER_DIEM[tier]["intl" if international else "local"]


def create_travel_request(emp_id, destination, start_date, end_date, days, travel_type="business"):
    conn = get_db()
    c = conn.cursor()
    emp = get_employee(emp_id)
    per_diem = get_per_diem(emp.get("grade", "34")) if emp else 900
    total = per_diem * min(days, 5)
    c.execute("SELECT COUNT(*) FROM travel_requests")
    count = c.fetchone()[0]
    ref = f"TR-2026-{count + 1:03d}"
    c.execute("INSERT INTO travel_requests (ref, employee_id, destination, travel_type, start_date, end_date, days, per_diem, total_allowance, status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        (ref, emp_id, destination, travel_type, start_date, end_date, days, per_diem, total, "pending"))
    conn.commit()
    c.execute("SELECT * FROM travel_requests WHERE ref = %s", (ref,))
    row = _fetchone(c)
    conn.close()
    return row


def get_travel_requests(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM travel_requests WHERE employee_id = %s ORDER BY created_at DESC", (emp_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


# ── Announcements ───────────────────────────────────────

def get_announcements(limit=5):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM announcements ORDER BY created_at DESC LIMIT %s", (limit,))
    rows = _fetchall(c)
    conn.close()
    return rows


# ── Team Attendance ─────────────────────────────────────

def get_team_attendance(manager_id):
    import random
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, name FROM employees WHERE manager_id = %s", (manager_id,))
    rows = _fetchall(c)
    conn.close()
    statuses = ["present", "present", "present", "remote", "late", "absent", "on_leave"]
    result = []
    for r in rows:
        status = random.choice(statuses)
        ci = f"0{random.randint(7,9)}:{random.randint(0,59):02d}" if status in ("present","late","remote") else None
        co = f"{random.randint(16,18)}:{random.randint(0,59):02d}" if status == "present" else None
        result.append({"name": r["name"], "status": status, "checkIn": ci, "checkOut": co})
    return result


# ── Authentication ──────────────────────────────────────

def authenticate(employee_id, pin):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM employees WHERE id = %s AND pin = %s", (employee_id, pin))
    d = _fetchone(c)
    conn.close()
    if not d:
        return None
    return {"id": d["id"], "name": d["name"], "name_ar": d["name_ar"], "position": d["position"], "department": d["department"], "manager_id": d["manager_id"]}


def get_all_employees_summary():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, name, position, department FROM employees ORDER BY id")
    rows = _fetchall(c)
    conn.close()
    return rows


def get_direct_reports(manager_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, name, name_ar, position, department FROM employees WHERE manager_id = %s", (manager_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def is_manager(employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM employees WHERE manager_id = %s", (employee_id,))
    count = c.fetchone()[0]
    conn.close()
    return count > 0


def get_department_stats(manager_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM employees WHERE manager_id = %s", (manager_id,))
    headcount = c.fetchone()[0]
    today = date.today().isoformat()
    c.execute("SELECT COUNT(DISTINCT employee_id) FROM leave_requests WHERE approver_id = %s AND status = 'approved' AND start_date <= %s AND end_date >= %s", (manager_id, today, today))
    on_leave = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM leave_requests WHERE approver_id = %s AND status = 'pending'", (manager_id,))
    pending = c.fetchone()[0]
    att = get_team_attendance(manager_id)
    present_count = sum(1 for a in att if a["status"] in ("present", "remote"))
    avg_att = round((present_count / headcount * 100) if headcount > 0 else 0)
    conn.close()
    return {"headcount": headcount, "on_leave": on_leave, "pending_approvals": pending, "avg_attendance": avg_att}


# ── Attendance CRUD ─────────────────────────────────────

def clock_in(emp_id, location="office"):
    conn = get_db()
    c = conn.cursor()
    today = str(date.today())
    now = datetime.now().strftime("%H:%M")
    c.execute("SELECT * FROM attendance_records WHERE employee_id = %s AND date = %s", (emp_id, today))
    existing = _fetchone(c)
    if existing and existing["clock_in"]:
        conn.close()
        return {"error": f"Already clocked in at {existing['clock_in']}", "record": existing}
    hour, minute = map(int, now.split(":"))
    status = "late" if (hour > 8 or (hour == 8 and minute > 30)) else "present"
    if existing:
        c.execute("UPDATE attendance_records SET clock_in = %s, status = %s, location = %s WHERE employee_id = %s AND date = %s", (now, status, location, emp_id, today))
    else:
        c.execute("INSERT INTO attendance_records (employee_id, date, clock_in, status, location) VALUES (%s,%s,%s,%s,%s)", (emp_id, today, now, status, location))
    conn.commit()
    c.execute("SELECT * FROM attendance_records WHERE employee_id = %s AND date = %s", (emp_id, today))
    row = _fetchone(c)
    conn.close()
    return row


def clock_out(emp_id):
    conn = get_db()
    c = conn.cursor()
    today = str(date.today())
    now = datetime.now().strftime("%H:%M")
    c.execute("SELECT * FROM attendance_records WHERE employee_id = %s AND date = %s", (emp_id, today))
    existing = _fetchone(c)
    if not existing or not existing["clock_in"]:
        conn.close()
        return {"error": "Not clocked in today"}
    if existing["clock_out"]:
        conn.close()
        return {"error": f"Already clocked out at {existing['clock_out']}", "record": existing}
    ci_h, ci_m = map(int, existing["clock_in"].split(":"))
    co_h, co_m = map(int, now.split(":"))
    hours = round((co_h * 60 + co_m - ci_h * 60 - ci_m) / 60, 2)
    overtime = max(0, round(hours - 8, 2))
    c.execute("UPDATE attendance_records SET clock_out = %s, hours_worked = %s, overtime_hours = %s WHERE employee_id = %s AND date = %s", (now, hours, overtime, emp_id, today))
    conn.commit()
    c.execute("SELECT * FROM attendance_records WHERE employee_id = %s AND date = %s", (emp_id, today))
    row = _fetchone(c)
    conn.close()
    return row


def get_my_attendance(emp_id, days=7):
    conn = get_db()
    c = conn.cursor()
    since = str(date.today() - timedelta(days=days))
    c.execute("SELECT * FROM attendance_records WHERE employee_id = %s AND date >= %s ORDER BY date DESC", (emp_id, since))
    rows = _fetchall(c)
    conn.close()
    return rows


def get_today_attendance(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM attendance_records WHERE employee_id = %s AND date = %s", (emp_id, str(date.today())))
    row = _fetchone(c)
    conn.close()
    return row


def request_overtime(emp_id, hours, reason):
    conn = get_db()
    c = conn.cursor()
    today = str(date.today())
    c.execute("UPDATE attendance_records SET overtime_hours = %s, overtime_status = 'pending', notes = %s WHERE employee_id = %s AND date = %s", (hours, reason, emp_id, today))
    conn.commit()
    c.execute("SELECT * FROM attendance_records WHERE employee_id = %s AND date = %s", (emp_id, today))
    row = _fetchone(c)
    conn.close()
    return row if row else {"error": "No attendance record for today"}


# ── Interview CRUD ──────────────────────────────────────

QUESTION_BANK = {
    "hr_screening": [
        {"q": "Tell me about yourself and your professional background.", "type": "Behavioral", "time": 3},
        {"q": "What motivated you to apply for this position?", "type": "Motivation", "time": 2},
        {"q": "Describe your ideal work environment.", "type": "Cultural Fit", "time": 2},
        {"q": "What are your salary expectations?", "type": "Practical", "time": 2},
        {"q": "Where do you see yourself in 3-5 years?", "type": "Career Goals", "time": 2},
    ],
    "technical": [
        {"q": "Describe a complex technical problem you solved recently.", "type": "Problem Solving", "time": 4},
        {"q": "How do you approach debugging a production issue?", "type": "Technical", "time": 3},
        {"q": "Explain a system you designed from scratch.", "type": "Architecture", "time": 4},
        {"q": "How do you ensure code quality in your team?", "type": "Process", "time": 3},
        {"q": "What emerging technology excites you and why?", "type": "Innovation", "time": 2},
    ],
    "behavioral": [
        {"q": "Tell me about a time you handled a conflict with a colleague.", "type": "Conflict Resolution", "time": 3},
        {"q": "Describe a situation where you had to meet a tight deadline.", "type": "Time Management", "time": 3},
        {"q": "Give an example of when you took initiative beyond your role.", "type": "Leadership", "time": 3},
        {"q": "How did you handle a project that was failing?", "type": "Problem Solving", "time": 3},
        {"q": "Tell me about receiving difficult feedback.", "type": "Growth Mindset", "time": 2},
    ],
    "leadership": [
        {"q": "How do you motivate underperforming team members?", "type": "People Management", "time": 3},
        {"q": "Describe your approach to strategic planning.", "type": "Strategy", "time": 4},
        {"q": "How do you handle disagreements with senior leadership?", "type": "Communication", "time": 3},
        {"q": "Tell me about a time you had to make a difficult decision with limited data.", "type": "Decision Making", "time": 3},
        {"q": "How do you develop talent in your team?", "type": "Mentorship", "time": 3},
    ],
}


def start_interview(interviewer_id, candidate_name, position, stage="hr_screening"):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM interviews")
    count = c.fetchone()[0]
    ref = f"INT-2026-{count + 1:03d}"
    questions = QUESTION_BANK.get(stage, QUESTION_BANK["hr_screening"])
    c.execute("INSERT INTO interviews (ref, candidate_name, position, interviewer_id, stage, total_questions) VALUES (%s,%s,%s,%s,%s,%s)",
        (ref, candidate_name, position, interviewer_id, stage, len(questions)))
    conn.commit()
    c.execute("SELECT * FROM interviews WHERE ref = %s", (ref,))
    row = _fetchone(c)
    conn.close()
    return row


def get_current_interview(interviewer_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM interviews WHERE interviewer_id = %s AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1", (interviewer_id,))
    row = _fetchone(c)
    conn.close()
    return row


def get_interview_question(interview_id, question_number):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM interviews WHERE id = %s", (interview_id,))
    interview = _fetchone(c)
    conn.close()
    if not interview:
        return None
    stage = interview["stage"]
    questions = QUESTION_BANK.get(stage, QUESTION_BANK["hr_screening"])
    if question_number < 0 or question_number >= len(questions):
        return None
    q = questions[question_number]
    return {"question": q["q"], "type": q["type"], "time_minutes": q["time"], "number": question_number + 1, "total": len(questions)}


def score_answer(interview_id, question_number, score, feedback=""):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM interviews WHERE id = %s", (interview_id,))
    interview = _fetchone(c)
    if not interview:
        conn.close()
        return {"error": "Interview not found"}
    stage = interview["stage"]
    questions = QUESTION_BANK.get(stage, QUESTION_BANK["hr_screening"])
    if question_number < 0 or question_number >= len(questions):
        conn.close()
        return {"error": "Invalid question number"}
    q = questions[question_number]
    score = max(1, min(5, score))
    c.execute("SELECT id FROM interview_responses WHERE interview_id = %s AND question_number = %s", (interview_id, question_number))
    existing = _fetchone(c)
    if existing:
        c.execute("UPDATE interview_responses SET score = %s, feedback = %s, answered_at = NOW() WHERE id = %s", (score, feedback, existing["id"]))
    else:
        c.execute("INSERT INTO interview_responses (interview_id, question_number, question_text, question_type, score, feedback) VALUES (%s,%s,%s,%s,%s,%s)",
            (interview_id, question_number, q["q"], q["type"], score, feedback))
    c.execute("UPDATE interviews SET current_question = %s WHERE id = %s", (question_number + 1, interview_id))
    conn.commit()
    c.execute("SELECT * FROM interview_responses WHERE interview_id = %s AND question_number = %s", (interview_id, question_number))
    row = _fetchone(c)
    conn.close()
    return row


def complete_interview(interview_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT score FROM interview_responses WHERE interview_id = %s", (interview_id,))
    responses = _fetchall(c)
    if not responses:
        conn.close()
        return {"error": "No responses recorded"}
    avg = round(sum(r["score"] for r in responses) / len(responses), 1)
    c.execute("UPDATE interviews SET status = 'completed', completed_at = NOW(), average_score = %s WHERE id = %s", (avg, interview_id))
    conn.commit()
    c.execute("SELECT * FROM interviews WHERE id = %s", (interview_id,))
    row = _fetchone(c)
    conn.close()
    return row


def get_interview_responses(interview_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM interview_responses WHERE interview_id = %s ORDER BY question_number", (interview_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


# ── Performance CRUD ────────────────────────────────────

def create_review(reviewer_id, employee_id, period, rating, strengths, improvements, comments=""):
    conn = get_db()
    c = conn.cursor()
    rating = max(1, min(5, rating))
    c.execute("SELECT COUNT(*) as total, COALESCE(SUM(CASE WHEN progress >= 100 THEN 1 ELSE 0 END), 0) as met FROM performance_goals WHERE employee_id = %s", (employee_id,))
    goals = _fetchone(c)
    c.execute("INSERT INTO performance_reviews (employee_id, reviewer_id, period, rating, goals_met, total_goals, strengths, improvements, comments, status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,'completed')",
        (employee_id, reviewer_id, period, rating, goals["met"] or 0, goals["total"] or 0, strengths, improvements, comments))
    conn.commit()
    c.execute("SELECT * FROM performance_reviews WHERE employee_id = %s ORDER BY created_at DESC LIMIT 1", (employee_id,))
    row = _fetchone(c)
    conn.close()
    return row


def get_employee_reviews(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT pr.*, e.name as reviewer_name FROM performance_reviews pr LEFT JOIN employees e ON pr.reviewer_id = e.id WHERE pr.employee_id = %s ORDER BY created_at DESC", (emp_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def get_pending_reviews(reviewer_id):
    conn = get_db()
    c = conn.cursor()
    reports = get_direct_reports(reviewer_id)
    report_ids = [r["id"] for r in reports]
    if not report_ids:
        conn.close()
        return []
    c.execute("SELECT employee_id FROM performance_reviews WHERE reviewer_id = %s AND period = %s", (reviewer_id, "Q1 2026"))
    reviewed = _fetchall(c)
    reviewed_ids = {r["employee_id"] for r in reviewed}
    pending = [r for r in reports if r["id"] not in reviewed_ids]
    conn.close()
    return pending


def set_goal(emp_id, goal, target, due_date):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO performance_goals (employee_id, goal, target, due_date) VALUES (%s,%s,%s,%s)", (emp_id, goal, target, due_date))
    conn.commit()
    c.execute("SELECT * FROM performance_goals WHERE employee_id = %s ORDER BY id DESC LIMIT 1", (emp_id,))
    row = _fetchone(c)
    conn.close()
    return row


def get_goals(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM performance_goals WHERE employee_id = %s ORDER BY due_date", (emp_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def update_goal_progress(goal_id, progress):
    conn = get_db()
    c = conn.cursor()
    progress = max(0, min(100, progress))
    status = "completed" if progress >= 100 else "active"
    c.execute("UPDATE performance_goals SET progress = %s, status = %s WHERE id = %s", (progress, status, goal_id))
    conn.commit()
    c.execute("SELECT * FROM performance_goals WHERE id = %s", (goal_id,))
    row = _fetchone(c)
    conn.close()
    return row if row else {"error": "Goal not found"}


# ── Training CRUD ───────────────────────────────────────

def get_available_courses():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM training_courses WHERE status = 'available' ORDER BY mandatory DESC, title")
    rows = _fetchall(c)
    conn.close()
    return rows


def enroll_in_course(emp_id, course_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM employee_trainings WHERE employee_id = %s AND course_id = %s AND status != 'dropped'", (emp_id, course_id))
    existing = _fetchone(c)
    if existing:
        conn.close()
        return {"error": "Already enrolled", "record": existing}
    c.execute("INSERT INTO employee_trainings (employee_id, course_id) VALUES (%s,%s)", (emp_id, course_id))
    conn.commit()
    c.execute("SELECT et.*, tc.title, tc.duration_hours, tc.category FROM employee_trainings et JOIN training_courses tc ON et.course_id = tc.id WHERE et.employee_id = %s AND et.course_id = %s", (emp_id, course_id))
    row = _fetchone(c)
    conn.close()
    return row


def get_my_trainings(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT et.*, tc.title, tc.duration_hours, tc.category, tc.mandatory FROM employee_trainings et JOIN training_courses tc ON et.course_id = tc.id WHERE et.employee_id = %s ORDER BY et.enrollment_date DESC", (emp_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def complete_training(emp_id, course_id, score):
    conn = get_db()
    c = conn.cursor()
    cert_ref = f"CERT-{emp_id}-{course_id}-2026"
    c.execute("UPDATE employee_trainings SET status = 'completed', completion_date = CURRENT_DATE::TEXT, score = %s, certificate_ref = %s WHERE employee_id = %s AND course_id = %s", (score, cert_ref, emp_id, course_id))
    conn.commit()
    c.execute("SELECT et.*, tc.title FROM employee_trainings et JOIN training_courses tc ON et.course_id = tc.id WHERE et.employee_id = %s AND et.course_id = %s", (emp_id, course_id))
    row = _fetchone(c)
    conn.close()
    return row if row else {"error": "Enrollment not found"}


def get_training_stats(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM employee_trainings WHERE employee_id = %s", (emp_id,))
    total = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM employee_trainings WHERE employee_id = %s AND status = 'completed'", (emp_id,))
    completed = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM training_courses WHERE mandatory = 1")
    mandatory_total = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM employee_trainings et JOIN training_courses tc ON et.course_id = tc.id WHERE et.employee_id = %s AND tc.mandatory = 1 AND et.status = 'completed'", (emp_id,))
    mandatory_done = c.fetchone()[0]
    conn.close()
    return {"total_enrolled": total, "completed": completed, "mandatory_total": mandatory_total, "mandatory_completed": mandatory_done, "compliance": round((mandatory_done / mandatory_total * 100) if mandatory_total > 0 else 100)}


# ── Grievance CRUD ──────────────────────────────────────

def submit_grievance(emp_id, category, subject, description, severity="medium"):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM grievances")
    count = c.fetchone()[0]
    ref = f"GRV-2026-{count + 1:03d}"
    c.execute("INSERT INTO grievances (ref, employee_id, category, subject, description, severity) VALUES (%s,%s,%s,%s,%s,%s)", (ref, emp_id, category, subject, description, severity))
    conn.commit()
    c.execute("SELECT * FROM grievances WHERE ref = %s", (ref,))
    row = _fetchone(c)
    conn.close()
    return row


def get_my_grievances(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM grievances WHERE employee_id = %s ORDER BY submitted_at DESC", (emp_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def get_all_grievances():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT g.*, e.name as employee_name FROM grievances g JOIN employees e ON g.employee_id = e.id ORDER BY submitted_at DESC")
    rows = _fetchall(c)
    conn.close()
    return rows


def update_grievance_status(ref, status, resolution=""):
    conn = get_db()
    c = conn.cursor()
    if status in ("resolved", "closed"):
        c.execute("UPDATE grievances SET status = %s, resolved_at = NOW(), resolution = %s WHERE ref = %s", (status, resolution, ref))
    else:
        c.execute("UPDATE grievances SET status = %s WHERE ref = %s", (status, ref))
    conn.commit()
    c.execute("SELECT * FROM grievances WHERE ref = %s", (ref,))
    row = _fetchone(c)
    conn.close()
    return row if row else {"error": "Not found"}


# ── Notifications ───────────────────────────────────────

def create_notification(emp_id, ntype, title, message):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO notifications (employee_id, type, title, message) VALUES (%s,%s,%s,%s)", (emp_id, ntype, title, message))
    conn.commit()
    conn.close()
    return {"ok": True}


def get_unread_notifications(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM notifications WHERE employee_id = %s AND read = 0 ORDER BY created_at DESC", (emp_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def get_all_notifications(emp_id, limit=20):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM notifications WHERE employee_id = %s ORDER BY created_at DESC LIMIT %s", (emp_id, limit))
    rows = _fetchall(c)
    conn.close()
    return rows


def mark_notification_read(notif_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE notifications SET read = 1 WHERE id = %s", (notif_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# ── Manager Extended ────────────────────────────────────

def get_pending_loan_requests(manager_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT l.*, e.name as employee_name, e.position, e.department, e.basic_salary FROM loans l JOIN employees e ON l.employee_id = e.id WHERE e.manager_id = %s AND l.status = 'pending' ORDER BY l.created_at DESC", (manager_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def approve_loan(ref, decision, notes=""):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE loans SET status = %s WHERE ref = %s AND status = 'pending'", (decision, ref))
    conn.commit()
    c.execute("SELECT l.*, e.name as employee_name FROM loans l JOIN employees e ON l.employee_id = e.id WHERE l.ref = %s", (ref,))
    row = _fetchone(c)
    conn.close()
    if row:
        create_notification(row["employee_id"], "loan", f"Loan {decision.title()}", f"Your loan {ref} for {row['amount']:,.0f} SAR has been {decision}.")
    return row


def get_pending_travel_requests(manager_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT t.*, e.name as employee_name, e.position, e.department FROM travel_requests t JOIN employees e ON t.employee_id = e.id WHERE e.manager_id = %s AND t.status = 'pending' ORDER BY t.created_at DESC", (manager_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def approve_travel(ref, decision):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE travel_requests SET status = %s WHERE ref = %s AND status = 'pending'", (decision, ref))
    conn.commit()
    c.execute("SELECT t.*, e.name as employee_name FROM travel_requests t JOIN employees e ON t.employee_id = e.id WHERE t.ref = %s", (ref,))
    row = _fetchone(c)
    conn.close()
    if row:
        create_notification(row["employee_id"], "travel", f"Travel {decision.title()}", f"Your travel {ref} to {row['destination']} has been {decision}.")
    return row


def get_pending_overtime_requests(manager_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT a.*, e.name as employee_name, e.position FROM attendance_records a JOIN employees e ON a.employee_id = e.id WHERE e.manager_id = %s AND a.overtime_status = 'pending' ORDER BY a.date DESC", (manager_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def approve_overtime(record_id, decision):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE attendance_records SET overtime_status = %s WHERE id = %s", (decision, record_id))
    conn.commit()
    c.execute("SELECT a.*, e.name as employee_name FROM attendance_records a JOIN employees e ON a.employee_id = e.id WHERE a.id = %s", (record_id,))
    row = _fetchone(c)
    conn.close()
    if row:
        create_notification(row["employee_id"], "attendance", f"Overtime {decision.title()}", f"Your overtime request for {row['overtime_hours']}h on {row['date']} has been {decision}.")
    return row


def get_pending_document_requests(manager_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT d.*, e.name as employee_name, e.position FROM document_requests d JOIN employees e ON d.employee_id = e.id WHERE e.manager_id = %s AND d.status IN ('requested', 'processing') ORDER BY d.created_at DESC", (manager_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def approve_document(ref, decision):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE document_requests SET status = %s WHERE ref = %s", (decision, ref))
    conn.commit()
    c.execute("SELECT d.*, e.name as employee_name FROM document_requests d JOIN employees e ON d.employee_id = e.id WHERE d.ref = %s", (ref,))
    row = _fetchone(c)
    conn.close()
    if row:
        create_notification(row["employee_id"], "document", f"Document {decision.title()}", f"Your {row['document_type']} ({ref}) status: {decision}.")
    return row


def get_department_grievances(manager_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT g.*, e.name as employee_name, e.position FROM grievances g JOIN employees e ON g.employee_id = e.id WHERE e.manager_id = %s OR g.assigned_to = %s ORDER BY g.submitted_at DESC", (manager_id, manager_id))
    rows = _fetchall(c)
    conn.close()
    return rows


def assign_grievance(ref, assigned_to):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE grievances SET assigned_to = %s, status = 'investigating' WHERE ref = %s", (assigned_to, ref))
    conn.commit()
    c.execute("SELECT * FROM grievances WHERE ref = %s", (ref,))
    row = _fetchone(c)
    conn.close()
    return row


def resolve_grievance(ref, resolution):
    return update_grievance_status(ref, "resolved", resolution)


def get_team_performance_summary(manager_id):
    conn = get_db()
    c = conn.cursor()
    reports = get_direct_reports(manager_id)
    result = []
    for emp in reports:
        eid = emp["id"]
        c.execute("SELECT rating, period FROM performance_reviews WHERE employee_id = %s ORDER BY created_at DESC LIMIT 1", (eid,))
        review = _fetchone(c)
        c.execute("SELECT COUNT(*) as total, COALESCE(SUM(CASE WHEN progress >= 100 THEN 1 ELSE 0 END), 0) as completed FROM performance_goals WHERE employee_id = %s", (eid,))
        goals = _fetchone(c)
        c.execute("SELECT COUNT(*) as enrolled, COALESCE(SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END), 0) as completed FROM employee_trainings WHERE employee_id = %s", (eid,))
        training = _fetchone(c)
        month_start = date.today().replace(day=1).isoformat()
        c.execute("SELECT COUNT(*) as days, COALESCE(SUM(CASE WHEN status IN ('present','remote') THEN 1 ELSE 0 END), 0) as present FROM attendance_records WHERE employee_id = %s AND date >= %s", (eid, month_start))
        att = _fetchone(c)
        result.append({
            "employee_id": eid, "name": emp["name"], "position": emp["position"],
            "latest_rating": review["rating"] if review else None,
            "review_period": review["period"] if review else None,
            "goals_total": goals["total"] or 0, "goals_completed": goals["completed"] or 0,
            "trainings_enrolled": training["enrolled"] or 0, "trainings_completed": training["completed"] or 0,
            "attendance_days": att["days"] or 0, "attendance_present": att["present"] or 0,
        })
    conn.close()
    return result


def get_all_pending_for_manager(manager_id):
    return {
        "leave_requests": get_pending_approvals(manager_id),
        "loan_requests": get_pending_loan_requests(manager_id),
        "travel_requests": get_pending_travel_requests(manager_id),
        "overtime_requests": get_pending_overtime_requests(manager_id),
        "document_requests": get_pending_document_requests(manager_id),
        "grievances": get_department_grievances(manager_id),
        "pending_reviews": get_pending_reviews(manager_id),
    }


def get_team_training_compliance(manager_id):
    reports = get_direct_reports(manager_id)
    return [{"employee_id": emp["id"], "name": emp["name"], "position": emp["position"], **get_training_stats(emp["id"])} for emp in reports]


def reassign_employee(emp_id, new_manager_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE employees SET manager_id = %s WHERE id = %s", (new_manager_id, emp_id))
    conn.commit()
    c.execute("SELECT id, name, position, department, manager_id FROM employees WHERE id = %s", (emp_id,))
    row = _fetchone(c)
    conn.close()
    if row:
        mgr = get_employee(new_manager_id)
        create_notification(emp_id, "hr", "Manager Reassignment", f"You have been reassigned to {mgr['name'] if mgr else new_manager_id}.")
        return row
    return {"error": "Employee not found"}


def get_headcount_by_department():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT department, COUNT(*) as count FROM employees GROUP BY department ORDER BY count DESC")
    rows = _fetchall(c)
    conn.close()
    return rows


def get_leave_analytics(manager_id):
    conn = get_db()
    c = conn.cursor()
    reports = get_direct_reports(manager_id)
    report_ids = [r["id"] for r in reports]
    if not report_ids:
        conn.close()
        return {"total_requests": 0, "by_type": {}, "by_status": {}}
    placeholders = ",".join(["%s"] * len(report_ids))
    c.execute(f"SELECT leave_type, status, COUNT(*) as cnt FROM leave_requests WHERE employee_id IN ({placeholders}) GROUP BY leave_type, status", report_ids)
    rows = _fetchall(c)
    by_type, by_status, total = {}, {}, 0
    for r in rows:
        by_type[r["leave_type"]] = by_type.get(r["leave_type"], 0) + r["cnt"]
        by_status[r["status"]] = by_status.get(r["status"], 0) + r["cnt"]
        total += r["cnt"]
    conn.close()
    return {"total_requests": total, "by_type": by_type, "by_status": by_status}


def get_employee_all_requests(emp_id):
    return {
        "leave_requests": get_leave_requests(emp_id),
        "loans": get_employee_loans(emp_id),
        "documents": get_document_requests(emp_id),
        "travel": get_travel_requests(emp_id),
        "grievances": get_my_grievances(emp_id),
    }


# Auto-init on import
init_db()
