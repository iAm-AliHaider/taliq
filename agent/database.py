"""Taliq HR Database — SQLite persistent storage."""

import sqlite3
import os
import json
from datetime import date, datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "taliq.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Create tables and seed demo data if empty."""
    conn = get_db()
    c = conn.cursor()

    c.executescript("""
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
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ref TEXT UNIQUE,
        employee_id TEXT NOT NULL,
        leave_type TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        days INTEGER NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        approver_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS document_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ref TEXT UNIQUE,
        employee_id TEXT NOT NULL,
        document_type TEXT NOT NULL,
        status TEXT DEFAULT 'requested',
        estimated_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ref TEXT UNIQUE,
        employee_id TEXT NOT NULL,
        loan_type TEXT NOT NULL,
        amount REAL NOT NULL,
        remaining REAL NOT NULL,
        monthly_installment REAL,
        installments_left INTEGER,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT,
        priority TEXT DEFAULT 'normal',
        acknowledged_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 60,
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS travel_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ref TEXT UNIQUE,
        employee_id TEXT NOT NULL,
        destination TEXT NOT NULL,
        travel_type TEXT DEFAULT 'business',
        start_date TEXT,
        end_date TEXT,
        days INTEGER,
        per_diem REAL,
        total_allowance REAL,
        status TEXT DEFAULT 'draft',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL,
        date TEXT NOT NULL,
        clock_in TEXT,
        clock_out TEXT,
        status TEXT DEFAULT 'present',
        hours_worked REAL DEFAULT 0,
        overtime_hours REAL DEFAULT 0,
        overtime_status TEXT DEFAULT 'none',
        location TEXT DEFAULT 'office',
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (employee_id) REFERENCES employees(id),
        UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS interviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ref TEXT UNIQUE,
        candidate_name TEXT NOT NULL,
        position TEXT NOT NULL,
        interviewer_id TEXT,
        stage TEXT DEFAULT 'hr_screening',
        status TEXT DEFAULT 'in_progress',
        current_question INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 5,
        started_at TEXT DEFAULT (datetime('now')),
        completed_at TEXT,
        average_score REAL,
        notes TEXT,
        FOREIGN KEY (interviewer_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS interview_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        interview_id INTEGER NOT NULL,
        question_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL,
        answer_summary TEXT,
        score INTEGER DEFAULT 0,
        feedback TEXT,
        answered_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (interview_id) REFERENCES interviews(id)
    );

    CREATE TABLE IF NOT EXISTS performance_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        period TEXT NOT NULL,
        rating INTEGER DEFAULT 3,
        goals_met INTEGER DEFAULT 0,
        total_goals INTEGER DEFAULT 5,
        strengths TEXT,
        improvements TEXT,
        comments TEXT,
        status TEXT DEFAULT 'draft',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS performance_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL,
        goal TEXT NOT NULL,
        target TEXT,
        progress INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        due_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS training_courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        provider TEXT,
        duration_hours REAL DEFAULT 4,
        category TEXT DEFAULT 'general',
        mandatory INTEGER DEFAULT 0,
        status TEXT DEFAULT 'available'
    );

    CREATE TABLE IF NOT EXISTS employee_trainings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL,
        course_id INTEGER NOT NULL,
        enrollment_date TEXT DEFAULT (date('now')),
        completion_date TEXT,
        score REAL,
        certificate_ref TEXT,
        status TEXT DEFAULT 'enrolled',
        FOREIGN KEY (employee_id) REFERENCES employees(id),
        FOREIGN KEY (course_id) REFERENCES training_courses(id)
    );

    CREATE TABLE IF NOT EXISTS grievances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ref TEXT UNIQUE,
        employee_id TEXT NOT NULL,
        category TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT,
        severity TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'submitted',
        assigned_to TEXT,
        resolution TEXT,
        submitted_at TEXT DEFAULT (datetime('now')),
        resolved_at TEXT,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
    """)

    # Seed if empty
    if c.execute("SELECT COUNT(*) FROM employees").fetchone()[0] == 0:
        _seed_data(c)

    # Seed training courses
    if c.execute("SELECT COUNT(*) FROM training_courses").fetchone()[0] == 0:
        _seed_training_courses(c)

    conn.commit()
    conn.close()


