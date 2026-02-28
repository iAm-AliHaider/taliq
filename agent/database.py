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



    c.execute("""
    CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE NOT NULL,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        category TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'SAR',
        receipt_ref TEXT,
        expense_date TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        approver_id TEXT,
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS claims (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE NOT NULL,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        claim_type TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        supporting_doc TEXT,
        status TEXT DEFAULT 'pending',
        approver_id TEXT,
        approved_amount REAL,
        payment_ref TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE NOT NULL,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        payment_type TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'SAR',
        status TEXT DEFAULT 'pending',
        payment_method TEXT DEFAULT 'bank_transfer',
        payment_date TEXT,
        reference_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        category TEXT UNIQUE NOT NULL,
        config JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW(),
        updated_by TEXT
    )""")

    conn.commit()

    # --- Letter Generation ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS letters (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE NOT NULL,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        letter_type TEXT NOT NULL,
        purpose TEXT,
        language TEXT DEFAULT 'en',
        addressed_to TEXT,
        content_data JSONB DEFAULT '{}',
        status TEXT DEFAULT 'pending',
        issued_by TEXT,
        issued_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    # --- Contract Management ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        contract_type TEXT NOT NULL DEFAULT 'unlimited',
        start_date TEXT NOT NULL,
        end_date TEXT,
        probation_end TEXT,
        renewal_date TEXT,
        salary REAL,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    # --- Asset Tracking ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE NOT NULL,
        asset_type TEXT NOT NULL,
        name TEXT NOT NULL,
        serial_number TEXT,
        assigned_to TEXT REFERENCES employees(id),
        assigned_date TEXT,
        condition TEXT DEFAULT 'good',
        status TEXT DEFAULT 'available',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    # --- Shift Scheduling ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS shifts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        break_minutes INTEGER DEFAULT 60,
        is_night_shift INTEGER DEFAULT 0,
        differential_pct REAL DEFAULT 0,
        status TEXT DEFAULT 'active'
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS employee_shifts (
        id SERIAL PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        shift_id INTEGER NOT NULL REFERENCES shifts(id),
        effective_date TEXT NOT NULL,
        end_date TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    # --- Iqama / Visa Tracking ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS iqama_visa (
        id SERIAL PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        document_type TEXT NOT NULL,
        document_number TEXT,
        issue_date TEXT,
        expiry_date TEXT,
        status TEXT DEFAULT 'valid',
        cost REAL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    # --- Exit / Offboarding ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS exit_requests (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE NOT NULL,
        employee_id TEXT NOT NULL REFERENCES employees(id),
        exit_type TEXT NOT NULL DEFAULT 'resignation',
        reason TEXT,
        last_working_day TEXT,
        notice_period_days INTEGER DEFAULT 30,
        clearance_status JSONB DEFAULT '{}',
        final_settlement JSONB DEFAULT '{}',
        status TEXT DEFAULT 'initiated',
        initiated_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
    )""")


    # Seed policies
    c.execute("SELECT COUNT(*) FROM policies")
    if c.fetchone()[0] == 0:
        _seed_policies(c)
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


    # Seed expenses
    c.execute("SELECT COUNT(*) FROM expenses")
    if c.fetchone()[0] == 0:
        expenses = [
            ("EXP-2026-001", "E001", "travel", "Airport taxi for client meeting", 350, "2026-02-20", "pending", "E003"),
            ("EXP-2026-002", "E001", "meals", "Team lunch - project launch celebration", 480, "2026-02-18", "approved", "E003"),
            ("EXP-2026-003", "E004", "office_supplies", "External monitor for home office", 1200, "2026-02-15", "pending", "E003"),
            ("EXP-2026-004", "E006", "training", "HR certification course materials", 750, "2026-02-10", "approved", "E002"),
            ("EXP-2026-005", "E007", "travel", "Uber to data center for server migration", 180, "2026-02-22", "pending", "E003"),
        ]
        for e in expenses:
            c.execute("INSERT INTO expenses (ref, employee_id, category, description, amount, expense_date, status, approver_id) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)", e)

        conn.commit()

    # Seed claims
    c.execute("SELECT COUNT(*) FROM claims")
    if c.fetchone()[0] == 0:
        claims = [
            ("CLM-2026-001", "E001", "medical", "Dental treatment - root canal", 2800, "pending", "E002"),
            ("CLM-2026-002", "E004", "medical", "Eye examination and prescription glasses", 950, "approved", "E002"),
            ("CLM-2026-003", "E006", "relocation", "Moving expenses - new apartment", 3500, "pending", "E002"),
            ("CLM-2026-004", "E007", "education", "Professional certification exam fee", 1800, "pending", "E003"),
        ]
        for cl in claims:
            c.execute("INSERT INTO claims (ref, employee_id, claim_type, description, amount, status, approver_id) VALUES (%s,%s,%s,%s,%s,%s,%s)", cl)
        conn.commit()

    # Seed payments
    c.execute("SELECT COUNT(*) FROM payments")
    if c.fetchone()[0] == 0:
        payments = [
            ("PAY-2026-001", "E001", "salary", "February 2026 Salary", 16500, "completed", "bank_transfer", "2026-02-25"),
            ("PAY-2026-002", "E002", "salary", "February 2026 Salary", 24500, "completed", "bank_transfer", "2026-02-25"),
            ("PAY-2026-003", "E001", "reimbursement", "Expense EXP-2026-002 reimbursement", 480, "completed", "bank_transfer", "2026-02-20"),
            ("PAY-2026-004", "E004", "reimbursement", "Claim CLM-2026-002 approved amount", 950, "processing", "bank_transfer", None),
            ("PAY-2026-005", "E006", "bonus", "Q4 2025 Performance Bonus", 2500, "completed", "bank_transfer", "2026-02-25"),
        ]
        for p in payments:
            c.execute("INSERT INTO payments (ref, employee_id, payment_type, description, amount, status, payment_method, payment_date) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)", p)
        conn.commit()

    # Seed letters
    c.execute("SELECT COUNT(*) FROM letters")
    if c.fetchone()[0] == 0:
        letters_seed = [
            ("LTR-2026-001", "E001", "employment_certificate", "Bank loan application", "en", "Al Rajhi Bank", "issued", "E005"),
            ("LTR-2026-002", "E004", "salary_certificate", "Apartment rental", "en", "Real Estate Agent", "issued", "E002"),
            ("LTR-2026-003", "E006", "experience_letter", "Visa application", "en", "Embassy of UAE", "pending", None),
        ]
        for lt in letters_seed:
            c.execute("INSERT INTO letters (ref, employee_id, letter_type, purpose, language, addressed_to, status, issued_by) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)", lt)
        conn.commit()

    # Seed contracts
    c.execute("SELECT COUNT(*) FROM contracts")
    if c.fetchone()[0] == 0:
        contracts_seed = [
            ("E001", "unlimited", "2020-03-15", None, "2020-06-15", None, 16500, "active"),
            ("E002", "unlimited", "2019-06-01", None, "2019-09-01", None, 24500, "active"),
            ("E003", "unlimited", "2018-01-10", None, "2018-04-10", None, 22000, "active"),
            ("E004", "fixed", "2023-08-20", "2025-08-20", "2023-11-20", "2025-08-20", 15000, "active"),
            ("E005", "unlimited", "2017-03-01", None, "2017-06-01", None, 30000, "active"),
            ("E006", "fixed", "2024-01-15", "2026-01-15", "2024-04-15", "2026-01-15", 14500, "active"),
            ("E007", "unlimited", "2022-11-01", None, "2023-02-01", None, 13000, "active"),
        ]
        for ct in contracts_seed:
            c.execute("INSERT INTO contracts (employee_id, contract_type, start_date, end_date, probation_end, renewal_date, salary, status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)", ct)
        conn.commit()

    # Seed assets
    c.execute("SELECT COUNT(*) FROM assets")
    if c.fetchone()[0] == 0:
        assets_seed = [
            ("AST-001", "laptop", "MacBook Pro 16-inch", "SN-MBP2024-001", "E001", "2024-01-15", "good", "assigned"),
            ("AST-002", "laptop", "Dell XPS 15", "SN-DELL2024-002", "E004", "2024-03-10", "good", "assigned"),
            ("AST-003", "phone", "iPhone 15 Pro", "SN-IP15-003", "E005", "2024-06-01", "good", "assigned"),
            ("AST-004", "monitor", "LG UltraWide 34-inch", "SN-LG34-004", "E001", "2024-01-15", "good", "assigned"),
            ("AST-005", "vehicle", "Toyota Camry 2024", "VIN-TC2024-005", "E005", "2024-01-01", "good", "assigned"),
            ("AST-006", "access_card", "Building Access Card", "AC-006", "E003", "2023-01-10", "good", "assigned"),
            ("AST-007", "laptop", "ThinkPad X1 Carbon", "SN-TP2023-007", None, None, "good", "available"),
        ]
        for a in assets_seed:
            c.execute("INSERT INTO assets (ref, asset_type, name, serial_number, assigned_to, assigned_date, condition, status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)", a)
        conn.commit()

    # Seed shifts
    c.execute("SELECT COUNT(*) FROM shifts")
    if c.fetchone()[0] == 0:
        shifts_seed = [
            ("Morning", "08:00", "17:00", 60, 0, 0, "active"),
            ("Evening", "14:00", "23:00", 60, 0, 10, "active"),
            ("Night", "22:00", "07:00", 60, 1, 25, "active"),
            ("Ramadan", "10:00", "15:00", 30, 0, 0, "active"),
            ("Split", "08:00", "12:00", 0, 0, 0, "active"),
        ]
        for sh in shifts_seed:
            c.execute("INSERT INTO shifts (name, start_time, end_time, break_minutes, is_night_shift, differential_pct, status) VALUES (%s,%s,%s,%s,%s,%s,%s)", sh)
        conn.commit()

    # Seed employee shifts
    c.execute("SELECT COUNT(*) FROM employee_shifts")
    if c.fetchone()[0] == 0:
        eshifts = [
            ("E001", 1, "2026-01-01"), ("E002", 1, "2026-01-01"), ("E003", 1, "2026-01-01"),
            ("E004", 1, "2026-01-01"), ("E005", 1, "2026-01-01"), ("E006", 1, "2026-01-01"),
            ("E007", 2, "2026-01-01"),
        ]
        for es in eshifts:
            c.execute("INSERT INTO employee_shifts (employee_id, shift_id, effective_date) VALUES (%s,%s,%s)", es)
        conn.commit()

    # Seed iqama/visa
    c.execute("SELECT COUNT(*) FROM iqama_visa")
    if c.fetchone()[0] == 0:
        iqama_seed = [
            ("E001", "iqama", "2487654321", "2024-06-15", "2026-06-15", "valid", 650),
            ("E001", "passport", "A12345678", "2022-01-10", "2032-01-10", "valid", 0),
            ("E004", "iqama", "2498765432", "2024-08-20", "2026-08-20", "valid", 650),
            ("E004", "work_visa", "WV-2024-1234", "2024-08-01", "2026-08-01", "valid", 2000),
            ("E006", "iqama", "2412345678", "2024-01-15", "2026-01-15", "expiring_soon", 650),
            ("E006", "medical_insurance", "MI-2026-006", "2025-06-01", "2026-06-01", "valid", 1500),
            ("E007", "iqama", "2476543210", "2025-03-01", "2027-03-01", "valid", 650),
        ]
        for iv in iqama_seed:
            c.execute("INSERT INTO iqama_visa (employee_id, document_type, document_number, issue_date, expiry_date, status, cost) VALUES (%s,%s,%s,%s,%s,%s,%s)", iv)
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




# ── Policy defaults (used as fallback) ──────────────────

DEFAULT_POLICIES = {
    "leave": {"annual": 30, "sick": 30, "emergency": 5, "study": 15, "max_carry_over": 5, "min_notice_days": 3, "approval_required": True},
    "loan": {"max_amount_multiplier": 2, "max_emi_percent": 33, "min_service_years": 1, "approval_required": True, "types": ["Interest-Free", "Advance Salary", "Personal", "Emergency"]},
    "attendance": {"work_start": "08:00", "work_end": "17:00", "late_threshold": "08:30", "standard_hours": 8, "max_overtime_hours": 4, "overtime_approval": True},
    "travel": {"max_days": 30, "approval_required": True, "per_diem_chairman_intl": 3500, "per_diem_chairman_local": 2000, "per_diem_clevel_intl": 1750, "per_diem_clevel_local": 1200, "per_diem_other_intl": 1350, "per_diem_other_local": 900},
    "grievance": {"categories": ["harassment", "discrimination", "safety", "policy", "compensation", "other"], "severity_levels": ["low", "medium", "high", "critical"], "sla_hours": {"low": 168, "medium": 72, "high": 24, "critical": 4}},
    "gosi": {
        "employee_rate": 9.75,
        "employer_rate": 11.75,
        "max_insurable_salary": 45000,
        "annuities_employee": 9.75,
        "annuities_employer": 9.0,
        "occupational_hazards_employer": 2.0,
        "saned_employer": 0.75,
        "applies_to": "saudi_nationals",
        "non_saudi_rate": 2.0,
        "effective_date": "2026-01-01"
    },
    "end_of_service": {
        "first_5_years_rate": 0.5,
        "after_5_years_rate": 1.0,
        "min_service_months": 24,
        "resignation_1_2_years": 0,
        "resignation_2_5_years": 0.333,
        "resignation_5_10_years": 0.667,
        "resignation_10_plus_years": 1.0,
        "termination_rate": 1.0,
        "max_months_salary": 0,
        "based_on": "last_basic_plus_housing",
        "effective_date": "2026-01-01"
    },
}


def _seed_policies(c):
    """Seed default policies into the policies table."""
    import json as _json
    for category, config in DEFAULT_POLICIES.items():
        c.execute(
            "INSERT INTO policies (category, config) VALUES (%s, %s) ON CONFLICT (category) DO NOTHING",
            (category, _json.dumps(config))
        )


# ── Policy cache (refreshed per request cycle) ─────────

_policy_cache = {}
_policy_cache_ts = 0


def _load_policies():
    """Load all policies into cache (refreshes every 60s)."""
    import time as _time
    global _policy_cache, _policy_cache_ts
    now = _time.time()
    if _policy_cache and (now - _policy_cache_ts) < 60:
        return _policy_cache
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT category, config FROM policies")
        rows = _fetchall(c)
        conn.close()
        _policy_cache = {r["category"]: r["config"] for r in rows}
        _policy_cache_ts = now
    except Exception:
        pass
    return _policy_cache


def get_policy(key: str, default=None):
    """Get a policy value by dot-notation key (e.g. 'loan.max_emi_percent').
    Falls back to DEFAULT_POLICIES then default."""
    parts = key.split(".", 1)
    category = parts[0]
    field = parts[1] if len(parts) > 1 else None
    policies = _load_policies()
    config = policies.get(category) or DEFAULT_POLICIES.get(category) or {}
    if field is None:
        return config or default
    # Handle nested keys like travel.per_diem.chairman.international -> per_diem_chairman_intl
    return config.get(field, default)


def set_policy(category: str, config: dict):
    """Set/merge a policy config for a category. Returns updated config."""
    import json as _json
    global _policy_cache_ts
    conn = get_db()
    c = conn.cursor()
    # Merge: existing config || new values
    c.execute("SELECT config FROM policies WHERE category = %s", (category,))
    existing = _fetchone(c)
    if existing:
        merged = existing["config"]
        merged.update(config)
        c.execute("UPDATE policies SET config = %s, updated_at = NOW() WHERE category = %s",
                  (_json.dumps(merged), category))
    else:
        c.execute("INSERT INTO policies (category, config) VALUES (%s, %s)",
                  (category, _json.dumps(config)))
    conn.commit()
    conn.close()
    _policy_cache_ts = 0  # Invalidate cache
    return {"ok": True, "category": category, "config": config}



def get_all_policies():
    """Get all policies as a dict of category -> {config, updated_at}."""
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT category, config, updated_at, updated_by FROM policies ORDER BY category")
    rows = _fetchall(c)
    conn.close()
    return {r["category"]: {"config": r["config"], "updated_at": r["updated_at"], "updated_by": r["updated_by"]} for r in rows}




def calculate_gosi(employee_id: str):
    """Calculate GOSI contributions per Saudi regulations (existing & new system)."""
    from datetime import datetime, date
    emp = get_employee(employee_id)
    if not emp:
        return None
    sal = emp["salary"]
    policy = get_policy("gosi") or {}
    
    basic = sal["basic"]
    housing = sal["housing"]
    contribution_base = basic + housing
    min_ins = policy.get("min_insurable_salary", 1500)
    max_ins = policy.get("max_insurable_salary", 45000)
    insurable = max(min(contribution_base, max_ins), min_ins)
    
    nationality = emp.get("nationality", "Saudi")
    is_saudi = "saudi" in nationality.lower()
    is_gcc = any(c in nationality.lower() for c in ["bahrain", "kuwait", "oman", "qatar", "uae", "emirati"])
    
    # Determine if new system (joined after Jul 3, 2024)
    join_date = emp.get("join_date", "2020-01-01")
    if isinstance(join_date, str):
        join_dt = datetime.strptime(join_date, "%Y-%m-%d").date()
    else:
        join_dt = join_date
    new_system = join_dt > date(2024, 7, 3)
    
    if is_gcc:
        # GCC nationals follow home country regulations
        return {
            "employee_id": employee_id, "name": emp["name"], "nationality": nationality,
            "is_saudi": False, "is_gcc": True,
            "note": "GCC nationals follow home country social security regulations",
            "basic_salary": basic, "housing_allowance": housing,
            "insurable_salary": insurable,
            "employee_contribution": 0, "employer_contribution": 0,
            "total_contribution": 0, "employee_rate": 0, "employer_rate": 0,
            "breakdown": {}, "annual_employee": 0, "annual_employer": 0, "annual_total": 0,
            "system": "gcc_home_country", "new_system": False,
        }
    
    if is_saudi:
        if new_system:
            emp_rate_pct = policy.get("new_employee_rate", 10.25)
            er_rate_pct = policy.get("new_employer_rate", 12.25)
            system_label = "New System (post Jul 2024)"
        else:
            emp_rate_pct = policy.get("employee_rate", 9.75)
            er_rate_pct = policy.get("employer_rate", 11.75)
            system_label = "Existing System (pre Jul 2024)"
        
        emp_contribution = round(insurable * emp_rate_pct / 100, 2)
        er_contribution = round(insurable * er_rate_pct / 100, 2)
        
        # Detailed breakdown
        annuities_emp = policy.get("annuities_employee", 9.0)
        annuities_er = policy.get("annuities_employer", 9.0)
        saned_emp = policy.get("saned_employee", 0.75)
        saned_er = policy.get("saned_employer", 0.75)
        occ_hazards = policy.get("occupational_hazards_employer", 2.0)
        
        if new_system:
            # New system adds 0.5% each to annuities per year from Jul 2025
            annuities_emp = emp_rate_pct - saned_emp
            annuities_er = er_rate_pct - saned_er - occ_hazards
        
        breakdown = {
            "annuities_employee": round(insurable * annuities_emp / 100, 2),
            "annuities_employer": round(insurable * annuities_er / 100, 2),
            "saned_employee": round(insurable * saned_emp / 100, 2),
            "saned_employer": round(insurable * saned_er / 100, 2),
            "occupational_hazards": round(insurable * occ_hazards / 100, 2),
        }
        breakdown["total_employee"] = breakdown["annuities_employee"] + breakdown["saned_employee"]
        breakdown["total_employer"] = breakdown["annuities_employer"] + breakdown["saned_employer"] + breakdown["occupational_hazards"]
    else:
        # Non-Saudi: employer pays occupational hazards only
        emp_rate_pct = 0
        er_rate_pct = policy.get("non_saudi_employer_rate", 2.0)
        emp_contribution = 0
        er_contribution = round(insurable * er_rate_pct / 100, 2)
        system_label = "Non-Saudi (Occupational Hazards Only)"
        breakdown = {
            "occupational_hazards": er_contribution,
            "total_employee": 0,
            "total_employer": er_contribution,
        }
    
    # Compliance info
    compliance = {
        "payment_due_day": policy.get("payment_due_day", 15),
        "late_penalty_pct": policy.get("late_payment_penalty_pct", 2),
        "registration_deadline_days": policy.get("registration_deadline_days", 15),
        "portal": policy.get("portal_url", "https://www.gosi.gov.sa"),
        "regulatory_body": policy.get("regulatory_body", "GOSI"),
    }
    
    # Benefits info for Saudis
    benefits = {}
    if is_saudi:
        benefits = {
            "retirement_age": policy.get("retirement_age_male", 60),
            "min_months_pension": policy.get("min_contribution_months_pension", 120),
            "min_months_early_retirement": policy.get("min_contribution_months_early", 300),
            "disability_min_months": policy.get("disability_pension_min_months", 12),
            "coverage": ["Retirement Pension", "Disability", "Death Benefits", "Occupational Hazards", "SANED Unemployment"],
        }
    else:
        benefits = {
            "coverage": ["Occupational Hazards"],
        }
    
    # Rate schedule for new system
    rate_schedule = policy.get("rate_schedule", {})
    
    return {
        "employee_id": employee_id,
        "name": emp["name"],
        "nationality": nationality,
        "is_saudi": is_saudi,
        "is_gcc": False,
        "new_system": new_system,
        "system": system_label,
        "basic_salary": basic,
        "housing_allowance": housing,
        "insurable_salary": insurable,
        "min_insurable": min_ins,
        "max_insurable": max_ins,
        "employee_contribution": emp_contribution,
        "employer_contribution": er_contribution,
        "total_contribution": emp_contribution + er_contribution,
        "employee_rate": emp_rate_pct,
        "employer_rate": er_rate_pct,
        "total_rate": emp_rate_pct + er_rate_pct,
        "breakdown": breakdown,
        "annual_employee": emp_contribution * 12,
        "annual_employer": er_contribution * 12,
        "annual_total": (emp_contribution + er_contribution) * 12,
        "compliance": compliance,
        "benefits": benefits,
        "rate_schedule": rate_schedule,
    }


def calculate_end_of_service(employee_id: str, reason: str = "termination"):
    """Calculate end of service benefit (gratuity) based on Saudi Labor Law + policy."""
    from datetime import datetime, date
    emp = get_employee(employee_id)
    if not emp:
        return None
    policy = get_policy("end_of_service") or {}
    
    join_date = emp.get("join_date", "2020-01-01")
    if isinstance(join_date, str):
        join_date = datetime.strptime(join_date, "%Y-%m-%d").date()
    today = date.today()
    
    total_days = (today - join_date).days
    total_years = total_days / 365.25
    total_months = total_days / 30.44
    
    sal = emp["salary"]
    based_on = policy.get("based_on", "last_basic_plus_housing")
    if based_on == "last_basic_plus_housing":
        base_wage = sal["basic"] + sal["housing"]
    elif based_on == "last_total":
        base_wage = sal["total"]
    else:
        base_wage = sal["basic"]
    
    daily_wage = base_wage / 30
    
    # Calculate gratuity per Saudi Labor Law
    min_months = policy.get("min_service_months", 24)
    if total_months < min_months:
        gratuity = 0
        eligible = False
        note = f"Minimum {min_months} months service required. Currently {total_months:.0f} months."
    else:
        eligible = True
        # First 5 years: half month per year
        first_5 = min(total_years, 5)
        rate_first = policy.get("first_5_years_rate", 0.5)
        # After 5 years: full month per year
        after_5 = max(total_years - 5, 0)
        rate_after = policy.get("after_5_years_rate", 1.0)
        
        gratuity_first = first_5 * rate_first * base_wage
        gratuity_after = after_5 * rate_after * base_wage
        full_gratuity = gratuity_first + gratuity_after
        
        # Apply resignation discount
        reason_lower = reason.lower()
        if "resign" in reason_lower:
            if total_years < 2:
                multiplier = policy.get("resignation_1_2_years", 0)
            elif total_years < 5:
                multiplier = policy.get("resignation_2_5_years", 0.333)
            elif total_years < 10:
                multiplier = policy.get("resignation_5_10_years", 0.667)
            else:
                multiplier = policy.get("resignation_10_plus_years", 1.0)
        else:
            multiplier = policy.get("termination_rate", 1.0)
        
        gratuity = round(full_gratuity * multiplier, 2)
        note = f"Based on {total_years:.1f} years of service"
        if "resign" in reason_lower:
            note += f" (resignation: {multiplier*100:.0f}% of full gratuity)"
    
    return {
        "employee_id": employee_id,
        "name": emp["name"],
        "position": emp["position"],
        "department": emp["department"],
        "join_date": str(join_date),
        "years_of_service": round(total_years, 2),
        "months_of_service": round(total_months, 1),
        "base_wage": base_wage,
        "daily_wage": round(daily_wage, 2),
        "reason": reason,
        "eligible": eligible,
        "gratuity_amount": gratuity,
        "first_5_years": round(min(total_years, 5) * policy.get("first_5_years_rate", 0.5) * base_wage, 2) if eligible else 0,
        "after_5_years": round(max(total_years - 5, 0) * policy.get("after_5_years_rate", 1.0) * base_wage, 2) if eligible else 0,
        "multiplier": multiplier if eligible else 0,
        "note": note,
        "currency": "SAR",
    }


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
    min_years = get_policy("loan.min_service_years", 1)
    if years < min_years:
        return {"eligible": False, "reason": f"Min {min_years} year service required"}
    loans = get_employee_loans(emp_id)
    basic = emp["salary"]["basic"]
    existing_emi = sum(l.get("monthly_installment", 0) or 0 for l in loans)
    max_emi = basic * (get_policy("loan.max_emi_percent", 33) / 100)
    available = max_emi - existing_emi
    if available <= 0:
        return {"eligible": False, "reason": f"EMI cap reached ({existing_emi:,.0f}/{max_emi:,.0f} SAR)"}
    multiplier = get_policy("loan.max_amount_multiplier", 2)
    return {"eligible": True, "max_amount": int(min(basic * multiplier, available * 12)), "max_emi": int(available), "service_years": round(years, 1)}


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

# Per diem rates now loaded from policies DB

def get_per_diem(grade, international=False):
    g = int(grade) if grade and grade.isdigit() else 34
    tier = "chairman" if g >= 40 else "c_level" if g >= 38 else "other"
    region = "intl" if international else "local"
    return get_policy(f"travel.per_diem_{tier}_{region}", 900)


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
    """Get real attendance data for manager's team (today)."""
    conn = get_db()
    c = conn.cursor()
    today = str(date.today())
    c.execute("""
        SELECT e.id, e.name, a.clock_in, a.clock_out, a.status, a.location
        FROM employees e
        LEFT JOIN attendance_records a ON e.id = a.employee_id AND a.date = %s
        WHERE e.manager_id = %s
        ORDER BY e.name
    """, (today, manager_id))
    rows = _fetchall(c)
    c.execute("""
        SELECT employee_id FROM leave_requests
        WHERE approver_id = %s AND status = 'approved'
        AND start_date <= %s AND end_date >= %s
    """, (manager_id, today, today))
    on_leave_ids = {r["employee_id"] for r in _fetchall(c)}
    conn.close()
    result = []
    for r in rows:
        if r["id"] in on_leave_ids:
            status = "on_leave"
        elif r.get("clock_in"):
            status = r.get("status", "present")
        else:
            status = "absent"
        result.append({
            "name": r["name"],
            "status": status,
            "checkIn": r.get("clock_in"),
            "checkOut": r.get("clock_out"),
            "location": r.get("location"),
        })
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
    _late = get_policy("attendance.late_threshold", "08:30")
    _late_h, _late_m = map(int, _late.split(":"))
    status = "late" if (hour > _late_h or (hour == _late_h and minute > _late_m)) else "present"
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
    _std_hours = get_policy("attendance.standard_hours", 8)
    overtime = max(0, round(hours - _std_hours, 2))
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


