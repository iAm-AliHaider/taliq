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
        announce_on_login BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        acknowledged_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS announcement_reads (
        id SERIAL PRIMARY KEY,
        announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
        employee_id TEXT NOT NULL,
        read_at TIMESTAMP DEFAULT NOW(),
        acknowledged BOOLEAN DEFAULT FALSE,
        acknowledged_at TIMESTAMP,
        UNIQUE(announcement_id, employee_id)
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
    CREATE TABLE IF NOT EXISTS course_materials (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        type TEXT DEFAULT 'link',
        url TEXT,
        content TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_DATE::TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS course_exams (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES training_courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        passing_score INTEGER DEFAULT 70,
        time_limit_minutes INTEGER DEFAULT 30,
        max_attempts INTEGER DEFAULT 3,
        shuffle_questions INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1,
        exam_type TEXT DEFAULT 'training',
        created_at TEXT DEFAULT CURRENT_DATE::TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS exam_questions (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER NOT NULL REFERENCES course_exams(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        question_type TEXT DEFAULT 'mcq',
        options JSONB DEFAULT '[]'::JSONB,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        points INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS exam_attempts (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER NOT NULL REFERENCES course_exams(id) ON DELETE CASCADE,
        participant_id TEXT NOT NULL,
        participant_type TEXT DEFAULT 'employee',
        participant_name TEXT,
        answers JSONB DEFAULT '{}'::JSONB,
        score REAL,
        passed INTEGER DEFAULT 0,
        started_at TEXT DEFAULT NOW()::TEXT,
        completed_at TEXT,
        time_spent_seconds INTEGER DEFAULT 0
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


    # --- Letter Templates ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS letter_templates (
        id SERIAL PRIMARY KEY,
        type TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        name_ar TEXT DEFAULT '',
        body_html TEXT NOT NULL,
        body_html_ar TEXT DEFAULT '',
        header JSONB DEFAULT '{}',
        footer JSONB DEFAULT '{}',
        variables TEXT[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT NOW(),
        updated_by TEXT DEFAULT 'system'
    )""")


    # --- Recruitment Pipeline ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS job_postings (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        department TEXT NOT NULL,
        description TEXT DEFAULT '',
        requirements TEXT DEFAULT '',
        salary_range TEXT DEFAULT '',
        location TEXT DEFAULT 'Riyadh',
        employment_type TEXT DEFAULT 'full_time',
        status TEXT DEFAULT 'open',
        posted_by TEXT REFERENCES employees(id),
        deadline DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE NOT NULL,
        job_id INTEGER REFERENCES job_postings(id),
        candidate_name TEXT NOT NULL,
        candidate_email TEXT DEFAULT '',
        candidate_phone TEXT DEFAULT '',
        resume_url TEXT DEFAULT '',
        cover_letter TEXT DEFAULT '',
        status TEXT DEFAULT 'applied',
        stage TEXT DEFAULT 'screening',
        score REAL DEFAULT 0,
        notes JSONB DEFAULT '{}',
        reviewed_by TEXT REFERENCES employees(id),
        interview_id INTEGER REFERENCES interviews(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )""")

    # --- Geofencing / GPS Attendance ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS geofences (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        radius_meters INTEGER DEFAULT 200,
        address TEXT DEFAULT '',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    # --- Multi-Level Approval Workflows ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS approval_workflows (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        entity_type TEXT NOT NULL,
        description TEXT DEFAULT '',
        steps JSONB NOT NULL DEFAULT '[]',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS approval_requests (
        id SERIAL PRIMARY KEY,
        ref TEXT UNIQUE NOT NULL,
        workflow_id INTEGER REFERENCES approval_workflows(id),
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        entity_ref TEXT DEFAULT '',
        requester_id TEXT REFERENCES employees(id),
        current_step INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        steps_log JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )""")


    # --- Audit Log ---
    c.execute("""
    CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT NOW(),
        actor_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        details JSONB DEFAULT '{}',
        ip_address TEXT
    )""")

    conn.commit()

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

    # Add new columns if missing
    try:
        c.execute("ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS start_date TEXT")
        c.execute("ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS end_date TEXT")
        c.execute("ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS schedule TEXT")
        c.execute("ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS location TEXT")
        c.execute("ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS max_seats INTEGER DEFAULT 0")
        c.execute("ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS materials_url TEXT")
        c.execute("ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS syllabus TEXT")
        conn.commit()
    except Exception:
        conn.rollback()

    c.execute("SELECT COUNT(*) FROM training_courses")
    if c.fetchone()[0] == 0:
        _seed_training_courses(c)

    # Seed exam for Safety Compliance course
    c.execute("SELECT COUNT(*) FROM course_exams")
    if c.fetchone()[0] == 0:
        c.execute("SELECT id FROM training_courses WHERE title = 'Safety Compliance' LIMIT 1")
        safety_id_row = c.fetchone()
        if safety_id_row:
            safety_id = safety_id_row[0]
            c.execute("""INSERT INTO course_exams (course_id, title, description, passing_score, time_limit_minutes, exam_type) 
                VALUES (%s, 'Safety Compliance Certification', 'Verify your knowledge of workplace safety standards', 80, 20, 'training')
                RETURNING id""", (safety_id,))
            exam_id = c.fetchone()[0]
            questions = [
                ("What is the first step when discovering a fire in the workplace?", 
                 json.dumps(["Fight the fire", "Alert others and activate the alarm", "Open windows", "Continue working"]),
                 "Alert others and activate the alarm", "Always prioritize alerting others first before attempting anything else."),
                ("How often should fire extinguishers be inspected?",
                 json.dumps(["Monthly", "Quarterly", "Yearly", "Every 5 years"]),
                 "Monthly", "Fire extinguishers must be visually inspected monthly per OSHA standards."),
                ("What does PPE stand for?",
                 json.dumps(["Personal Protection Equipment", "Personal Protective Equipment", "Private Protective Equipment", "Professional Protection Equipment"]),
                 "Personal Protective Equipment", "PPE = Personal Protective Equipment."),
                ("Which color indicates a fire exit sign?",
                 json.dumps(["Red", "Blue", "Green", "Yellow"]),
                 "Green", "Green signs indicate safe exit routes per international standards."),
                ("What should you do if you witness a workplace injury?",
                 json.dumps(["Ignore it", "Report to supervisor immediately", "Post on social media", "Wait until end of shift"]),
                 "Report to supervisor immediately", "All workplace injuries must be reported immediately."),
            ]
            for i, (q, opts, ans, expl) in enumerate(questions):
                c.execute("""INSERT INTO exam_questions (exam_id, question, options, correct_answer, explanation, sort_order)
                    VALUES (%s, %s, %s::JSONB, %s, %s, %s)""", (exam_id, q, opts, ans, expl, i))
        conn.commit()


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

    # --- Seed Letter Templates ---
    _templates = [
        ("employment_certificate", "Employment Certificate",
         "This is to certify that <strong>{{employeeName}}</strong> (Employee ID: {{employeeId}}, Nationality: {{nationality}}) has been employed at <strong>{{companyName}}</strong> as <strong>{{position}}</strong> in the <strong>{{department}}</strong> department since <strong>{{joinDate}}</strong>.\n\n{{#if purpose}}This certificate is issued upon the employee\'s request for the purpose of {{purpose}}.{{else}}This certificate is issued upon the employee\'s request.{{/if}}",
         ["employeeName","employeeId","nationality","position","department","joinDate","purpose","companyName"]),
        ("salary_certificate", "Salary Certificate",
         "This is to certify that <strong>{{employeeName}}</strong> (Employee ID: {{employeeId}}) is employed as <strong>{{position}}</strong> in the <strong>{{department}}</strong> department.\n\nThe employee\'s monthly compensation is as follows:\n\n<table class=\'salary-table\'><tr><td>Basic Salary</td><td><strong>{{basicSalary}} SAR</strong></td></tr><tr><td>Housing Allowance</td><td><strong>{{housingAllowance}} SAR</strong></td></tr><tr><td>Transport Allowance</td><td><strong>{{transportAllowance}} SAR</strong></td></tr><tr><td><strong>Total Monthly</strong></td><td><strong>{{totalSalary}} SAR</strong></td></tr></table>\n\nThis certificate is issued upon the employee\'s request.",
         ["employeeName","employeeId","position","department","basicSalary","housingAllowance","transportAllowance","totalSalary"]),
        ("experience_letter", "Experience Letter",
         "This is to certify that <strong>{{employeeName}}</strong> (Employee ID: {{employeeId}}) has been working with <strong>{{companyName}}</strong> since <strong>{{joinDate}}</strong> as <strong>{{position}}</strong> in the <strong>{{department}}</strong> department.\n\nDuring their tenure, they have demonstrated excellent professional conduct, dedication, and competence in their role. We wish them continued success in all their future endeavors.",
         ["employeeName","employeeId","position","department","joinDate","companyName"]),
        ("noc_letter", "No Objection Certificate",
         "This is to confirm that we have No Objection to <strong>{{employeeName}}</strong> (Employee ID: {{employeeId}}), currently employed as <strong>{{position}}</strong> in the <strong>{{department}}</strong> department{{#if purpose}}, for the purpose of {{purpose}}{{/if}}.\n\nThis NOC is issued at the employee\'s request and does not relieve them of their current contractual obligations with the organization.",
         ["employeeName","employeeId","position","department","purpose"]),
        ("bank_letter", "Bank Letter",
         "This is to confirm that <strong>{{employeeName}}</strong> (Employee ID: {{employeeId}}) is a full-time employee of <strong>{{companyName}}</strong>, serving as <strong>{{position}}</strong> in the <strong>{{department}}</strong> department since <strong>{{joinDate}}</strong>.\n\nThe employee\'s salary is credited monthly to their bank account via the Wage Protection System (WPS).\n\nTotal Monthly Salary: <strong>{{totalSalary}} SAR</strong>\n\nThis letter is issued for banking purposes at the employee\'s request.",
         ["employeeName","employeeId","position","department","joinDate","totalSalary","companyName"]),
        ("promotion_letter", "Promotion Letter",
         "We are pleased to confirm that <strong>{{employeeName}}</strong> (Employee ID: {{employeeId}}) has been promoted to the position of <strong>{{position}}</strong> in the <strong>{{department}}</strong> department, effective immediately.\n\nThis promotion is in recognition of their outstanding dedication, performance, and valuable contributions to <strong>{{companyName}}</strong>. We are confident they will continue to excel in their new role.",
         ["employeeName","employeeId","position","department","companyName"]),
    ]
    _default_header = json.dumps({
        "companyName": "MORABAHA MRNA",
        "companyNameAr": "",
        "subtitle": "Kingdom of Saudi Arabia",
        "logoUrl": "",
        "accentColor": "#10B981",
    })
    _default_footer = json.dumps({
        "signatoryName": "Authorized Signatory",
        "signatoryTitle": "Human Resources Department",
        "showRef": True,
        "showDate": True,
        "disclaimer": "This document is computer-generated and valid without a stamp.",
    })
    for _t_type, _t_name, _t_body, _t_vars in _templates:
        c.execute("""INSERT INTO letter_templates (type, name, body_html, header, footer, variables)
            VALUES (%s, %s, %s, %s::jsonb, %s::jsonb, %s)
            ON CONFLICT (type) DO NOTHING""",
            (_t_type, _t_name, _t_body, _default_header, _default_footer, _t_vars))
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
    "company": {
        "company_name_en": "Morabaha MRNA",
        "company_name_ar": "مرابحة مرنا",
        "cr_number": "",
        "mol_number": "",
        "gosi_reg_number": "",
        "vat_number": "",
        "address_en": "",
        "address_ar": "",
        "city": "Riyadh",
        "country": "Saudi Arabia",
        "phone": "",
        "email": "",
        "website": "",
        "legal_rep_name": "",
        "legal_rep_title": "CEO"
    },
    "leave": {
        "annual": 30, "sick": 30, "emergency": 5, "study": 15,
        "maternity": 70, "paternity": 3, "marriage": 5, "bereavement": 5, "hajj": 15,
        "max_carry_over": 5, "min_notice_days": 3,
        "approval_required": True, "allow_half_day": True, "allow_negative_balance": False
    },
    "loan": {
        "max_amount_multiplier": 2, "max_emi_percent": 33, "min_service_years": 1,
        "max_concurrent_loans": 1, "min_months_between": 6,
        "approval_required": True,
        "types": ["Interest-Free", "Advance Salary", "Personal", "Emergency"]
    },
    "attendance": {
        "work_start": "08:00", "work_end": "17:00", "late_threshold": "08:30",
        "standard_hours": 8, "max_overtime_hours": 4, "overtime_rate": 1.5,
        "overtime_approval": True, "grace_period_minutes": 15,
        "weekend_days": ["Friday", "Saturday"]
    },
    "ramadan": {
        "enabled": False,
        "start_date": "2026-02-28",
        "end_date": "2026-03-29",
        "work_start": "10:00",
        "work_end": "15:00",
        "standard_hours": 6,
        "apply_to_all": True
    },
    "payroll": {
        "pay_cycle": "monthly",
        "pay_day": 27,
        "currency": "SAR",
        "housing_pct_of_basic": 25,
        "transport_standard": 1500,
        "overtime_multiplier": 1.5,
        "bank_transfer_method": "bank_transfer",
        "wps_enabled": True
    },
    "holidays": {
        "national_day": True,
        "founding_day": True,
        "eid_al_fitr_days": 4,
        "eid_al_adha_days": 4,
        "custom_holidays": []
    },
    "travel": {
        "max_days": 30, "approval_required": True,
        "per_diem_chairman_intl": 3500, "per_diem_chairman_local": 2000,
        "per_diem_clevel_intl": 1750, "per_diem_clevel_local": 1200,
        "per_diem_other_intl": 1350, "per_diem_other_local": 900,
        "advance_allowed": True, "advance_max_percent": 80
    },
    "expenses": {
        "auto_approve_below": 200,
        "receipt_required_above": 100,
        "max_claim_per_category_year": 50000,
        "reimbursement_processing_days": 7,
        "categories_enabled": ["travel", "meals", "office_supplies", "training", "communication", "other"],
        "claim_types_enabled": ["medical", "dental", "vision", "education", "relocation", "other"]
    },
    "gosi": {
        "employee_rate": 9.75,
        "employer_rate": 11.75,
        "max_insurable_salary": 45000,
        "min_insurable_salary": 1500,
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
    "probation": {
        "probation_days": 90,
        "probation_extendable": True,
        "notice_unlimited": 60,
        "notice_fixed": 30,
        "notice_probation": 0,
        "notice_deduction": True
    },
    "documents": {
        "signatory_name": "",
        "signatory_title": "HR Director",
        "letter_prefix": "LTR",
        "auto_expiry_days": 90,
        "processing_days": 2
    },
    "iqama_visa": {
        "reminder_days_30": 30,
        "reminder_days_60": 60,
        "reminder_days_90": 90,
        "auto_escalation": True,
        "medical_insurance_mandatory": True,
        "iqama_renewal_cost": 650
    },
    "exit": {
        "clearance_departments": ["IT", "Finance", "HR", "Admin", "Security"],
        "notice_enforcement": True,
        "settlement_deadline_days": 7,
        "asset_return_checklist": ["Laptop", "ID Card", "Access Card", "Company Phone", "Parking Card"],
        "exit_interview_required": True
    },
    "recruitment": {
        "stages_enabled": ["hr_screening", "technical", "behavioral", "leadership"],
        "min_passing_score": 3,
        "max_interviews_per_candidate": 4,
        "offer_approval_required": True,
        "reference_check_required": True
    },
    "training": {
        "mandatory_deadline_days": 30,
        "annual_hours_required": 40,
        "budget_per_employee": 5000,
        "certification_reminder_days": 30,
        "compliance_target": 95
    },
    "grievance": {
        "categories": ["harassment", "discrimination", "safety", "policy", "compensation", "other"],
        "severity_levels": ["low", "medium", "high", "critical"],
        "sla_hours_low": 168,
        "sla_hours_medium": 72,
        "sla_hours_high": 24,
        "sla_hours_critical": 4,
        "escalation_enabled": True,
        "anonymous_allowed": False
    },
    "notifications": {
        "email_enabled": False,
        "whatsapp_enabled": False,
        "webhook_url": "",
        "notify_on_approval": True,
        "notify_on_rejection": True,
        "notify_manager_on_request": True,
        "daily_digest": False
    },
    "security": {
        "admin_employee_ids": ["E005"],
        "pin_min_length": 4,
        "session_timeout_minutes": 60,
        "max_login_attempts": 5,
        "lockout_duration_minutes": 15,
        "require_pin_change_days": 0
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
    log_audit("admin", "update_policy", "policy", category, {"keys": list(config.keys())})
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
    log_audit("manager", decision + "_leave", "leave", ref, {"employee": row.get("employee_name") if row else None})
    return row


# ── Document CRUD ───────────────────────────────────────


def create_document_request(emp_id, doc_type):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM document_requests")
    count = c.fetchone()[0]
    ref = f"DOC-2026-{count + 1:03d}"
    est = str(date.today() + timedelta(days=get_policy("documents.processing_days", 2)))
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
    _max_concurrent = get_policy("loan.max_concurrent_loans", 1)
    _existing_loans = get_employee_loans(emp_id)
    _active_loans = [l for l in _existing_loans if l.get("status") in ("active", "pending")]
    if len(_active_loans) >= _max_concurrent:
        return {"error": f"Max {_max_concurrent} concurrent loan(s). You have {len(_active_loans)} active."}
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
    log_audit(emp_id, "clock_in", "attendance", emp_id, {"time": now, "status": status})
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


# ── Announcement Read Tracking ──────────────────────────

def get_unread_login_announcements(employee_id):
    """Get announcements marked for login that this employee hasn't read."""
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT a.* FROM announcements a
        WHERE a.announce_on_login = TRUE AND a.is_active = TRUE
        AND a.id NOT IN (
            SELECT ar.announcement_id FROM announcement_reads ar
            WHERE ar.employee_id = %s AND ar.acknowledged = TRUE
        )
        ORDER BY a.priority = 'urgent' DESC, a.priority = 'important' DESC, a.created_at DESC
    """, (employee_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def mark_announcement_read(announcement_id, employee_id):
    """Mark an announcement as read (seen) by an employee."""
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO announcement_reads (announcement_id, employee_id, read_at)
        VALUES (%s, %s, NOW())
        ON CONFLICT (announcement_id, employee_id) DO UPDATE SET read_at = NOW()
    """, (announcement_id, employee_id))
    conn.commit()
    conn.close()
    return True


def acknowledge_announcement(announcement_id, employee_id):
    """Acknowledge an announcement (confirmed heard/read)."""
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        INSERT INTO announcement_reads (announcement_id, employee_id, read_at, acknowledged, acknowledged_at)
        VALUES (%s, %s, NOW(), TRUE, NOW())
        ON CONFLICT (announcement_id, employee_id)
        DO UPDATE SET acknowledged = TRUE, acknowledged_at = NOW()
    """, (announcement_id, employee_id))
    # Update the count on the announcement
    c.execute("""
        UPDATE announcements SET acknowledged_count = (
            SELECT COUNT(*) FROM announcement_reads WHERE announcement_id = %s AND acknowledged = TRUE
        ) WHERE id = %s
    """, (announcement_id, announcement_id))
    conn.commit()
    conn.close()
    return True


def get_announcement_reads(announcement_id):
    """Get all read/acknowledgment records for an announcement."""
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT ar.*, e.name as employee_name, e.department
        FROM announcement_reads ar
        JOIN employees e ON e.id = ar.employee_id
        WHERE ar.announcement_id = %s
        ORDER BY ar.read_at DESC
    """, (announcement_id,))
    rows = _fetchall(c)
    conn.close()
    return rows


def get_announcement_stats(announcement_id):
    """Get read/acknowledged stats for an announcement."""
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as total FROM employees")
    total = _fetchone(c)["total"]
    c.execute("SELECT COUNT(*) as read_count FROM announcement_reads WHERE announcement_id = %s", (announcement_id,))
    read_count = _fetchone(c)["read_count"]
    c.execute("SELECT COUNT(*) as ack_count FROM announcement_reads WHERE announcement_id = %s AND acknowledged = TRUE", (announcement_id,))
    ack_count = _fetchone(c)["ack_count"]
    conn.close()
    return {"total_employees": total, "read_count": read_count, "acknowledged_count": ack_count}


def set_announce_on_login(announcement_id, value=True):
    """Toggle announce_on_login flag."""
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE announcements SET announce_on_login = %s WHERE id = %s", (value, announcement_id))
    conn.commit()
    conn.close()
    return True


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




# ── Course Materials CRUD ───────────────────────────────

def get_course_materials(course_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM course_materials WHERE course_id = %s ORDER BY sort_order, id", (course_id,))
    rows = _fetchall(c)
    conn.close()
    return rows

def add_course_material(course_id, title, mat_type="link", url=None, content=None):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO course_materials (course_id, title, type, url, content) VALUES (%s,%s,%s,%s,%s) RETURNING id",
              (course_id, title, mat_type, url, content))
    mid = c.fetchone()[0]
    conn.commit()
    c.execute("SELECT * FROM course_materials WHERE id = %s", (mid,))
    row = _fetchone(c)
    conn.close()
    return row

def delete_course_material(material_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM course_materials WHERE id = %s", (material_id,))
    conn.commit()
    conn.close()


# ── Exam CRUD ───────────────────────────────────────────

def get_exams(course_id=None, exam_type=None):
    conn = get_db()
    c = conn.cursor()
    if course_id:
        c.execute("SELECT ce.*, tc.title as course_title, (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = ce.id) as question_count, (SELECT COUNT(*) FROM exam_attempts ea WHERE ea.exam_id = ce.id) as attempt_count FROM course_exams ce LEFT JOIN training_courses tc ON ce.course_id = tc.id WHERE ce.course_id = %s ORDER BY ce.id", (course_id,))
    elif exam_type:
        c.execute("SELECT ce.*, tc.title as course_title, (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = ce.id) as question_count, (SELECT COUNT(*) FROM exam_attempts ea WHERE ea.exam_id = ce.id) as attempt_count FROM course_exams ce LEFT JOIN training_courses tc ON ce.course_id = tc.id WHERE ce.exam_type = %s ORDER BY ce.id", (exam_type,))
    else:
        c.execute("SELECT ce.*, tc.title as course_title, (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = ce.id) as question_count, (SELECT COUNT(*) FROM exam_attempts ea WHERE ea.exam_id = ce.id) as attempt_count FROM course_exams ce LEFT JOIN training_courses tc ON ce.course_id = tc.id ORDER BY ce.id")
    rows = _fetchall(c)
    conn.close()
    return rows

def create_exam(course_id, title, description="", passing_score=70, time_limit=30, max_attempts=3, exam_type="training"):
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO course_exams (course_id, title, description, passing_score, time_limit_minutes, max_attempts, exam_type)
        VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
        (course_id, title, description, passing_score, time_limit, max_attempts, exam_type))
    eid = c.fetchone()[0]
    conn.commit()
    conn.close()
    return {"id": eid, "title": title}

def get_exam_with_questions(exam_id, include_answers=False):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM course_exams WHERE id = %s", (exam_id,))
    exam = _fetchone(c)
    if not exam:
        conn.close()
        return None
    c.execute("SELECT * FROM exam_questions WHERE exam_id = %s ORDER BY sort_order, id", (exam_id,))
    questions = _fetchall(c)
    conn.close()
    if not include_answers:
        for q in questions:
            q.pop("correct_answer", None)
            q.pop("explanation", None)
    exam["questions"] = questions
    return exam

def add_exam_question(exam_id, question, options, correct_answer, explanation="", question_type="mcq", points=1):
    import json
    conn = get_db()
    c = conn.cursor()
    opts_json = json.dumps(options) if isinstance(options, list) else options
    c.execute("""INSERT INTO exam_questions (exam_id, question, question_type, options, correct_answer, explanation, points)
        VALUES (%s,%s,%s,%s::JSONB,%s,%s,%s) RETURNING id""",
        (exam_id, question, question_type, opts_json, correct_answer, explanation, points))
    qid = c.fetchone()[0]
    conn.commit()
    conn.close()
    return {"id": qid}

def delete_exam_question(question_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM exam_questions WHERE id = %s", (question_id,))
    conn.commit()
    conn.close()

def update_exam_question(question_id, question=None, options=None, correct_answer=None, explanation=None):
    import json
    conn = get_db()
    c = conn.cursor()
    if question: c.execute("UPDATE exam_questions SET question = %s WHERE id = %s", (question, question_id))
    if options: c.execute("UPDATE exam_questions SET options = %s::JSONB WHERE id = %s", (json.dumps(options), question_id))
    if correct_answer: c.execute("UPDATE exam_questions SET correct_answer = %s WHERE id = %s", (correct_answer, question_id))
    if explanation is not None: c.execute("UPDATE exam_questions SET explanation = %s WHERE id = %s", (explanation, question_id))
    conn.commit()
    conn.close()

def start_exam_attempt(exam_id, participant_id, participant_type="employee", participant_name=""):
    conn = get_db()
    c = conn.cursor()
    # Check max attempts
    c.execute("SELECT max_attempts FROM course_exams WHERE id = %s", (exam_id,))
    exam = c.fetchone()
    if not exam:
        conn.close()
        return {"error": "Exam not found"}
    c.execute("SELECT COUNT(*) FROM exam_attempts WHERE exam_id = %s AND participant_id = %s", (exam_id, participant_id))
    attempts = c.fetchone()[0]
    if exam[0] > 0 and attempts >= exam[0]:
        conn.close()
        return {"error": f"Maximum attempts ({exam[0]}) reached"}
    c.execute("""INSERT INTO exam_attempts (exam_id, participant_id, participant_type, participant_name)
        VALUES (%s,%s,%s,%s) RETURNING id""", (exam_id, participant_id, participant_type, participant_name))
    aid = c.fetchone()[0]
    conn.commit()
    conn.close()
    return {"attempt_id": aid, "attempt_number": attempts + 1}

def submit_exam(attempt_id, answers):
    import json
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT ea.*, ce.passing_score FROM exam_attempts ea JOIN course_exams ce ON ea.exam_id = ce.id WHERE ea.id = %s", (attempt_id,))
    attempt = _fetchone(c)
    if not attempt:
        conn.close()
        return {"error": "Attempt not found"}
    # Get questions with answers
    c.execute("SELECT * FROM exam_questions WHERE exam_id = %s ORDER BY sort_order, id", (attempt["exam_id"],))
    questions = _fetchall(c)
    # Grade
    total_points = sum(q["points"] for q in questions)
    earned = 0
    results = []
    for q in questions:
        user_answer = answers.get(str(q["id"]), "")
        correct = user_answer.strip().lower() == q["correct_answer"].strip().lower()
        if correct:
            earned += q["points"]
        results.append({"question_id": q["id"], "question": q["question"], "user_answer": user_answer, "correct_answer": q["correct_answer"], "correct": correct, "explanation": q.get("explanation", ""), "points": q["points"]})
    score = round((earned / total_points * 100) if total_points > 0 else 0, 1)
    passed = 1 if score >= attempt["passing_score"] else 0
    c.execute("UPDATE exam_attempts SET answers = %s::JSONB, score = %s, passed = %s, completed_at = NOW()::TEXT WHERE id = %s",
              (json.dumps(answers), score, passed, attempt_id))
    conn.commit()
    conn.close()
    return {"score": score, "passed": bool(passed), "passing_score": attempt["passing_score"], "earned_points": earned, "total_points": total_points, "results": results}

def get_exam_attempts(exam_id=None, participant_id=None):
    conn = get_db()
    c = conn.cursor()
    if exam_id and participant_id:
        c.execute("SELECT ea.*, ce.title as exam_title FROM exam_attempts ea JOIN course_exams ce ON ea.exam_id = ce.id WHERE ea.exam_id = %s AND ea.participant_id = %s ORDER BY ea.id DESC", (exam_id, participant_id))
    elif exam_id:
        c.execute("SELECT ea.*, ce.title as exam_title FROM exam_attempts ea JOIN course_exams ce ON ea.exam_id = ce.id WHERE ea.exam_id = %s ORDER BY ea.id DESC", (exam_id,))
    elif participant_id:
        c.execute("SELECT ea.*, ce.title as exam_title FROM exam_attempts ea JOIN course_exams ce ON ea.exam_id = ce.id WHERE ea.participant_id = %s ORDER BY ea.id DESC", (participant_id,))
    else:
        c.execute("SELECT ea.*, ce.title as exam_title FROM exam_attempts ea JOIN course_exams ce ON ea.exam_id = ce.id ORDER BY ea.id DESC LIMIT 50")
    rows = _fetchall(c)
    conn.close()
    return rows

def delete_exam(exam_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM exam_attempts WHERE exam_id = %s", (exam_id,))
    c.execute("DELETE FROM exam_questions WHERE exam_id = %s", (exam_id,))
    c.execute("DELETE FROM course_exams WHERE id = %s", (exam_id,))
    conn.commit()
    conn.close()

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
    _auto_t = get_policy("expenses.auto_approve_below", 0)
    if _auto_t and amount <= _auto_t:
        _conn2 = get_db()
        _c2 = _conn2.cursor()
        _c2.execute("UPDATE expenses SET status = %s WHERE ref = %s", ("approved", ref))
        _conn2.commit()
        _conn2.close()
    _create_notification(employee_id, "expense", "Expense Submitted", f"Your expense {ref} for {amount} SAR has been submitted.")
    log_audit(employee_id, "create_expense", "expense", ref, {"amount": amount, "category": category})
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
        # Push notification via webhook if configured
        _push_notification(employee_id, title, message)
    except Exception:
        pass


def _push_notification(employee_id, title, message):
    """Send push notification via webhook (WhatsApp, email, etc)."""
    webhook_url = os.getenv("NOTIFICATION_WEBHOOK_URL")
    if not webhook_url:
        return
    try:
        import urllib.request
        data = json.dumps({
            "employee_id": employee_id,
            "title": title,
            "message": message,
            "timestamp": str(datetime.now()),
        }).encode("utf-8")
        req = urllib.request.Request(webhook_url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass  # Don't block on notification failure



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

    # Build content data (ref assigned after INSERT to avoid UniqueViolation)
    content_data = {
        "employee_name": emp["name"],
        "employee_name_ar": emp.get("name_ar", ""),
        "employee_id": employee_id,
        "position": emp.get("position", ""),
        "department": emp.get("department", ""),
        "join_date": str(emp.get("join_date", "")),
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
        VALUES ('TMP',%s,%s,%s,%s,%s,%s,'issued') RETURNING id""",
        (employee_id, letter_type, purpose, language, addressed_to or "To Whom It May Concern",
         json.dumps(content_data)))
    row_id = c.fetchone()[0]
    ref = f"LTR-{date.today().year}-{row_id:03d}"
    c.execute("UPDATE letters SET ref=%s WHERE id=%s", (ref, row_id))
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

    c.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM exit_requests")
    next_id = c.fetchone()[0]
    ref = f"EXIT-{date.today().year}-{next_id:03d}"

    if not last_working_day:
        _notice_days = get_policy("probation.notice_unlimited", 60)
        last_working_day = str(date.today() + timedelta(days=_notice_days))

    # Clearance checklist
    _clearance_depts = get_policy("exit.clearance_departments", ["IT", "Finance", "HR", "Admin", "Security"])
    _checklist = get_policy("exit.asset_return_checklist", ["Laptop", "ID Card", "Access Card"])
    clearance = {}
    for dept in _clearance_depts:
        clearance[dept.lower().replace(" ", "_") + "_clearance"] = "pending"
    clearance["knowledge_transfer"] = "pending"
    clearance["manager_signoff"] = "pending" 

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
    log_audit(employee_id, "initiate_exit", "exit", ref, {"type": exit_type, "last_day": last_working_day})
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


# ============================================================
# AUDIT LOG
# ============================================================

def log_audit(actor_id, action, entity_type=None, entity_id=None, details=None):
    """Record an audit trail entry."""
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details)
        VALUES (%s, %s, %s, %s, %s)""",
        (actor_id, action, entity_type, entity_id, json.dumps(details or {})))
    conn.commit()
    conn.close()


def get_audit_log(limit=50, entity_type=None, entity_id=None, actor_id=None):
    """Retrieve audit log entries with optional filters."""
    conn = get_db()
    c = conn.cursor()
    query = "SELECT * FROM audit_log WHERE 1=1"
    params = []
    if entity_type:
        query += " AND entity_type = %s"
        params.append(entity_type)
    if entity_id:
        query += " AND entity_id = %s"
        params.append(entity_id)
    if actor_id:
        query += " AND actor_id = %s"
        params.append(actor_id)
    query += " ORDER BY timestamp DESC LIMIT %s"
    params.append(limit)
    c.execute(query, tuple(params))
    rows = _fetchall(c)
    conn.close()
    return rows


# ============================================================
# BULK OPERATIONS
# ============================================================

def bulk_approve_leaves(approver_id, leave_ids):
    """Approve multiple leave requests at once."""
    conn = get_db()
    c = conn.cursor()
    approved = []
    failed = []
    for lid in leave_ids:
        try:
            c.execute("UPDATE leave_requests SET status = 'approved', approved_by = %s WHERE id = %s AND status = 'pending' RETURNING id, employee_id, ref",
                (approver_id, lid))
            row = c.fetchone()
            if row:
                approved.append({"id": row[0], "employee_id": row[1], "ref": row[2]})
                log_audit(approver_id, "bulk_approve_leave", "leave", str(row[0]), {"ref": row[2]})
            else:
                failed.append({"id": lid, "reason": "Not found or not pending"})
        except Exception as e:
            failed.append({"id": lid, "reason": str(e)})
    conn.commit()
    conn.close()
    return {"approved": len(approved), "failed": len(failed), "details": {"approved": approved, "failed": failed}}


def bulk_approve_expenses(approver_id, expense_ids):
    """Approve multiple expenses at once."""
    conn = get_db()
    c = conn.cursor()
    approved = []
    failed = []
    for eid in expense_ids:
        try:
            c.execute("UPDATE expenses SET status = 'approved', approver_id = %s WHERE id = %s AND status = 'pending' RETURNING id, ref, employee_id, amount",
                (approver_id, eid))
            row = c.fetchone()
            if row:
                approved.append({"id": row[0], "ref": row[1], "employee_id": row[2], "amount": float(row[3])})
                log_audit(approver_id, "bulk_approve_expense", "expense", str(row[0]), {"ref": row[1], "amount": float(row[3])})
            else:
                failed.append({"id": eid, "reason": "Not found or not pending"})
        except Exception as e:
            failed.append({"id": eid, "reason": str(e)})
    conn.commit()
    conn.close()
    return {"approved": len(approved), "failed": len(failed), "details": {"approved": approved, "failed": failed}}


def bulk_import_employees(employees_data):
    """Import employees from a list of dicts. Returns success/fail counts.
    Each dict should have: id, name, position, department, email, phone, basic_salary, housing_allowance, transport_allowance, join_date, nationality, manager_id (optional).
    """
    conn = get_db()
    c = conn.cursor()
    imported = []
    failed = []
    for emp in employees_data:
        try:
            eid = emp.get("id") or emp.get("employee_id")
            name = emp.get("name")
            if not eid or not name:
                failed.append({"data": emp, "reason": "Missing id or name"})
                continue
            salary = json.dumps({
                "basic": float(emp.get("basic_salary", 0)),
                "housing": float(emp.get("housing_allowance", 0)),
                "transport": float(emp.get("transport_allowance", 0)),
            })
            leave_balance = json.dumps({
                "annual": int(emp.get("annual_leave", 21)),
                "sick": int(emp.get("sick_leave", 30)),
                "personal": int(emp.get("personal_leave", 5)),
            })
            c.execute("""INSERT INTO employees (id, name, email, phone, position, department, join_date, salary, leave_balance, nationality, manager_id, status, pin)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'active',%s)
                ON CONFLICT (id) DO NOTHING RETURNING id""",
                (eid, name, emp.get("email",""), emp.get("phone",""),
                 emp.get("position","Staff"), emp.get("department","General"),
                 emp.get("join_date", str(date.today())),
                 salary, leave_balance,
                 emp.get("nationality","Saudi"),
                 emp.get("manager_id"),
                 emp.get("pin","1234")))
            row = c.fetchone()
            if row:
                imported.append(eid)
                log_audit("SYSTEM", "bulk_import_employee", "employee", eid, {"name": name})
            else:
                failed.append({"id": eid, "reason": "Duplicate ID"})
        except Exception as e:
            failed.append({"id": emp.get("id","?"), "reason": str(e)})
    conn.commit()
    conn.close()
    return {"imported": len(imported), "failed": len(failed), "details": {"imported": imported, "failed": failed}}


# ============================================================
# NOTIFICATION DELIVERY
# ============================================================

def get_pending_notifications(limit=20):
    """Get unread notifications for delivery."""
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT n.*, e.email, e.phone, e.name as employee_name
        FROM notifications n
        JOIN employees e ON n.employee_id = e.id
        WHERE n.is_read = FALSE
        ORDER BY n.created_at DESC LIMIT %s""", (limit,))
    rows = _fetchall(c)
    conn.close()
    return rows


def mark_notifications_delivered(notification_ids, channel="whatsapp"):
    """Mark notifications as delivered via a channel."""
    conn = get_db()
    c = conn.cursor()
    for nid in notification_ids:
        c.execute("UPDATE notifications SET is_read = TRUE WHERE id = %s", (nid,))
        log_audit("SYSTEM", "notification_delivered", "notification", str(nid), {"channel": channel})
    conn.commit()

    # --- Seed Geofences ---
    _geofences = [
        ("MRNA HQ - Riyadh", "Main office headquarters", 24.7136, 46.6753, 300, "King Fahd Road, Riyadh"),
        ("MRNA Branch - Jeddah", "Jeddah branch office", 21.5433, 39.1728, 200, "Tahlia Street, Jeddah"),
        ("MRNA Branch - Dammam", "Eastern Province office", 26.3927, 50.1146, 200, "Prince Mohammed Bin Fahd Rd, Dammam"),
    ]
    for _g_name, _g_desc, _g_lat, _g_lng, _g_rad, _g_addr in _geofences:
        c.execute("""INSERT INTO geofences (name, description, latitude, longitude, radius_meters, address)
            VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING""",
            (_g_name, _g_desc, _g_lat, _g_lng, _g_rad, _g_addr))

    # --- Seed Approval Workflows ---
    _workflows = [
        ("leave_approval", "leave_request", "Leave Request Approval",
         json.dumps([
             {"step": 1, "role": "direct_manager", "label": "Direct Manager", "action": "approve"},
             {"step": 2, "role": "hr_manager", "label": "HR Manager", "action": "approve"},
         ])),
        ("expense_approval", "expense", "Expense Approval",
         json.dumps([
             {"step": 1, "role": "direct_manager", "label": "Direct Manager", "action": "approve"},
             {"step": 2, "role": "finance", "label": "Finance Department", "action": "approve", "condition": "amount > 5000"},
             {"step": 3, "role": "hr_manager", "label": "HR Final Approval", "action": "approve", "condition": "amount > 10000"},
         ])),
        ("loan_approval", "loan", "Loan Request Approval",
         json.dumps([
             {"step": 1, "role": "direct_manager", "label": "Direct Manager", "action": "approve"},
             {"step": 2, "role": "hr_manager", "label": "HR Manager", "action": "approve"},
             {"step": 3, "role": "cfo", "label": "CFO / Finance Head", "action": "approve"},
         ])),
        ("exit_approval", "exit_request", "Exit/Offboarding Approval",
         json.dumps([
             {"step": 1, "role": "direct_manager", "label": "Direct Manager", "action": "approve"},
             {"step": 2, "role": "hr_manager", "label": "HR Manager", "action": "approve"},
             {"step": 3, "role": "it_admin", "label": "IT (Asset Recovery)", "action": "clearance"},
             {"step": 4, "role": "finance", "label": "Finance (Final Settlement)", "action": "clearance"},
         ])),
    ]
    for _w_name, _w_type, _w_desc, _w_steps in _workflows:
        c.execute("""INSERT INTO approval_workflows (name, entity_type, description, steps)
            VALUES (%s,%s,%s,%s::jsonb) ON CONFLICT (name) DO NOTHING""",
            (_w_name, _w_type, _w_desc, _w_steps))

    # --- Seed Job Postings ---
    _jobs = [
        ("JOB-2026-001", "Senior Software Engineer", "Information Technology",
         "Lead development of enterprise applications and mentor junior developers.",
         "5+ years Python/TypeScript, cloud architecture, team leadership",
         "15,000 - 25,000 SAR", "Riyadh", "full_time", "open", "E003"),
        ("JOB-2026-002", "HR Business Partner", "Human Resources",
         "Partner with business units to drive HR strategy and employee engagement.",
         "3+ years HR experience, SHRM certification preferred",
         "12,000 - 18,000 SAR", "Riyadh", "full_time", "open", "E002"),
        ("JOB-2026-003", "Data Analyst (Contract)", "Finance",
         "Analyze financial data and create dashboards for executive reporting.",
         "SQL, Power BI/Tableau, financial modeling",
         "10,000 - 15,000 SAR", "Jeddah", "contract", "open", "E005"),
    ]
    for _j in _jobs:
        c.execute("""INSERT INTO job_postings (ref, title, department, description, requirements, salary_range, location, employment_type, status, posted_by)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (ref) DO NOTHING""", _j)

    # --- Seed Applications ---
    _apps = [
        ("APP-2026-001", 1, "Omar Al-Zahrani", "omar.z@email.com", "+966501234567", "screening", "applied", 0),
        ("APP-2026-002", 1, "Sara Al-Ghamdi", "sara.g@email.com", "+966509876543", "interview", "shortlisted", 78),
        ("APP-2026-003", 2, "Noura Al-Qahtani", "noura.q@email.com", "+966507654321", "screening", "applied", 0),
        ("APP-2026-004", 1, "Faisal Al-Harbi", "faisal.h@email.com", "+966504567890", "offer", "offered", 92),
    ]
    for _a in _apps:
        c.execute("""INSERT INTO applications (ref, job_id, candidate_name, candidate_email, candidate_phone, stage, status, score)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (ref) DO NOTHING""", _a)

    conn.commit()

    conn.close()
    return {"marked": len(notification_ids)}


# ============================================================
# LETTER TEMPLATES
# ============================================================

def get_letter_templates():
    """Get all letter templates."""
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM letter_templates WHERE is_active = TRUE ORDER BY name")
    rows = _fetchall(c)
    conn.close()
    return rows


def get_letter_template(template_type):
    """Get a specific letter template by type."""
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM letter_templates WHERE type = %s AND is_active = TRUE", (template_type,))
    row = _fetchone(c)
    conn.close()
    return row


def update_letter_template(template_type, updates, updated_by="admin"):
    """Update a letter template. updates is a dict with optional keys:
    name, body_html, body_html_ar, header, footer, variables."""
    conn = get_db()
    c = conn.cursor()
    sets = []
    params = []
    for key in ["name", "name_ar", "body_html", "body_html_ar"]:
        if key in updates:
            sets.append(f"{key} = %s")
            params.append(updates[key])
    for key in ["header", "footer"]:
        if key in updates:
            sets.append(f"{key} = %s::jsonb")
            params.append(json.dumps(updates[key]))
    if "variables" in updates:
        sets.append("variables = %s")
        params.append(updates["variables"])
    sets.append("updated_at = NOW()")
    sets.append("updated_by = %s")
    params.append(updated_by)
    params.append(template_type)
    c.execute(f"UPDATE letter_templates SET {', '.join(sets)} WHERE type = %s", tuple(params))
    conn.commit()
    conn.close()
    log_audit(updated_by, "update_letter_template", "template", template_type, {"fields": list(updates.keys())})
    return get_letter_template(template_type)


def create_letter_template(template_type, name, body_html, variables=None, header=None, footer=None):
    """Create a new custom letter template."""
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO letter_templates (type, name, body_html, variables, header, footer)
        VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb) RETURNING id""",
        (template_type, name, body_html, variables or [],
         json.dumps(header or {}), json.dumps(footer or {})))
    conn.commit()
    row_id = c.fetchone()[0]
    conn.close()
    log_audit("admin", "create_letter_template", "template", template_type, {"name": name})
    return {"id": row_id, "type": template_type}


# ============================================================
# RECRUITMENT PIPELINE
# ============================================================

def get_job_postings(status=None):
    conn = get_db()
    c = conn.cursor()
    if status:
        c.execute("SELECT * FROM job_postings WHERE status=%s ORDER BY created_at DESC", (status,))
    else:
        c.execute("SELECT * FROM job_postings ORDER BY created_at DESC")
    rows = _fetchall(c)
    conn.close()
    return rows


def get_job_posting(job_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM job_postings WHERE id=%s", (job_id,))
    row = _fetchone(c)
    conn.close()
    return row


def get_job_posting_by_ref(ref):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM job_postings WHERE ref=%s", (ref,))
    row = _fetchone(c)
    conn.close()
    return row


def create_job_posting(title, department, description="", requirements="", salary_range="", location="Riyadh", employment_type="full_time", posted_by=None, deadline=None):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO job_postings (ref, title, department, description, requirements, salary_range, location, employment_type, posted_by, deadline) VALUES ('TMP-' || gen_random_uuid()::text, %s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
        (title, department, description, requirements, salary_range, location, employment_type, posted_by, deadline))
    row_id = c.fetchone()[0]
    ref = f"JOB-{date.today().year}-{row_id:03d}"
    c.execute("UPDATE job_postings SET ref=%s WHERE id=%s", (ref, row_id))
    conn.commit()
    conn.close()
    return {"id": row_id, "ref": ref}


def update_job_posting(job_id, updates):
    conn = get_db()
    c = conn.cursor()
    sets = []
    params = []
    for key in ["title", "department", "description", "requirements", "salary_range", "location", "employment_type", "status", "deadline"]:
        if key in updates:
            sets.append(f"{key} = %s")
            params.append(updates[key])
    if sets:
        sets.append("updated_at = NOW()")
        params.append(job_id)
        c.execute(f"UPDATE job_postings SET {', '.join(sets)} WHERE id = %s", tuple(params))
        conn.commit()
    conn.close()


def get_applications(job_id=None, stage=None, status=None):
    conn = get_db()
    c = conn.cursor()
    conditions = []
    params = []
    if job_id:
        conditions.append("a.job_id = %s")
        params.append(job_id)
    if stage:
        conditions.append("a.stage = %s")
        params.append(stage)
    if status:
        conditions.append("a.status = %s")
        params.append(status)
    where = " AND ".join(conditions) if conditions else "1=1"
    c.execute(f"""SELECT a.*, j.title as job_title, j.department as job_department
        FROM applications a LEFT JOIN job_postings j ON a.job_id = j.id
        WHERE {where} ORDER BY a.created_at DESC""", tuple(params))
    rows = _fetchall(c)
    conn.close()
    return rows


def get_application(app_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT a.*, j.title as job_title, j.department as job_department
        FROM applications a LEFT JOIN job_postings j ON a.job_id = j.id WHERE a.id=%s""", (app_id,))
    row = _fetchone(c)
    conn.close()
    return row


def create_application(job_id, candidate_name, candidate_email="", candidate_phone="", resume_url="", cover_letter=""):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO applications (ref, job_id, candidate_name, candidate_email, candidate_phone, resume_url, cover_letter) VALUES ('TMP-' || gen_random_uuid()::text, %s,%s,%s,%s,%s,%s) RETURNING id",
        (job_id, candidate_name, candidate_email, candidate_phone, resume_url, cover_letter))
    row_id = c.fetchone()[0]
    ref = f"APP-{date.today().year}-{row_id:03d}"
    c.execute("UPDATE applications SET ref=%s WHERE id=%s", (ref, row_id))
    conn.commit()
    conn.close()
    return {"id": row_id, "ref": ref}


def update_application(app_id, updates):
    conn = get_db()
    c = conn.cursor()
    sets = []
    params = []
    for key in ["status", "stage", "score", "reviewed_by", "interview_id"]:
        if key in updates:
            sets.append(f"{key} = %s")
            params.append(updates[key])
    if "notes" in updates:
        sets.append("notes = %s::jsonb")
        params.append(json.dumps(updates["notes"]))
    if sets:
        sets.append("updated_at = NOW()")
        params.append(app_id)
        c.execute(f"UPDATE applications SET {', '.join(sets)} WHERE id = %s", tuple(params))
        conn.commit()
    conn.close()


def get_recruitment_stats():
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status='open' THEN 1 ELSE 0 END) as open_jobs,
        SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END) as closed_jobs
        FROM job_postings""")
    jobs = _fetchone(c)
    c.execute("""SELECT
        COUNT(*) as total_apps,
        SUM(CASE WHEN stage='screening' THEN 1 ELSE 0 END) as screening,
        SUM(CASE WHEN stage='interview' THEN 1 ELSE 0 END) as interviewing,
        SUM(CASE WHEN stage='offer' THEN 1 ELSE 0 END) as offer,
        SUM(CASE WHEN stage='hired' THEN 1 ELSE 0 END) as hired,
        SUM(CASE WHEN stage='rejected' THEN 1 ELSE 0 END) as rejected
        FROM applications""")
    apps = _fetchone(c)
    conn.close()
    return {"jobs": jobs, "applications": apps}


# ============================================================
# GEOFENCING / GPS ATTENDANCE
# ============================================================

def get_geofences():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM geofences WHERE is_active = TRUE ORDER BY name")
    rows = _fetchall(c)
    conn.close()
    return rows


def get_geofence(fence_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM geofences WHERE id=%s", (fence_id,))
    row = _fetchone(c)
    conn.close()
    return row


def create_geofence(name, latitude, longitude, radius_meters=200, description="", address=""):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO geofences (name, latitude, longitude, radius_meters, description, address) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
        (name, latitude, longitude, radius_meters, description, address))
    row_id = c.fetchone()[0]
    conn.commit()
    conn.close()
    return {"id": row_id, "name": name}


def update_geofence(fence_id, updates):
    conn = get_db()
    c = conn.cursor()
    sets = []
    params = []
    for key in ["name", "latitude", "longitude", "radius_meters", "description", "address", "is_active"]:
        if key in updates:
            sets.append(f"{key} = %s")
            params.append(updates[key])
    if sets:
        params.append(fence_id)
        c.execute(f"UPDATE geofences SET {', '.join(sets)} WHERE id = %s", tuple(params))
        conn.commit()
    conn.close()


def validate_location(latitude, longitude):
    """Check if given lat/lng is within any active geofence. Returns (bool, geofence_name or None, distance_meters)."""
    import math
    fences = get_geofences()
    for fence in fences:
        # Haversine formula
        R = 6371000  # Earth radius in meters
        lat1 = math.radians(latitude)
        lat2 = math.radians(fence["latitude"])
        dlat = math.radians(fence["latitude"] - latitude)
        dlng = math.radians(fence["longitude"] - longitude)
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c_val = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c_val
        if distance <= fence["radius_meters"]:
            return True, fence["name"], round(distance)
    return False, None, None


def clock_in_with_location(employee_id, latitude=None, longitude=None):
    """Clock in with optional GPS validation."""
    conn = get_db()
    c = conn.cursor()
    today = str(date.today())
    
    # Check existing record
    c.execute("SELECT * FROM attendance_records WHERE employee_id=%s AND date=%s", (employee_id, today))
    existing = _fetchone(c)
    if existing and existing.get("clock_in"):
        conn.close()
        return {"error": "Already clocked in today"}
    
    location_data = {}
    if latitude is not None and longitude is not None:
        valid, fence_name, distance = validate_location(latitude, longitude)
        location_data = {
            "latitude": latitude,
            "longitude": longitude,
            "geofence_valid": valid,
            "geofence_name": fence_name,
            "distance_meters": distance
        }
        # Check geofencing policy
        policy = get_policy("attendance.require_geofence")
        if policy and not valid:
            conn.close()
            return {"error": f"You are not within any registered office location. Please clock in from an approved location.", "location": location_data}
    
    now = datetime.now().strftime("%H:%M:%S")
    if existing:
        c.execute("UPDATE attendance_records SET clock_in=%s, status='present', location_data=%s::jsonb, updated_at=NOW() WHERE employee_id=%s AND date=%s",
            (now, json.dumps(location_data), employee_id, today))
    else:
        c.execute("INSERT INTO attendance_records (employee_id, date, clock_in, status, location_data) VALUES (%s,%s,%s,'present',%s::jsonb)",
            (employee_id, today, now, json.dumps(location_data)))
    conn.commit()
    conn.close()
    log_audit(employee_id, "clock_in", "attendance", employee_id, location_data)
    return {"success": True, "time": now, "location": location_data}


def clock_out_with_location(employee_id, latitude=None, longitude=None):
    """Clock out with optional GPS validation."""
    conn = get_db()
    c = conn.cursor()
    today = str(date.today())
    c.execute("SELECT * FROM attendance_records WHERE employee_id=%s AND date=%s", (employee_id, today))
    existing = _fetchone(c)
    if not existing or not existing.get("clock_in"):
        conn.close()
        return {"error": "No clock-in record for today"}
    
    location_data = {}
    if latitude is not None and longitude is not None:
        valid, fence_name, distance = validate_location(latitude, longitude)
        location_data = {"latitude": latitude, "longitude": longitude, "geofence_valid": valid, "geofence_name": fence_name, "distance_meters": distance}
    
    now = datetime.now().strftime("%H:%M:%S")
    # Calculate hours worked
    clock_in = existing["clock_in"]
    if isinstance(clock_in, str):
        h, m, s = map(int, clock_in.split(":"))
        cin = timedelta(hours=h, minutes=m, seconds=s)
    else:
        cin = timedelta(hours=clock_in.hour, minutes=clock_in.minute, seconds=clock_in.second)
    h2, m2, s2 = map(int, now.split(":"))
    cout = timedelta(hours=h2, minutes=m2, seconds=s2)
    hours = round((cout - cin).total_seconds() / 3600, 2)
    
    c.execute("UPDATE attendance_records SET clock_out=%s, hours_worked=%s, location_data=%s::jsonb, updated_at=NOW() WHERE employee_id=%s AND date=%s",
        (now, hours, json.dumps(location_data), employee_id, today))
    conn.commit()
    conn.close()
    log_audit(employee_id, "clock_out", "attendance", employee_id, location_data)
    return {"success": True, "time": now, "hours": hours, "location": location_data}


# ============================================================
# MULTI-LEVEL APPROVAL WORKFLOWS
# ============================================================

def get_approval_workflows():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM approval_workflows WHERE is_active = TRUE ORDER BY name")
    rows = _fetchall(c)
    conn.close()
    return rows


def get_approval_workflow(name):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM approval_workflows WHERE name=%s AND is_active=TRUE", (name,))
    row = _fetchone(c)
    conn.close()
    return row


def create_approval_request(workflow_name, entity_type, entity_id, entity_ref, requester_id):
    """Create a new multi-level approval request."""
    workflow = get_approval_workflow(workflow_name)
    if not workflow:
        return {"error": f"Workflow '{workflow_name}' not found"}
    
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO approval_requests (ref, workflow_id, entity_type, entity_id, entity_ref, requester_id, current_step, steps_log)
        VALUES ('TMP-' || gen_random_uuid()::text, %s, %s, %s, %s, %s, 0, '[]'::jsonb) RETURNING id""",
        (workflow["id"], entity_type, entity_id, entity_ref, requester_id))
    row_id = c.fetchone()[0]
    ref = f"APR-{date.today().year}-{row_id:03d}"
    c.execute("UPDATE approval_requests SET ref=%s WHERE id=%s", (ref, row_id))
    conn.commit()
    conn.close()
    return {"id": row_id, "ref": ref, "workflow": workflow["name"], "total_steps": len(workflow["steps"])}


def get_approval_request(ref):
    conn = get_db()
    c = conn.cursor()
    c.execute("""SELECT ar.*, aw.name as workflow_name, aw.steps as workflow_steps, aw.description as workflow_description
        FROM approval_requests ar JOIN approval_workflows aw ON ar.workflow_id = aw.id WHERE ar.ref=%s""", (ref,))
    row = _fetchone(c)
    conn.close()
    return row


def get_pending_approvals(approver_id):
    """Get all pending approval requests where the current step's role matches the approver."""
    conn = get_db()
    c = conn.cursor()
    # Get approver's role info
    emp = get_employee(approver_id)
    if not emp:
        conn.close()
        return []
    
    c.execute("""SELECT ar.*, aw.name as workflow_name, aw.steps as workflow_steps, aw.description as workflow_description
        FROM approval_requests ar JOIN approval_workflows aw ON ar.workflow_id = aw.id
        WHERE ar.status = 'pending' ORDER BY ar.created_at DESC""")
    all_pending = _fetchall(c)
    conn.close()
    
    # Filter: check if current step matches approver's role
    result = []
    emp_dept = (emp.get("department") or "").lower()
    emp_pos = (emp.get("position") or "").lower()
    is_hr = "hr" in emp_dept or "human" in emp_dept
    is_finance = "finance" in emp_dept
    is_it = "it" in emp_dept or "information" in emp_dept or "technology" in emp_dept
    is_manager = emp.get("role") == "manager" or emp.get("role") == "admin"
    
    for req in all_pending:
        steps = req.get("workflow_steps", [])
        if isinstance(steps, str):
            steps = json.loads(steps)
        current = req.get("current_step", 0)
        if current >= len(steps):
            continue
        step = steps[current]
        role = step.get("role", "")
        # Role matching
        if role == "direct_manager" and is_manager:
            result.append(req)
        elif role == "hr_manager" and is_hr:
            result.append(req)
        elif role == "finance" and is_finance:
            result.append(req)
        elif role == "it_admin" and is_it:
            result.append(req)
        elif role == "cfo" and is_finance and is_manager:
            result.append(req)
    
    return result


def approve_step(approval_ref, approver_id, action="approve", comment=""):
    """Approve or reject the current step of an approval request."""
    conn = get_db()
    c = conn.cursor()
    
    req = get_approval_request(approval_ref)
    if not req:
        conn.close()
        return {"error": "Approval request not found"}
    if req["status"] != "pending":
        conn.close()
        return {"error": f"Request is already {req['status']}"}
    
    steps = req.get("workflow_steps", [])
    if isinstance(steps, str):
        steps = json.loads(steps)
    current = req.get("current_step", 0)
    steps_log = req.get("steps_log", [])
    if isinstance(steps_log, str):
        steps_log = json.loads(steps_log)
    
    if current >= len(steps):
        conn.close()
        return {"error": "All steps already completed"}
    
    step_info = steps[current]
    
    # Log this step
    log_entry = {
        "step": current,
        "role": step_info.get("role"),
        "label": step_info.get("label"),
        "approver_id": approver_id,
        "action": action,
        "comment": comment,
        "timestamp": str(datetime.now())
    }
    steps_log.append(log_entry)
    
    if action == "reject":
        # Rejection stops the whole chain
        c.execute("UPDATE approval_requests SET status='rejected', steps_log=%s::jsonb, updated_at=NOW() WHERE ref=%s",
            (json.dumps(steps_log), approval_ref))
        conn.commit()
        conn.close()
        log_audit(approver_id, "reject_approval", req["entity_type"], approval_ref, log_entry)
        return {"status": "rejected", "step": current, "message": f"Rejected by {step_info['label']}"}
    
    # Approve — move to next step
    next_step = current + 1
    if next_step >= len(steps):
        # All steps complete — fully approved
        c.execute("UPDATE approval_requests SET status='approved', current_step=%s, steps_log=%s::jsonb, updated_at=NOW() WHERE ref=%s",
            (next_step, json.dumps(steps_log), approval_ref))
        conn.commit()
        conn.close()
        log_audit(approver_id, "final_approve", req["entity_type"], approval_ref, log_entry)
        return {"status": "approved", "step": current, "message": "Fully approved — all steps complete", "final": True}
    else:
        # Move to next step
        c.execute("UPDATE approval_requests SET current_step=%s, steps_log=%s::jsonb, updated_at=NOW() WHERE ref=%s",
            (next_step, json.dumps(steps_log), approval_ref))
        conn.commit()
        conn.close()
        next_label = steps[next_step].get("label", f"Step {next_step+1}")
        log_audit(approver_id, "approve_step", req["entity_type"], approval_ref, log_entry)
        return {"status": "pending", "step": next_step, "message": f"Approved by {step_info['label']}. Now pending: {next_label}", "final": False}


def get_approval_chain(approval_ref):
    """Get the full approval chain with status of each step."""
    req = get_approval_request(approval_ref)
    if not req:
        return None
    steps = req.get("workflow_steps", [])
    if isinstance(steps, str):
        steps = json.loads(steps)
    steps_log = req.get("steps_log", [])
    if isinstance(steps_log, str):
        steps_log = json.loads(steps_log)
    
    chain = []
    for i, step in enumerate(steps):
        entry = {
            "step": i + 1,
            "role": step.get("role"),
            "label": step.get("label"),
            "action_required": step.get("action", "approve"),
            "status": "pending",
            "approver": None,
            "comment": None,
            "timestamp": None
        }
        # Check if this step has been completed
        for log in steps_log:
            if log.get("step") == i:
                entry["status"] = log["action"]
                entry["approver"] = log.get("approver_id")
                entry["comment"] = log.get("comment")
                entry["timestamp"] = log.get("timestamp")
                break
        if i == req.get("current_step", 0) and req["status"] == "pending":
            entry["status"] = "awaiting"
        elif i > req.get("current_step", 0) and req["status"] == "pending":
            entry["status"] = "upcoming"
        chain.append(entry)
    
    return {
        "ref": approval_ref,
        "entity_type": req["entity_type"],
        "entity_ref": req.get("entity_ref", ""),
        "requester_id": req.get("requester_id"),
        "overall_status": req["status"],
        "chain": chain
    }