def _seed_data(c):
    employees = [
        (
            "E001",
            "Ahmed Al-Rashidi",
            "أحمد الرشيدي",
            "Senior Software Engineer",
            "Information Technology",
            "ahmed.rashidi@mrna.sa",
            "+966501234567",
            "2020-03-15",
            "35",
            "5",
            "E003",
            "Saudi",
            12000,
            3000,
            1500,
            22,
            28,
            4,
            15,
            "1234",
        ),
        (
            "E002",
            "Fatima Al-Zahrani",
            "فاطمة الزهراني",
            "HR Manager",
            "Human Resources",
            "fatima.zahrani@mrna.sa",
            "+966502345678",
            "2018-01-10",
            "37",
            "6",
            "E005",
            "Saudi",
            18000,
            4500,
            2000,
            15,
            30,
            5,
            15,
            "2345",
        ),
        (
            "E003",
            "Mohammed Al-Otaibi",
            "محمد العتيبي",
            "IT Manager",
            "Information Technology",
            "mohammed.otaibi@mrna.sa",
            "+966503456789",
            "2017-06-01",
            "38",
            "6",
            "E005",
            "Saudi",
            22000,
            5500,
            2500,
            10,
            25,
            3,
            15,
            "3456",
        ),
        (
            "E004",
            "Sara Al-Ghamdi",
            "سارة الغامدي",
            "Financial Analyst",
            "Finance",
            "sara.ghamdi@mrna.sa",
            "+966504567890",
            "2021-09-01",
            "34",
            "4",
            "E003",
            "Saudi",
            10000,
            2500,
            1200,
            28,
            30,
            5,
            15,
            "4567",
        ),
        (
            "E005",
            "Khalid Al-Harbi",
            "خالد الحربي",
            "CHRO",
            "Executive",
            "khalid.harbi@mrna.sa",
            "+966505678901",
            "2015-01-15",
            "40",
            "7",
            None,
            "Saudi",
            35000,
            8750,
            3500,
            5,
            20,
            2,
            15,
            "5678",
        ),
        (
            "E006",
            "Nour Al-Shammari",
            "نور الشمري",
            "Recruitment Specialist",
            "Human Resources",
            "nour.shammari@mrna.sa",
            "+966506789012",
            "2022-03-20",
            "33",
            "4",
            "E002",
            "Saudi",
            8500,
            2125,
            1000,
            26,
            30,
            5,
            15,
            "6789",
        ),
        (
            "E007",
            "Rajesh Kumar",
            "راجيش كومار",
            "DevOps Engineer",
            "Information Technology",
            "rajesh.kumar@mrna.sa",
            "+966507890123",
            "2019-11-01",
            "35",
            "5",
            "E003",
            "Indian",
            11000,
            2750,
            1300,
            18,
            30,
            5,
            0,
            "7890",
        ),
    ]
    c.executemany(
        """INSERT INTO employees VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        employees,
    )

    # Seed loans
    c.execute(
        "INSERT INTO loans (ref, employee_id, loan_type, amount, remaining, monthly_installment, installments_left, status) VALUES (?,?,?,?,?,?,?,?)",
        ("LN-2026-001", "E001", "Interest-Free", 24000, 16000, 2000, 8, "active"),
    )
    c.execute(
        "INSERT INTO loans (ref, employee_id, loan_type, amount, remaining, monthly_installment, installments_left, status) VALUES (?,?,?,?,?,?,?,?)",
        ("LN-2026-002", "E004", "Advance Salary", 10000, 5000, 2500, 2, "active"),
    )

    # Seed announcements
    announcements = [
        (
            "Ramadan Working Hours",
            "During Ramadan, working hours will be 10 AM to 3 PM.",
            "HR Department",
            "important",
            45,
            60,
        ),
        (
            "Annual Performance Review",
            "2026 review cycle begins March 1st. Managers prepare KPI evaluations.",
            "Khalid Al-Harbi",
            "urgent",
            12,
            60,
        ),
        (
            "New Parking Policy",
            "Register vehicles through portal by March 15. Unregistered vehicles not allowed.",
            "Operations",
            "normal",
            30,
            60,
        ),
    ]
    c.executemany(
        "INSERT INTO announcements (title, content, author, priority, acknowledged_count, total_count) VALUES (?,?,?,?,?,?)",
        announcements,
    )

    # Seed pending leave requests
    leaves = [
        (
            "LR-2026-001",
            "E001",
            "annual",
            "2026-03-10",
            "2026-03-14",
            5,
            "Family vacation",
            "pending",
            "E003",
        ),
        (
            "LR-2026-002",
            "E004",
            "sick",
            "2026-02-25",
            "2026-02-26",
            2,
            "Medical appointment",
            "pending",
            "E003",
        ),
        (
            "LR-2026-003",
            "E006",
            "annual",
            "2026-03-20",
            "2026-03-25",
            6,
            "Wedding attendance",
            "pending",
            "E002",
        ),
        (
            "LR-2026-004",
            "E007",
            "annual",
            "2026-04-01",
            "2026-04-15",
            15,
            "Annual home visit",
            "pending",
            "E003",
        ),
    ]
    c.executemany(
        "INSERT INTO leave_requests (ref, employee_id, leave_type, start_date, end_date, days, reason, status, approver_id) VALUES (?,?,?,?,?,?,?,?,?)",
        leaves,
    )

    # Seed document requests
    c.execute(
        "INSERT INTO document_requests (ref, employee_id, document_type, status, estimated_date) VALUES (?,?,?,?,?)",
        ("DOC-2026-001", "E001", "Salary Certificate", "ready", "2026-02-22"),
    )
    c.execute(
        "INSERT INTO document_requests (ref, employee_id, document_type, status, estimated_date) VALUES (?,?,?,?,?)",
        ("DOC-2026-002", "E004", "Experience Certificate", "processing", "2026-02-27"),
    )


# ── Query Functions ─────────────────────────────────────


def get_employee(emp_id: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM employees WHERE id = ?", (emp_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
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


def submit_leave_request(
    emp_id: str, leave_type: str, start_date: str, end_date: str, days: int, reason: str
) -> dict:
    conn = get_db()
    emp = get_employee(emp_id)
    approver = emp.get("manager_id") if emp else None

    # Generate ref
    count = conn.execute("SELECT COUNT(*) FROM leave_requests").fetchone()[0]
    ref = f"LR-2026-{count + 1:03d}"

    conn.execute(
        "INSERT INTO leave_requests (ref, employee_id, leave_type, start_date, end_date, days, reason, status, approver_id) VALUES (?,?,?,?,?,?,?,?,?)",
        (
            ref,
            emp_id,
            leave_type,
            start_date,
            end_date,
            days,
            reason,
            "pending",
            approver,
        ),
    )
    # Deduct from balance
    col = f"{leave_type}_leave"
    conn.execute(f"UPDATE employees SET {col} = {col} - ? WHERE id = ?", (days, emp_id))
    conn.commit()

    row = conn.execute("SELECT * FROM leave_requests WHERE ref = ?", (ref,)).fetchone()
    conn.close()
    return dict(row)


def get_leave_requests(emp_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY created_at DESC",
        (emp_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_pending_approvals(manager_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT lr.*, e.name as employee_name FROM leave_requests lr JOIN employees e ON lr.employee_id = e.id WHERE lr.approver_id = ? AND lr.status = 'pending' ORDER BY lr.created_at DESC",
        (manager_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def approve_leave_request(ref: str, decision: str) -> dict | None:
    conn = get_db()
    conn.execute(
        "UPDATE leave_requests SET status = ?, updated_at = datetime('now') WHERE ref = ?",
        (decision, ref),
    )
    conn.commit()
    row = conn.execute(
        "SELECT lr.*, e.name as employee_name FROM leave_requests lr JOIN employees e ON lr.employee_id = e.id WHERE lr.ref = ?",
        (ref,),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


# ── Document CRUD ───────────────────────────────────────


def create_document_request(emp_id: str, doc_type: str) -> dict:
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM document_requests").fetchone()[0]
    ref = f"DOC-2026-{count + 1:03d}"
    est = str(date.today() + timedelta(days=2))
    conn.execute(
        "INSERT INTO document_requests (ref, employee_id, document_type, status, estimated_date) VALUES (?,?,?,?,?)",
        (ref, emp_id, doc_type, "requested", est),
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM document_requests WHERE ref = ?", (ref,)
    ).fetchone()
    conn.close()
    return dict(row)


def get_document_requests(emp_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM document_requests WHERE employee_id = ? ORDER BY created_at DESC",
        (emp_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Loan CRUD ───────────────────────────────────────────


def get_employee_loans(emp_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM loans WHERE employee_id = ? AND status IN ('active', 'pending') ORDER BY created_at DESC",
        (emp_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def check_loan_eligibility(emp_id: str) -> dict:
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
        return {
            "eligible": False,
            "reason": f"EMI cap reached ({existing_emi:,.0f}/{max_emi:,.0f} SAR)",
        }
    return {
        "eligible": True,
        "max_amount": int(min(basic * 2, available * 12)),
        "max_emi": int(available),
        "service_years": round(years, 1),
    }


def create_loan(emp_id: str, loan_type: str, amount: float, months: int) -> dict:
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM loans").fetchone()[0]
    ref = f"LN-2026-{count + 1:03d}"
    monthly = round(amount / months, 2)
    conn.execute(
        "INSERT INTO loans (ref, employee_id, loan_type, amount, remaining, monthly_installment, installments_left, status) VALUES (?,?,?,?,?,?,?,?)",
        (ref, emp_id, loan_type, amount, amount, monthly, months, "pending"),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM loans WHERE ref = ?", (ref,)).fetchone()
    conn.close()
    return dict(row)


# ── Travel CRUD ─────────────────────────────────────────

PER_DIEM = {
    "chairman": {"intl": 3500, "local": 2000},
    "c_level": {"intl": 1750, "local": 1200},
    "other": {"intl": 1350, "local": 900},
}


def get_per_diem(grade: str, international: bool = False) -> int:
    g = int(grade) if grade.isdigit() else 34
    tier = "chairman" if g >= 40 else "c_level" if g >= 38 else "other"
    return PER_DIEM[tier]["intl" if international else "local"]


def create_travel_request(
    emp_id: str,
    destination: str,
    start_date: str,
    end_date: str,
    days: int,
    travel_type: str = "business",
) -> dict:
    conn = get_db()
    emp = get_employee(emp_id)
    per_diem = get_per_diem(emp.get("grade", "34")) if emp else 900
    total = per_diem * min(days, 5)
    count = conn.execute("SELECT COUNT(*) FROM travel_requests").fetchone()[0]
    ref = f"TR-2026-{count + 1:03d}"
    conn.execute(
        "INSERT INTO travel_requests (ref, employee_id, destination, travel_type, start_date, end_date, days, per_diem, total_allowance, status) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (
            ref,
            emp_id,
            destination,
            travel_type,
            start_date,
            end_date,
            days,
            per_diem,
            total,
            "pending",
        ),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM travel_requests WHERE ref = ?", (ref,)).fetchone()
    conn.close()
    return dict(row)


# ── Announcements ───────────────────────────────────────


def get_announcements(limit: int = 5) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM announcements ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Team Attendance (simulated) ─────────────────────────


def get_team_attendance(manager_id: str) -> list[dict]:
    import random

    conn = get_db()
    rows = conn.execute(
        "SELECT id, name FROM employees WHERE manager_id = ?", (manager_id,)
    ).fetchall()
    conn.close()
    statuses = ["present", "present", "present", "remote", "late", "absent", "on_leave"]
    result = []
    for r in rows:
        status = random.choice(statuses)
        ci = (
            f"0{random.randint(7, 9)}:{random.randint(0, 59):02d}"
            if status in ("present", "late", "remote")
            else None
        )
        co = (
            f"{random.randint(16, 18)}:{random.randint(0, 59):02d}"
            if status == "present"
            else None
        )
        result.append(
            {"name": r["name"], "status": status, "checkIn": ci, "checkOut": co}
        )
    return result


# ── Authentication ──────────────────────────────────────


def authenticate(employee_id: str, pin: str) -> dict | None:
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM employees WHERE id = ? AND pin = ?", (employee_id, pin)
    ).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    return {
        "id": d["id"],
        "name": d["name"],
        "name_ar": d["name_ar"],
        "position": d["position"],
        "department": d["department"],
        "manager_id": d["manager_id"],
    }


def get_all_employees_summary() -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT id, name, position, department FROM employees ORDER BY id"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_direct_reports(manager_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT id, name, name_ar, position, department FROM employees WHERE manager_id = ?",
        (manager_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def is_manager(employee_id: str) -> bool:
    conn = get_db()
    row = conn.execute(
        "SELECT COUNT(*) as count FROM employees WHERE manager_id = ?",
        (employee_id,),
    ).fetchone()
    conn.close()
    return row["count"] > 0 if row else False


def get_department_stats(manager_id: str) -> dict:
    conn = get_db()
    headcount = conn.execute(
        "SELECT COUNT(*) as count FROM employees WHERE manager_id = ?",
        (manager_id,),
    ).fetchone()["count"]

    today = date.today().isoformat()
    on_leave = conn.execute(
        """SELECT COUNT(DISTINCT employee_id) as count FROM leave_requests 
           WHERE approver_id = ? AND status = 'approved' 
           AND start_date <= ? AND end_date >= ?""",
        (manager_id, today, today),
    ).fetchone()["count"]

    pending_approvals = conn.execute(
        "SELECT COUNT(*) as count FROM leave_requests WHERE approver_id = ? AND status = 'pending'",
        (manager_id,),
    ).fetchone()["count"]

    att = get_team_attendance(manager_id)
    present_count = sum(1 for a in att if a["status"] in ("present", "remote"))
    avg_attendance = round((present_count / headcount * 100) if headcount > 0 else 0)

    conn.close()
    return {
        "headcount": headcount,
        "on_leave": on_leave,
        "pending_approvals": pending_approvals,
        "avg_attendance": avg_attendance,
    }



# -- Attendance CRUD -------------------------------------

def clock_in(emp_id: str, location: str = "office") -> dict:
    """Clock in for today. Returns attendance record."""
    conn = get_db()
    today = str(date.today())
    now = datetime.now().strftime("%H:%M")
    
    existing = conn.execute(
        "SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?",
        (emp_id, today)
    ).fetchone()
    
    if existing and existing["clock_in"]:
        conn.close()
        return {"error": f"Already clocked in at {existing['clock_in']}", "record": dict(existing)}
    
    # Determine if late (after 08:30)
    hour, minute = map(int, now.split(":"))
    status = "late" if (hour > 8 or (hour == 8 and minute > 30)) else "present"
    
    if existing:
        conn.execute(
            "UPDATE attendance_records SET clock_in = ?, status = ?, location = ? WHERE employee_id = ? AND date = ?",
            (now, status, location, emp_id, today)
        )
    else:
        conn.execute(
            "INSERT INTO attendance_records (employee_id, date, clock_in, status, location) VALUES (?,?,?,?,?)",
            (emp_id, today, now, status, location)
        )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?",
        (emp_id, today)
    ).fetchone()
    conn.close()
    return dict(row)


def clock_out(emp_id: str) -> dict:
    """Clock out for today. Calculates hours worked."""
    conn = get_db()
    today = str(date.today())
    now = datetime.now().strftime("%H:%M")
    
    existing = conn.execute(
        "SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?",
        (emp_id, today)
    ).fetchone()
    
    if not existing or not existing["clock_in"]:
        conn.close()
        return {"error": "Not clocked in today"}
    
    if existing["clock_out"]:
        conn.close()
        return {"error": f"Already clocked out at {existing['clock_out']}", "record": dict(existing)}
    
    # Calculate hours
    ci_h, ci_m = map(int, existing["clock_in"].split(":"))
    co_h, co_m = map(int, now.split(":"))
    hours = round((co_h * 60 + co_m - ci_h * 60 - ci_m) / 60, 2)
    overtime = max(0, round(hours - 8, 2))
    
    conn.execute(
        "UPDATE attendance_records SET clock_out = ?, hours_worked = ?, overtime_hours = ? WHERE employee_id = ? AND date = ?",
        (now, hours, overtime, emp_id, today)
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?",
        (emp_id, today)
    ).fetchone()
    conn.close()
    return dict(row)


def get_my_attendance(emp_id: str, days: int = 7) -> list[dict]:
    """Get attendance records for last N days."""
    conn = get_db()
    since = str(date.today() - timedelta(days=days))
    rows = conn.execute(
        "SELECT * FROM attendance_records WHERE employee_id = ? AND date >= ? ORDER BY date DESC",
        (emp_id, since)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_today_attendance(emp_id: str) -> dict | None:
    """Get today's attendance record."""
    conn = get_db()
    today = str(date.today())
    row = conn.execute(
        "SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?",
        (emp_id, today)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def request_overtime(emp_id: str, hours: float, reason: str) -> dict:
    """Request overtime approval for today."""
    conn = get_db()
    today = str(date.today())
    conn.execute(
        "UPDATE attendance_records SET overtime_hours = ?, overtime_status = 'pending', notes = ? WHERE employee_id = ? AND date = ?",
        (hours, reason, emp_id, today)
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?",
        (emp_id, today)
    ).fetchone()
    conn.close()
    return dict(row) if row else {"error": "No attendance record for today"}


# -- Interview CRUD --------------------------------------

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


def start_interview(interviewer_id: str, candidate_name: str, position: str, stage: str = "hr_screening") -> dict:
    """Create a new interview session."""
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM interviews").fetchone()[0]
    ref = f"INT-2026-{count + 1:03d}"
    questions = QUESTION_BANK.get(stage, QUESTION_BANK["hr_screening"])
    
    conn.execute(
        "INSERT INTO interviews (ref, candidate_name, position, interviewer_id, stage, total_questions) VALUES (?,?,?,?,?,?)",
        (ref, candidate_name, position, interviewer_id, stage, len(questions))
    )
    conn.commit()
    row = conn.execute("SELECT * FROM interviews WHERE ref = ?", (ref,)).fetchone()
    conn.close()
    return dict(row)


def get_current_interview(interviewer_id: str) -> dict | None:
    """Get the active interview for this interviewer."""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM interviews WHERE interviewer_id = ? AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1",
        (interviewer_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def get_interview_question(interview_id: int, question_number: int) -> dict | None:
    """Get a specific question from the bank."""
    conn = get_db()
    interview = conn.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,)).fetchone()
    conn.close()
    if not interview:
        return None
    stage = interview["stage"]
    questions = QUESTION_BANK.get(stage, QUESTION_BANK["hr_screening"])
    if question_number < 0 or question_number >= len(questions):
        return None
    q = questions[question_number]
    return {"question": q["q"], "type": q["type"], "time_minutes": q["time"], "number": question_number + 1, "total": len(questions)}


def score_answer(interview_id: int, question_number: int, score: int, feedback: str = "") -> dict:
    """Score a candidate's answer (1-5)."""
    conn = get_db()
    interview = conn.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,)).fetchone()
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
    
    # Upsert response
    existing = conn.execute(
        "SELECT id FROM interview_responses WHERE interview_id = ? AND question_number = ?",
        (interview_id, question_number)
    ).fetchone()
    
    if existing:
        conn.execute(
            "UPDATE interview_responses SET score = ?, feedback = ?, answered_at = datetime('now') WHERE id = ?",
            (score, feedback, existing["id"])
        )
    else:
        conn.execute(
            "INSERT INTO interview_responses (interview_id, question_number, question_text, question_type, score, feedback) VALUES (?,?,?,?,?,?)",
            (interview_id, question_number, q["q"], q["type"], score, feedback)
        )
    
    # Update current question pointer
    next_q = question_number + 1
    conn.execute("UPDATE interviews SET current_question = ? WHERE id = ?", (next_q, interview_id))
    conn.commit()
    
    row = conn.execute("SELECT * FROM interview_responses WHERE interview_id = ? AND question_number = ?",
                       (interview_id, question_number)).fetchone()
    conn.close()
    return dict(row)