# ── Expense Management ──────────────────────────────────

def create_expense(employee_id, category, description, amount, expense_date, receipt_ref=None):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM expenses")
    count = c.fetchone()[0]
    ref = f"EXP-2026-{count+1:03d}"
    emp = get_employee(employee_id)
    approver_id = emp.get("manager_id") if emp else None
    c.execute("""INSERT INTO expenses (ref, employee_id, category, description, amount, expense_date, receipt_ref, approver_id)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING ref""",
        (ref, employee_id, category, description, amount, expense_date, receipt_ref, approver_id))
    conn.commit()
    conn.close()
    _create_notification(employee_id, "expense", "Expense Submitted", f"Your expense {ref} for {amount} SAR has been submitted.")
    return {"ref": ref, "amount": amount, "category": category, "status": "pending"}


def get_employee_expenses(employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT e.*, m.name as approver_name FROM expenses e
        LEFT JOIN employees m ON e.approver_id = m.id
        WHERE e.employee_id = %s ORDER BY e.created_at DESC""", (employee_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def get_pending_expenses(manager_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT e.*, emp.name as employee_name, emp.department
        FROM expenses e JOIN employees emp ON e.employee_id = emp.id
        WHERE e.approver_id = %s AND e.status = 'pending'
        ORDER BY e.created_at DESC""", (manager_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def approve_expense(ref, decision, rejection_reason=None):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT employee_id, amount FROM expenses WHERE ref = %s AND status = 'pending'", (ref,))
    row = _fetchone(c)
    if not row:
        conn.close()
        return None
    status = "approved" if decision == "approved" else "rejected"
    c.execute("UPDATE expenses SET status = %s, approved_at = NOW(), rejection_reason = %s WHERE ref = %s",
        (status, rejection_reason, ref))
    conn.commit()
    # Auto-create reimbursement payment if approved
    if status == "approved":
        _create_reimbursement_payment(c, conn, row["employee_id"], row["amount"], f"Expense {ref} reimbursement", ref)
    conn.close()
    _create_notification(row["employee_id"], "expense", f"Expense {status.title()}", f"Your expense {ref} has been {status}.")
    return {"ref": ref, "status": status}


def get_expense_summary(employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END), 0) as approved,
        COALESCE(SUM(CASE WHEN status='approved' THEN amount ELSE 0 END), 0) as approved_amount,
        COALESCE(SUM(CASE WHEN status='pending' THEN amount ELSE 0 END), 0) as pending_amount
        FROM expenses WHERE employee_id = %s""", (employee_id,))
    row = _fetchone(c)
    conn.close()
    return row


# ── Claims Management ───────────────────────────────────

def submit_claim(employee_id, claim_type, description, amount, supporting_doc=None):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM claims")
    count = c.fetchone()[0]
    ref = f"CLM-2026-{count+1:03d}"
    emp = get_employee(employee_id)
    approver_id = emp.get("manager_id") if emp else None
    c.execute("""INSERT INTO claims (ref, employee_id, claim_type, description, amount, supporting_doc, approver_id)
        VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING ref""",
        (ref, employee_id, claim_type, description, amount, supporting_doc, approver_id))
    conn.commit()
    conn.close()
    _create_notification(employee_id, "claim", "Claim Submitted", f"Your claim {ref} for {amount} SAR has been submitted.")
    return {"ref": ref, "amount": amount, "claim_type": claim_type, "status": "pending"}


def get_employee_claims(employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT cl.*, m.name as approver_name FROM claims cl
        LEFT JOIN employees m ON cl.approver_id = m.id
        WHERE cl.employee_id = %s ORDER BY cl.submitted_at DESC""", (employee_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def get_pending_claims(manager_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT cl.*, emp.name as employee_name, emp.department
        FROM claims cl JOIN employees emp ON cl.employee_id = emp.id
        WHERE cl.approver_id = %s AND cl.status = 'pending'
        ORDER BY cl.submitted_at DESC""", (manager_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def approve_claim(ref, decision, approved_amount=None):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT employee_id, amount FROM claims WHERE ref = %s AND status = 'pending'", (ref,))
    row = _fetchone(c)
    if not row:
        conn.close()
        return None
    status = "approved" if decision == "approved" else "rejected"
    final_amount = approved_amount or row["amount"]
    c.execute("UPDATE claims SET status = %s, approved_amount = %s, processed_at = NOW() WHERE ref = %s",
        (status, final_amount if status == "approved" else None, ref))
    conn.commit()
    if status == "approved":
        _create_reimbursement_payment(c, conn, row["employee_id"], final_amount, f"Claim {ref} approved amount", ref)
    conn.close()
    _create_notification(row["employee_id"], "claim", f"Claim {status.title()}", f"Your claim {ref} has been {status}.")
    return {"ref": ref, "status": status, "approved_amount": final_amount}


# ── Payments Management ─────────────────────────────────

def _create_reimbursement_payment(c, conn, employee_id, amount, description, reference_id):
    c.execute("SELECT COUNT(*) FROM payments")
    count = c.fetchone()[0]
    ref = f"PAY-2026-{count+1:03d}"
    c.execute("""INSERT INTO payments (ref, employee_id, payment_type, description, amount, status, reference_id)
        VALUES (%s,%s,'reimbursement',%s,%s,'processing',%s)""",
        (ref, employee_id, description, amount, reference_id))
    conn.commit()
    return ref


def get_employee_payments(employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM payments WHERE employee_id = %s ORDER BY created_at DESC", (employee_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def get_all_payments(status_filter=None):
    conn = get_db()
    c = conn.cursor()
    if status_filter:
        c.execute("""SELECT p.*, e.name as employee_name, e.department
            FROM payments p JOIN employees e ON p.employee_id = e.id
            WHERE p.status = %s ORDER BY p.created_at DESC""", (status_filter,))
    else:
        c.execute("""SELECT p.*, e.name as employee_name, e.department
            FROM payments p JOIN employees e ON p.employee_id = e.id
            ORDER BY p.created_at DESC""")
    rows = _fetchall(c)
    conn.close()
    return rows


def process_payment(ref, status, payment_date=None):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT employee_id FROM payments WHERE ref = %s", (ref,))
    row = _fetchone(c)
    if not row:
        conn.close()
        return None
    c.execute("UPDATE payments SET status = %s, payment_date = %s, processed_at = NOW() WHERE ref = %s",
        (status, payment_date or str(date.today()), ref))
    conn.commit()
    conn.close()
    _create_notification(row["employee_id"], "payment", f"Payment {status.title()}", f"Payment {ref} status: {status}")
    return {"ref": ref, "status": status}


def get_payment_summary(employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT
        COALESCE(SUM(CASE WHEN status='completed' THEN amount ELSE 0 END), 0) as total_received,
        COALESCE(SUM(CASE WHEN status='processing' THEN amount ELSE 0 END), 0) as processing,
        COALESCE(SUM(CASE WHEN status='pending' THEN amount ELSE 0 END), 0) as pending,
        COUNT(*) as total_payments
        FROM payments WHERE employee_id = %s""", (employee_id,))
    row = _fetchone(c)
    conn.close()
    return row


def _create_notification(employee_id, ntype, title, message):
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("INSERT INTO notifications (employee_id, type, title, message) VALUES (%s,%s,%s,%s)",
            (employee_id, ntype, title, message))
        conn.commit()
        conn.close()
    except Exception:
        pass



# ============================================================
# LETTER GENERATION
# ============================================================

def generate_letter(employee_id, letter_type, purpose=None, addressed_to=None, language="en"):
    """Generate an HR letter for an employee."""
    conn = get_db()
    c = conn.cursor()
    emp = get_employee(employee_id)
    if not emp:
        conn.close()
        return None

    c.execute("SELECT COUNT(*) FROM letters WHERE employee_id=%s", (employee_id,))
    count = c.fetchone()[0] + 1
    ref = f"LTR-{date.today().year}-{count:03d}"

    # Build content data
    content_data = {
        "employee_name": emp["name"],
        "employee_name_ar": emp.get("name_ar", ""),
        "employee_id": employee_id,
        "position": emp.get("position", ""),
        "department": emp.get("department", ""),
        "join_date": emp.get("join_date", ""),
        "nationality": emp.get("nationality", ""),
        "basic_salary": emp.get("basic_salary", 0),
        "housing_allowance": emp.get("housing_allowance", 0),
        "transport_allowance": emp.get("transport_allowance", 0),
        "total_salary": (emp.get("basic_salary", 0) or 0) + (emp.get("housing_allowance", 0) or 0) + (emp.get("transport_allowance", 0) or 0),
        "grade": emp.get("grade", ""),
        "letter_date": str(date.today()),
        "purpose": purpose or "",
        "addressed_to": addressed_to or "To Whom It May Concern",
    }

    c.execute("""INSERT INTO letters (ref, employee_id, letter_type, purpose, language, addressed_to, content_data, status)
        VALUES (%s,%s,%s,%s,%s,%s,%s,'issued')""",
        (ref, employee_id, letter_type, purpose, language, addressed_to or "To Whom It May Concern",
         json.dumps(content_data)))
    conn.commit()
    conn.close()
    _create_notification(employee_id, "letter", f"Letter Generated: {ref}",
        f"Your {letter_type.replace('_', ' ').title()} has been generated.")
    content_data["ref"] = ref
    return content_data


def get_employee_letters(employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM letters WHERE employee_id=%s ORDER BY created_at DESC", (employee_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


LETTER_TYPES = ["employment_certificate", "salary_certificate", "experience_letter", "noc_letter", "promotion_letter", "bank_letter"]


# ============================================================
# CONTRACT MANAGEMENT
# ============================================================

def get_employee_contract(employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM contracts WHERE employee_id=%s AND status='active' ORDER BY start_date DESC LIMIT 1", (employee_id,))
    row = _fetchone(c)
    conn.close()
    return row


def get_expiring_contracts(days_ahead=90):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT c.*, e.name, e.department FROM contracts c
        JOIN employees e ON c.employee_id = e.id
        WHERE c.contract_type='fixed' AND c.status='active'
        AND c.end_date IS NOT NULL
        AND c.end_date <= (CURRENT_DATE + INTERVAL '%s days')::TEXT
        ORDER BY c.end_date""", (days_ahead,))
    rows = _fetchall(c)
    conn.close()
    return rows


def renew_contract(employee_id, new_end_date, new_salary=None):
    conn = get_db()
    c = conn.cursor()
    c.execute("""UPDATE contracts SET end_date=%s, renewal_date=%s, salary=COALESCE(%s, salary)
        WHERE employee_id=%s AND status='active'""",
        (new_end_date, new_end_date, new_salary, employee_id))
    conn.commit()
    conn.close()
    return True


def get_all_contracts():
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT c.*, e.name, e.department, e.position FROM contracts c
        JOIN employees e ON c.employee_id = e.id ORDER BY c.start_date DESC""")
    rows = _fetchall(c)
    conn.close()
    return rows


# ============================================================
# ASSET TRACKING
# ============================================================

def get_employee_assets(employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM assets WHERE assigned_to=%s AND status='assigned' ORDER BY assigned_date DESC", (employee_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def get_all_assets(status_filter=None):
    conn = get_db()
    c = conn.cursor()
    if status_filter:
        c.execute("""SELECT a.*, e.name as assigned_name FROM assets a
            LEFT JOIN employees e ON a.assigned_to = e.id WHERE a.status=%s ORDER BY a.ref""", (status_filter,))
    else:
        c.execute("""SELECT a.*, e.name as assigned_name FROM assets a
            LEFT JOIN employees e ON a.assigned_to = e.id ORDER BY a.ref""")
    rows = _fetchall(c)
    conn.close()
    return rows


def assign_asset(ref, employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE assets SET assigned_to=%s, assigned_date=%s, status='assigned' WHERE ref=%s",
        (employee_id, str(date.today()), ref))
    conn.commit()
    conn.close()
    return True


def return_asset(ref):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE assets SET assigned_to=NULL, status='available' WHERE ref=%s", (ref,))
    conn.commit()
    conn.close()
    return True


# ============================================================
# SHIFT SCHEDULING
# ============================================================

def get_all_shifts():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM shifts WHERE status='active' ORDER BY start_time")
    rows = _fetchall(c)
    conn.close()
    return rows


def get_employee_shift(employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT es.*, s.name as shift_name, s.start_time, s.end_time, s.break_minutes,
        s.is_night_shift, s.differential_pct
        FROM employee_shifts es JOIN shifts s ON es.shift_id = s.id
        WHERE es.employee_id=%s AND (es.end_date IS NULL OR es.end_date >= CURRENT_DATE::TEXT)
        ORDER BY es.effective_date DESC LIMIT 1""", (employee_id,))
    row = _fetchone(c)
    conn.close()
    return row


def assign_shift(employee_id, shift_id, effective_date=None):
    conn = get_db()
    c = conn.cursor()
    eff = effective_date or str(date.today())
    # End current shift
    c.execute("UPDATE employee_shifts SET end_date=%s WHERE employee_id=%s AND end_date IS NULL", (eff, employee_id))
    c.execute("INSERT INTO employee_shifts (employee_id, shift_id, effective_date) VALUES (%s,%s,%s)",
        (employee_id, shift_id, eff))
    conn.commit()
    conn.close()
    return True


def get_team_shifts(manager_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT e.id, e.name, e.department, s.name as shift_name, s.start_time, s.end_time, s.is_night_shift
        FROM employees e
        LEFT JOIN employee_shifts es ON e.id = es.employee_id AND (es.end_date IS NULL OR es.end_date >= CURRENT_DATE::TEXT)
        LEFT JOIN shifts s ON es.shift_id = s.id
        WHERE e.manager_id=%s ORDER BY e.name""", (manager_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


# ============================================================
# REPORTS & ANALYTICS
# ============================================================

def get_hr_analytics():
    """Comprehensive HR analytics for reports dashboard."""
    conn = get_db()
    c = conn.cursor()
    result = {}

    # Headcount
    c.execute("SELECT COUNT(*) FROM employees")
    result["total_employees"] = c.fetchone()[0]

    c.execute("SELECT department, COUNT(*) as cnt FROM employees GROUP BY department ORDER BY cnt DESC")
    result["by_department"] = _fetchall(c)

    c.execute("SELECT nationality, COUNT(*) as cnt FROM employees GROUP BY nationality ORDER BY cnt DESC")
    result["by_nationality"] = _fetchall(c)

    # Leave utilization
    c.execute("""SELECT
        SUM(CASE WHEN status='approved' THEN days ELSE 0 END) as approved_days,
        SUM(CASE WHEN status='pending' THEN days ELSE 0 END) as pending_days,
        SUM(CASE WHEN status='rejected' THEN days ELSE 0 END) as rejected_days,
        COUNT(*) as total_requests
        FROM leave_requests""")
    result["leave_stats"] = _fetchone(c)

    # Salary costs
    c.execute("""SELECT
        SUM(basic_salary + housing_allowance + transport_allowance) as total_monthly_cost,
        AVG(basic_salary + housing_allowance + transport_allowance) as avg_salary,
        department, SUM(basic_salary + housing_allowance + transport_allowance) as dept_cost
        FROM employees GROUP BY department""")
    result["salary_by_dept"] = _fetchall(c)

    c.execute("SELECT SUM(basic_salary + housing_allowance + transport_allowance) as total FROM employees")
    result["total_monthly_payroll"] = c.fetchone()[0] or 0

    # Turnover (exit requests)
    c.execute("SELECT COUNT(*) FROM exit_requests WHERE status IN ('initiated', 'in_progress')")
    result["active_exits"] = c.fetchone()[0]

    # Asset stats
    c.execute("SELECT status, COUNT(*) as cnt FROM assets GROUP BY status")
    result["asset_stats"] = _fetchall(c)

    # Expiring documents
    c.execute("""SELECT COUNT(*) FROM iqama_visa
        WHERE expiry_date <= (CURRENT_DATE + INTERVAL '90 days')::TEXT AND status != 'expired'""")
    result["expiring_docs_90d"] = c.fetchone()[0]

    conn.close()
    return result


def get_monthly_payroll_summary():
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT e.id, e.name, e.department, e.basic_salary, e.housing_allowance, e.transport_allowance,
        (e.basic_salary + e.housing_allowance + e.transport_allowance) as gross,
        COALESCE(l.monthly_installment, 0) as loan_deduction
        FROM employees e
        LEFT JOIN loans l ON e.id = l.employee_id AND l.status = 'active'
        ORDER BY e.department, e.name""")
    rows = _fetchall(c)
    conn.close()
    return rows


# ============================================================
# EMPLOYEE DIRECTORY
# ============================================================

def get_employee_directory(search=None, department=None):
    conn = get_db()
    c = conn.cursor()
    query = """SELECT id, name, name_ar, position, department, email, phone, grade,
        manager_id, nationality FROM employees WHERE 1=1"""
    params = []
    if search:
        query += " AND (LOWER(name) LIKE %s OR LOWER(position) LIKE %s OR LOWER(department) LIKE %s OR id LIKE %s)"
        s = f"%{search.lower()}%"
        params.extend([s, s, s, s])
    if department:
        query += " AND LOWER(department) = %s"
        params.append(department.lower())
    query += " ORDER BY name"
    c.execute(query, params)
    rows = _fetchall(c)
    conn.close()
    return rows


def get_org_chart():
    """Get hierarchical org data."""
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, name, position, department, manager_id, grade FROM employees ORDER BY id")
    rows = _fetchall(c)
    conn.close()
    return rows


# ============================================================
# IQAMA / VISA TRACKING
# ============================================================

def get_employee_documents_visa(employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM iqama_visa WHERE employee_id=%s ORDER BY expiry_date", (employee_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def get_expiring_iqama_visa(days_ahead=90):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT iv.*, e.name, e.department FROM iqama_visa iv
        JOIN employees e ON iv.employee_id = e.id
        WHERE iv.expiry_date <= (CURRENT_DATE + INTERVAL '%s days')::TEXT
        AND iv.status != 'expired'
        ORDER BY iv.expiry_date""", (days_ahead,))
    rows = _fetchall(c)
    conn.close()
    return rows


def renew_iqama_visa(doc_id, new_expiry, cost=None):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE iqama_visa SET expiry_date=%s, status='valid', cost=COALESCE(%s, cost) WHERE id=%s",
        (new_expiry, cost, doc_id))
    conn.commit()
    conn.close()
    return True


# ============================================================
# EXIT / OFFBOARDING
# ============================================================

def initiate_exit(employee_id, exit_type="resignation", reason=None, last_working_day=None):
    conn = get_db()
    c = conn.cursor()

    emp = get_employee(employee_id)
    if not emp:
        conn.close()
        return None

    c.execute("SELECT COUNT(*) FROM exit_requests WHERE employee_id=%s", (employee_id,))
    count = c.fetchone()[0] + 1
    ref = f"EXIT-{date.today().year}-{count:03d}"

    if not last_working_day:
        last_working_day = str(date.today() + timedelta(days=30))

    # Clearance checklist
    clearance = {
        "it_assets": "pending",
        "access_cards": "pending",
        "finance_clearance": "pending",
        "hr_documents": "pending",
        "knowledge_transfer": "pending",
        "manager_signoff": "pending",
    }

    # Calculate final settlement
    eos = calculate_end_of_service(employee_id, exit_type)
    total_salary = (emp.get("basic_salary", 0) or 0) + (emp.get("housing_allowance", 0) or 0) + (emp.get("transport_allowance", 0) or 0)
    leave_days = emp.get("annual_leave", 0) or 0
    daily_rate = total_salary / 30
    leave_encashment = daily_rate * leave_days

    settlement = {
        "eos_amount": eos.get("total_gratuity", 0) if eos else 0,
        "leave_encashment": round(leave_encashment, 2),
        "pending_salary": round(total_salary, 2),
        "total_settlement": round((eos.get("total_gratuity", 0) if eos else 0) + leave_encashment + total_salary, 2),
    }

    c.execute("""INSERT INTO exit_requests (ref, employee_id, exit_type, reason, last_working_day, clearance_status, final_settlement, status)
        VALUES (%s,%s,%s,%s,%s,%s,%s,'initiated')""",
        (ref, employee_id, exit_type, reason, last_working_day, json.dumps(clearance), json.dumps(settlement)))
    conn.commit()
    conn.close()

    _create_notification(employee_id, "exit", f"Exit Request: {ref}",
        f"Your {exit_type} request has been initiated. Last working day: {last_working_day}")
    return {"ref": ref, "clearance": clearance, "settlement": settlement, "last_working_day": last_working_day}


def get_exit_request(employee_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT er.*, e.name, e.department, e.position FROM exit_requests er
        JOIN employees e ON er.employee_id = e.id
        WHERE er.employee_id=%s ORDER BY er.initiated_at DESC LIMIT 1""", (employee_id,))
    row = _fetchone(c)
    conn.close()
    return row


def get_all_exit_requests():
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT er.*, e.name, e.department, e.position FROM exit_requests er
        JOIN employees e ON er.employee_id = e.id ORDER BY er.initiated_at DESC""")
    rows = _fetchall(c)
    conn.close()
    return rows


def update_clearance_item(ref, item, status):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT clearance_status FROM exit_requests WHERE ref=%s", (ref,))
    row = c.fetchone()
    if not row:
        conn.close()
        return False
    clearance = json.loads(row[0]) if isinstance(row[0], str) else row[0]
    clearance[item] = status
    # Check if all cleared
    all_cleared = all(v == "cleared" for v in clearance.values())
    new_status = "cleared" if all_cleared else "in_progress"
    c.execute("UPDATE exit_requests SET clearance_status=%s, status=%s WHERE ref=%s",
        (json.dumps(clearance), new_status, ref))
    conn.commit()
    conn.close()
    return True


def complete_exit(ref):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE exit_requests SET status='completed', completed_at=NOW() WHERE ref=%s", (ref,))
    conn.commit()
    conn.close()
    return True

