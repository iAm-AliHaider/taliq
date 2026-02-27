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
    """)

    # Seed if empty
    if c.execute("SELECT COUNT(*) FROM employees").fetchone()[0] == 0:
        _seed_data(c)

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
        "INSERT INTO loans (ref, employee_id, loan_type, amount, remaining, monthly_installment, installments_left) VALUES (?,?,?,?,?,?,?)",
        ("LN-2026-001", "E001", "Interest-Free", 24000, 16000, 2000, 8),
    )
    c.execute(
        "INSERT INTO loans (ref, employee_id, loan_type, amount, remaining, monthly_installment, installments_left) VALUES (?,?,?,?,?,?,?)",
        ("LN-2026-002", "E004", "Advance Salary", 10000, 5000, 2500, 2),
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
        "SELECT * FROM loans WHERE employee_id = ? AND status = 'active' ORDER BY created_at DESC",
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
        "INSERT INTO loans (ref, employee_id, loan_type, amount, remaining, monthly_installment, installments_left) VALUES (?,?,?,?,?,?,?)",
        (ref, emp_id, loan_type, amount, amount, monthly, months),
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


# Auto-init on import
init_db()