def complete_interview(interview_id: int) -> dict:
    """Complete the interview and calculate final score."""
    conn = get_db()
    responses = conn.execute(
        "SELECT score FROM interview_responses WHERE interview_id = ?", (interview_id,)
    ).fetchall()
    
    if not responses:
        conn.close()
        return {"error": "No responses recorded"}
    
    avg = round(sum(r["score"] for r in responses) / len(responses), 1)
    conn.execute(
        "UPDATE interviews SET status = 'completed', completed_at = datetime('now'), average_score = ? WHERE id = ?",
        (avg, interview_id)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,)).fetchone()
    conn.close()
    return dict(row)


def get_interview_responses(interview_id: int) -> list[dict]:
    """Get all responses for an interview."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM interview_responses WHERE interview_id = ? ORDER BY question_number",
        (interview_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]



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
        c.execute("INSERT INTO training_courses (title, description, provider, duration_hours, category, mandatory) VALUES (?,?,?,?,?,?)",
                  (title, desc, provider, hours, cat, mandatory))


# -- Performance Review CRUD -----------------------------

def create_review(reviewer_id: str, employee_id: str, period: str, rating: int, strengths: str, improvements: str, comments: str = "") -> dict:
    conn = get_db()
    rating = max(1, min(5, rating))
    goals = conn.execute("SELECT COUNT(*) as total, SUM(CASE WHEN progress >= 100 THEN 1 ELSE 0 END) as met FROM performance_goals WHERE employee_id = ?", (employee_id,)).fetchone()
    conn.execute(
        "INSERT INTO performance_reviews (employee_id, reviewer_id, period, rating, goals_met, total_goals, strengths, improvements, comments, status) VALUES (?,?,?,?,?,?,?,?,?,'completed')",
        (employee_id, reviewer_id, period, rating, goals["met"] or 0, goals["total"] or 0, strengths, improvements, comments)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM performance_reviews WHERE employee_id = ? ORDER BY created_at DESC LIMIT 1", (employee_id,)).fetchone()
    conn.close()
    return dict(row)


def get_employee_reviews(emp_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute("SELECT pr.*, e.name as reviewer_name FROM performance_reviews pr LEFT JOIN employees e ON pr.reviewer_id = e.id WHERE pr.employee_id = ? ORDER BY created_at DESC", (emp_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_pending_reviews(reviewer_id: str) -> list[dict]:
    conn = get_db()
    reports = get_direct_reports(reviewer_id)
    report_ids = [r["id"] for r in reports]
    if not report_ids:
        conn.close()
        return []
    reviewed = conn.execute("SELECT employee_id FROM performance_reviews WHERE reviewer_id = ? AND period = ?", (reviewer_id, "Q1 2026")).fetchall()
    reviewed_ids = {r["employee_id"] for r in reviewed}
    pending = [r for r in reports if r["id"] not in reviewed_ids]
    conn.close()
    return pending


def set_goal(emp_id: str, goal: str, target: str, due_date: str) -> dict:
    conn = get_db()
    conn.execute("INSERT INTO performance_goals (employee_id, goal, target, due_date) VALUES (?,?,?,?)", (emp_id, goal, target, due_date))
    conn.commit()
    row = conn.execute("SELECT * FROM performance_goals WHERE employee_id = ? ORDER BY id DESC LIMIT 1", (emp_id,)).fetchone()
    conn.close()
    return dict(row)


def get_goals(emp_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute("SELECT * FROM performance_goals WHERE employee_id = ? ORDER BY due_date", (emp_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_goal_progress(goal_id: int, progress: int) -> dict:
    conn = get_db()
    progress = max(0, min(100, progress))
    status = "completed" if progress >= 100 else "active"
    conn.execute("UPDATE performance_goals SET progress = ?, status = ? WHERE id = ?", (progress, status, goal_id))
    conn.commit()
    row = conn.execute("SELECT * FROM performance_goals WHERE id = ?", (goal_id,)).fetchone()
    conn.close()
    return dict(row) if row else {"error": "Goal not found"}


# -- Training CRUD ---------------------------------------

def get_available_courses() -> list[dict]:
    conn = get_db()
    rows = conn.execute("SELECT * FROM training_courses WHERE status = 'available' ORDER BY mandatory DESC, title").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def enroll_in_course(emp_id: str, course_id: int) -> dict:
    conn = get_db()
    existing = conn.execute("SELECT * FROM employee_trainings WHERE employee_id = ? AND course_id = ? AND status != 'dropped'", (emp_id, course_id)).fetchone()
    if existing:
        conn.close()
        return {"error": "Already enrolled", "record": dict(existing)}
    conn.execute("INSERT INTO employee_trainings (employee_id, course_id) VALUES (?,?)", (emp_id, course_id))
    conn.commit()
    row = conn.execute("SELECT et.*, tc.title, tc.duration_hours, tc.category FROM employee_trainings et JOIN training_courses tc ON et.course_id = tc.id WHERE et.employee_id = ? AND et.course_id = ?", (emp_id, course_id)).fetchone()
    conn.close()
    return dict(row)


def get_my_trainings(emp_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute("SELECT et.*, tc.title, tc.duration_hours, tc.category, tc.mandatory FROM employee_trainings et JOIN training_courses tc ON et.course_id = tc.id WHERE et.employee_id = ? ORDER BY et.enrollment_date DESC", (emp_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def complete_training(emp_id: str, course_id: int, score: float) -> dict:
    conn = get_db()
    cert_ref = f"CERT-{emp_id}-{course_id}-2026"
    conn.execute("UPDATE employee_trainings SET status = 'completed', completion_date = date('now'), score = ?, certificate_ref = ? WHERE employee_id = ? AND course_id = ?", (score, cert_ref, emp_id, course_id))
    conn.commit()
    row = conn.execute("SELECT et.*, tc.title FROM employee_trainings et JOIN training_courses tc ON et.course_id = tc.id WHERE et.employee_id = ? AND et.course_id = ?", (emp_id, course_id)).fetchone()
    conn.close()
    return dict(row) if row else {"error": "Enrollment not found"}


def get_training_stats(emp_id: str) -> dict:
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM employee_trainings WHERE employee_id = ?", (emp_id,)).fetchone()[0]
    completed = conn.execute("SELECT COUNT(*) FROM employee_trainings WHERE employee_id = ? AND status = 'completed'", (emp_id,)).fetchone()[0]
    mandatory_total = conn.execute("SELECT COUNT(*) FROM training_courses WHERE mandatory = 1").fetchone()[0]
    mandatory_done = conn.execute("SELECT COUNT(*) FROM employee_trainings et JOIN training_courses tc ON et.course_id = tc.id WHERE et.employee_id = ? AND tc.mandatory = 1 AND et.status = 'completed'", (emp_id,)).fetchone()[0]
    conn.close()
    return {"total_enrolled": total, "completed": completed, "mandatory_total": mandatory_total, "mandatory_completed": mandatory_done, "compliance": round((mandatory_done / mandatory_total * 100) if mandatory_total > 0 else 100)}


# -- Grievance CRUD --------------------------------------

def submit_grievance(emp_id: str, category: str, subject: str, description: str, severity: str = "medium") -> dict:
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM grievances").fetchone()[0]
    ref = f"GRV-2026-{count + 1:03d}"
    conn.execute("INSERT INTO grievances (ref, employee_id, category, subject, description, severity) VALUES (?,?,?,?,?,?)", (ref, emp_id, category, subject, description, severity))
    conn.commit()
    row = conn.execute("SELECT * FROM grievances WHERE ref = ?", (ref,)).fetchone()
    conn.close()
    return dict(row)


def get_my_grievances(emp_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute("SELECT * FROM grievances WHERE employee_id = ? ORDER BY submitted_at DESC", (emp_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_grievances() -> list[dict]:
    conn = get_db()
    rows = conn.execute("SELECT g.*, e.name as employee_name FROM grievances g JOIN employees e ON g.employee_id = e.id ORDER BY submitted_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_grievance_status(ref: str, status: str, resolution: str = "") -> dict:
    conn = get_db()
    updates = "status = ?"
    params = [status]
    if status in ("resolved", "closed"):
        updates += ", resolved_at = datetime('now'), resolution = ?"
        params.append(resolution)
    params.append(ref)
    conn.execute(f"UPDATE grievances SET {updates} WHERE ref = ?", params)
    conn.commit()
    row = conn.execute("SELECT * FROM grievances WHERE ref = ?", (ref,)).fetchone()
    conn.close()
    return dict(row) if row else {"error": "Not found"}


# -- Notifications CRUD ----------------------------------

def create_notification(emp_id: str, ntype: str, title: str, message: str) -> dict:
    conn = get_db()
    conn.execute("INSERT INTO notifications (employee_id, type, title, message) VALUES (?,?,?,?)", (emp_id, ntype, title, message))
    conn.commit()
    conn.close()
    return {"ok": True}


def get_unread_notifications(emp_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute("SELECT * FROM notifications WHERE employee_id = ? AND read = 0 ORDER BY created_at DESC", (emp_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_notifications(emp_id: str, limit: int = 20) -> list[dict]:
    conn = get_db()
    rows = conn.execute("SELECT * FROM notifications WHERE employee_id = ? ORDER BY created_at DESC LIMIT ?", (emp_id, limit)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def mark_notification_read(notif_id: int) -> dict:
    conn = get_db()
    conn.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notif_id,))
    conn.commit()
    conn.close()
    return {"ok": True}




# -- Manager: Loan Approvals -----------------------------

def get_pending_loan_requests(manager_id: str) -> list[dict]:
    """Get pending loan requests from direct reports."""
    conn = get_db()
    rows = conn.execute(
        """SELECT l.*, e.name as employee_name, e.position, e.department, e.basic_salary
           FROM loans l JOIN employees e ON l.employee_id = e.id 
           WHERE e.manager_id = ? AND l.status = 'pending'
           ORDER BY l.created_at DESC""",
        (manager_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def approve_loan(ref: str, decision: str, notes: str = "") -> dict | None:
    """Approve or reject a loan. decision: 'approved' or 'rejected'."""
    conn = get_db()
    conn.execute(
        "UPDATE loans SET status = ? WHERE ref = ? AND status = 'pending'",
        (decision, ref)
    )
    conn.commit()
    row = conn.execute(
        "SELECT l.*, e.name as employee_name FROM loans l JOIN employees e ON l.employee_id = e.id WHERE l.ref = ?",
        (ref,)
    ).fetchone()
    conn.close()
    if row:
        d = dict(row)
        # Notify employee
        create_notification(d["employee_id"], "loan", 
            f"Loan {decision.title()}", 
            f"Your loan request {ref} for {d['amount']:,.0f} SAR has been {decision}.")
        return d
    return None


# -- Manager: Travel Approvals ---------------------------

def get_pending_travel_requests(manager_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        """SELECT t.*, e.name as employee_name, e.position, e.department
           FROM travel_requests t JOIN employees e ON t.employee_id = e.id
           WHERE e.manager_id = ? AND t.status = 'pending'
           ORDER BY t.created_at DESC""",
        (manager_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def approve_travel(ref: str, decision: str) -> dict | None:
    conn = get_db()
    conn.execute("UPDATE travel_requests SET status = ? WHERE ref = ? AND status = 'pending'", (decision, ref))
    conn.commit()
    row = conn.execute(
        "SELECT t.*, e.name as employee_name FROM travel_requests t JOIN employees e ON t.employee_id = e.id WHERE t.ref = ?",
        (ref,)
    ).fetchone()
    conn.close()
    if row:
        d = dict(row)
        create_notification(d["employee_id"], "travel",
            f"Travel {decision.title()}",
            f"Your travel request {ref} to {d['destination']} has been {decision}.")
        return d
    return None


# -- Manager: Overtime Approvals -------------------------

def get_pending_overtime_requests(manager_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        """SELECT a.*, e.name as employee_name, e.position
           FROM attendance_records a JOIN employees e ON a.employee_id = e.id
           WHERE e.manager_id = ? AND a.overtime_status = 'pending'
           ORDER BY a.date DESC""",
        (manager_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def approve_overtime(record_id: int, decision: str) -> dict | None:
    conn = get_db()
    conn.execute("UPDATE attendance_records SET overtime_status = ? WHERE id = ?", (decision, record_id))
    conn.commit()
    row = conn.execute(
        "SELECT a.*, e.name as employee_name FROM attendance_records a JOIN employees e ON a.employee_id = e.id WHERE a.id = ?",
        (record_id,)
    ).fetchone()
    conn.close()
    if row:
        d = dict(row)
        create_notification(d["employee_id"], "attendance",
            f"Overtime {decision.title()}",
            f"Your overtime request for {d['overtime_hours']}h on {d['date']} has been {decision}.")
        return d
    return None


# -- Manager: Document Approvals -------------------------

def get_pending_document_requests(manager_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        """SELECT d.*, e.name as employee_name, e.position
           FROM document_requests d JOIN employees e ON d.employee_id = e.id
           WHERE e.manager_id = ? AND d.status IN ('requested', 'processing')
           ORDER BY d.created_at DESC""",
        (manager_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def approve_document(ref: str, decision: str) -> dict | None:
    """decision: 'ready' (approved) or 'rejected'."""
    conn = get_db()
    conn.execute("UPDATE document_requests SET status = ? WHERE ref = ?", (decision, ref))
    conn.commit()
    row = conn.execute(
        "SELECT d.*, e.name as employee_name FROM document_requests d JOIN employees e ON d.employee_id = e.id WHERE d.ref = ?",
        (ref,)
    ).fetchone()
    conn.close()
    if row:
        d = dict(row)
        create_notification(d["employee_id"], "document",
            f"Document {decision.title()}",
            f"Your {d['document_type']} request ({ref}) status: {decision}.")
        return d
    return None


# -- Manager: Grievance Management -----------------------

def get_department_grievances(manager_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        """SELECT g.*, e.name as employee_name, e.position
           FROM grievances g JOIN employees e ON g.employee_id = e.id
           WHERE e.manager_id = ? OR g.assigned_to = ?
           ORDER BY g.submitted_at DESC""",
        (manager_id, manager_id)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def assign_grievance(ref: str, assigned_to: str) -> dict | None:
    conn = get_db()
    conn.execute("UPDATE grievances SET assigned_to = ?, status = 'investigating' WHERE ref = ?", (assigned_to, ref))
    conn.commit()
    row = conn.execute("SELECT * FROM grievances WHERE ref = ?", (ref,)).fetchone()
    conn.close()
    return dict(row) if row else None


def resolve_grievance(ref: str, resolution: str) -> dict | None:
    return update_grievance_status(ref, "resolved", resolution)


# -- Manager: Team Analytics ----------------------------

def get_team_performance_summary(manager_id: str) -> list[dict]:
    """Get performance overview for all direct reports."""
    conn = get_db()
    reports = get_direct_reports(manager_id)
    result = []
    for emp in reports:
        eid = emp["id"]
        # Latest review
        review = conn.execute("SELECT rating, period FROM performance_reviews WHERE employee_id = ? ORDER BY created_at DESC LIMIT 1", (eid,)).fetchone()
        # Goals
        goals = conn.execute("SELECT COUNT(*) as total, SUM(CASE WHEN progress >= 100 THEN 1 ELSE 0 END) as completed FROM performance_goals WHERE employee_id = ?", (eid,)).fetchone()
        # Training
        training = conn.execute("SELECT COUNT(*) as enrolled, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed FROM employee_trainings WHERE employee_id = ?", (eid,)).fetchone()
        # Attendance this month
        from datetime import date
        month_start = date.today().replace(day=1).isoformat()
        att = conn.execute("SELECT COUNT(*) as days, SUM(CASE WHEN status IN ('present','remote') THEN 1 ELSE 0 END) as present FROM attendance_records WHERE employee_id = ? AND date >= ?", (eid, month_start)).fetchone()
        
        result.append({
            "employee_id": eid,
            "name": emp["name"],
            "position": emp["position"],
            "latest_rating": review["rating"] if review else None,
            "review_period": review["period"] if review else None,
            "goals_total": goals["total"] or 0,
            "goals_completed": goals["completed"] or 0,
            "trainings_enrolled": training["enrolled"] or 0,
            "trainings_completed": training["completed"] or 0,
            "attendance_days": att["days"] or 0,
            "attendance_present": att["present"] or 0,
        })
    conn.close()
    return result


def get_all_pending_for_manager(manager_id: str) -> dict:
    """Get ALL pending items across all categories for a manager."""
    return {
        "leave_requests": get_pending_approvals(manager_id),
        "loan_requests": get_pending_loan_requests(manager_id),
        "travel_requests": get_pending_travel_requests(manager_id),
        "overtime_requests": get_pending_overtime_requests(manager_id),
        "document_requests": get_pending_document_requests(manager_id),
        "grievances": get_department_grievances(manager_id),
        "pending_reviews": get_pending_reviews(manager_id),
    }


def get_team_training_compliance(manager_id: str) -> list[dict]:
    """Get training compliance for all direct reports."""
    reports = get_direct_reports(manager_id)
    result = []
    for emp in reports:
        stats = get_training_stats(emp["id"])
        result.append({
            "employee_id": emp["id"],
            "name": emp["name"],
            "position": emp["position"],
            **stats,
        })
    return result


def reassign_employee(emp_id: str, new_manager_id: str) -> dict:
    """Reassign an employee to a new manager."""
    conn = get_db()
    conn.execute("UPDATE employees SET manager_id = ? WHERE id = ?", (new_manager_id, emp_id))
    conn.commit()
    row = conn.execute("SELECT id, name, position, department, manager_id FROM employees WHERE id = ?", (emp_id,)).fetchone()
    conn.close()
    if row:
        d = dict(row)
        mgr = get_employee(new_manager_id)
        create_notification(emp_id, "hr",
            "Manager Reassignment",
            f"You have been reassigned to {mgr['name'] if mgr else new_manager_id}.")
        return d
    return {"error": "Employee not found"}


def get_headcount_by_department() -> list[dict]:
    """Get headcount breakdown by department."""
    conn = get_db()
    rows = conn.execute(
        "SELECT department, COUNT(*) as count FROM employees GROUP BY department ORDER BY count DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_leave_analytics(manager_id: str) -> dict:
    """Get leave analytics for manager's team."""
    conn = get_db()
    reports = get_direct_reports(manager_id)
    report_ids = [r["id"] for r in reports]
    if not report_ids:
        conn.close()
        return {"total_requests": 0, "by_type": {}, "by_status": {}}
    
    placeholders = ",".join("?" * len(report_ids))
    rows = conn.execute(f"SELECT leave_type, status, COUNT(*) as cnt FROM leave_requests WHERE employee_id IN ({placeholders}) GROUP BY leave_type, status", report_ids).fetchall()
    
    by_type = {}
    by_status = {}
    total = 0
    for r in rows:
        by_type[r["leave_type"]] = by_type.get(r["leave_type"], 0) + r["cnt"]
        by_status[r["status"]] = by_status.get(r["status"], 0) + r["cnt"]
        total += r["cnt"]
    
    conn.close()
    return {"total_requests": total, "by_type": by_type, "by_status": by_status}


def get_employee_all_requests(emp_id: str) -> dict:
    """Get ALL requests for an employee across all categories."""
    return {
        "leave_requests": get_leave_requests(emp_id),
        "loans": get_employee_loans(emp_id),
        "documents": get_document_requests(emp_id),
        "travel": get_travel_requests(emp_id),
        "grievances": get_my_grievances(emp_id),
    }


def get_travel_requests(emp_id: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM travel_requests WHERE employee_id = ? ORDER BY created_at DESC",
        (emp_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# Auto-init on import
init_db()
