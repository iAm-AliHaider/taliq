"""Taliq HR Mock Database — MRNA-compatible data model."""

from datetime import date, timedelta
import random

# ── Employees ───────────────────────────────────────────

EMPLOYEES = {
    "E001": {
        "id": "E001", "name": "Ahmed Al-Rashidi", "name_ar": "أحمد الرشيدي",
        "position": "Senior Software Engineer", "department": "Information Technology",
        "email": "ahmed.rashidi@mrna.sa", "phone": "+966501234567",
        "join_date": "2020-03-15", "grade": "35", "level": "5",
        "manager_id": "E003", "nationality": "Saudi",
        "salary": {"basic": 12000, "housing": 3000, "transport": 1500, "total": 16500, "currency": "SAR"},
        "leave_balance": {"annual": 22, "sick": 28, "emergency": 4, "study": 15},
        "loans": [
            {"id": "LN001", "type": "Interest-Free", "amount": 24000, "remaining": 16000, "monthly": 2000, "installments_left": 8}
        ],
    },
    "E002": {
        "id": "E002", "name": "Fatima Al-Zahrani", "name_ar": "فاطمة الزهراني",
        "position": "HR Manager", "department": "Human Resources",
        "email": "fatima.zahrani@mrna.sa", "phone": "+966502345678",
        "join_date": "2018-01-10", "grade": "37", "level": "6",
        "manager_id": "E005", "nationality": "Saudi",
        "salary": {"basic": 18000, "housing": 4500, "transport": 2000, "total": 24500, "currency": "SAR"},
        "leave_balance": {"annual": 15, "sick": 30, "emergency": 5, "study": 15},
        "loans": [],
    },
    "E003": {
        "id": "E003", "name": "Mohammed Al-Otaibi", "name_ar": "محمد العتيبي",
        "position": "IT Manager", "department": "Information Technology",
        "email": "mohammed.otaibi@mrna.sa", "phone": "+966503456789",
        "join_date": "2017-06-01", "grade": "38", "level": "6",
        "manager_id": "E005", "nationality": "Saudi",
        "salary": {"basic": 22000, "housing": 5500, "transport": 2500, "total": 30000, "currency": "SAR"},
        "leave_balance": {"annual": 10, "sick": 25, "emergency": 3, "study": 15},
        "loans": [],
    },
    "E004": {
        "id": "E004", "name": "Sara Al-Ghamdi", "name_ar": "سارة الغامدي",
        "position": "Financial Analyst", "department": "Finance",
        "email": "sara.ghamdi@mrna.sa", "phone": "+966504567890",
        "join_date": "2021-09-01", "grade": "34", "level": "4",
        "manager_id": "E003", "nationality": "Saudi",
        "salary": {"basic": 10000, "housing": 2500, "transport": 1200, "total": 13700, "currency": "SAR"},
        "leave_balance": {"annual": 28, "sick": 30, "emergency": 5, "study": 15},
        "loans": [
            {"id": "LN002", "type": "Advance Salary", "amount": 10000, "remaining": 5000, "monthly": 2500, "installments_left": 2}
        ],
    },
    "E005": {
        "id": "E005", "name": "Khalid Al-Harbi", "name_ar": "خالد الحربي",
        "position": "Chief Human Resources Officer", "department": "Executive",
        "email": "khalid.harbi@mrna.sa", "phone": "+966505678901",
        "join_date": "2015-01-15", "grade": "40", "level": "7",
        "manager_id": None, "nationality": "Saudi",
        "salary": {"basic": 35000, "housing": 8750, "transport": 3500, "total": 47250, "currency": "SAR"},
        "leave_balance": {"annual": 5, "sick": 20, "emergency": 2, "study": 15},
        "loans": [],
    },
    "E006": {
        "id": "E006", "name": "Nour Al-Shammari", "name_ar": "نور الشمري",
        "position": "Recruitment Specialist", "department": "Human Resources",
        "email": "nour.shammari@mrna.sa", "phone": "+966506789012",
        "join_date": "2022-03-20", "grade": "33", "level": "4",
        "manager_id": "E002", "nationality": "Saudi",
        "salary": {"basic": 8500, "housing": 2125, "transport": 1000, "total": 11625, "currency": "SAR"},
        "leave_balance": {"annual": 26, "sick": 30, "emergency": 5, "study": 15},
        "loans": [],
    },
    "E007": {
        "id": "E007", "name": "Rajesh Kumar", "name_ar": "راجيش كومار",
        "position": "DevOps Engineer", "department": "Information Technology",
        "email": "rajesh.kumar@mrna.sa", "phone": "+966507890123",
        "join_date": "2019-11-01", "grade": "35", "level": "5",
        "manager_id": "E003", "nationality": "Indian",
        "salary": {"basic": 11000, "housing": 2750, "transport": 1300, "total": 15050, "currency": "SAR"},
        "leave_balance": {"annual": 18, "sick": 30, "emergency": 5, "study": 0},
        "loans": [],
        "ticket_entitlement": True,  # Non-Saudi: employee + wife + 2 kids
    },
}

# ── Leave Requests ──────────────────────────────────────

LEAVE_REQUESTS = [
    {"id": "LR001", "employee_id": "E001", "type": "annual", "start": "2026-03-10", "end": "2026-03-14", "days": 5, "reason": "Family vacation", "status": "pending", "approver_id": "E003"},
    {"id": "LR002", "employee_id": "E004", "type": "sick", "start": "2026-02-25", "end": "2026-02-26", "days": 2, "reason": "Medical appointment", "status": "pending", "approver_id": "E003"},
    {"id": "LR003", "employee_id": "E006", "type": "annual", "start": "2026-03-20", "end": "2026-03-25", "days": 6, "reason": "Wedding attendance", "status": "pending", "approver_id": "E002"},
    {"id": "LR004", "employee_id": "E007", "type": "annual", "start": "2026-04-01", "end": "2026-04-15", "days": 15, "reason": "Annual home visit - India", "status": "pending", "approver_id": "E003"},
]

# ── Document Requests ───────────────────────────────────

DOCUMENT_REQUESTS = [
    {"id": "DR001", "employee_id": "E001", "type": "Salary Certificate", "status": "ready", "request_date": "2026-02-20", "reference": "DOC-2026-001"},
    {"id": "DR002", "employee_id": "E004", "type": "Experience Certificate", "status": "processing", "request_date": "2026-02-25", "reference": "DOC-2026-002"},
]

# ── Travel Requests ─────────────────────────────────────

TRAVEL_REQUESTS = [
    {"id": "TR001", "employee_id": "E003", "destination": "Jeddah", "type": "business", "start": "2026-03-05", "end": "2026-03-07", "days": 3, "per_diem": 900, "status": "approved"},
    {"id": "TR002", "employee_id": "E005", "destination": "Dubai", "type": "business", "start": "2026-03-15", "end": "2026-03-18", "days": 4, "per_diem": 1750, "status": "pending"},
]

# ── Announcements ───────────────────────────────────────

ANNOUNCEMENTS = [
    {"id": "ANN001", "title": "Ramadan Working Hours", "content": "During Ramadan, working hours will be 10 AM to 3 PM. All employees are expected to adjust their schedules accordingly.", "author": "HR Department", "date": "2026-02-20", "priority": "important", "acknowledged_count": 45, "total_count": 60},
    {"id": "ANN002", "title": "Annual Performance Review Cycle", "content": "The 2026 annual performance review cycle begins March 1st. All managers should prepare KPI evaluations for their team members.", "author": "Khalid Al-Harbi", "date": "2026-02-25", "priority": "urgent", "acknowledged_count": 12, "total_count": 60},
    {"id": "ANN003", "title": "New Employee Parking Policy", "content": "Effective March 15, all employees must register their vehicles through the intranet portal. Unregistered vehicles will not be allowed in the company parking.", "author": "Operations", "date": "2026-02-27", "priority": "normal", "acknowledged_count": 30, "total_count": 60},
]

# ── Interview Templates ─────────────────────────────────

INTERVIEW_TEMPLATES = {
    "software_engineer": {
        "title": "Software Engineer Interview",
        "questions": [
            {"q": "Tell me about your experience with distributed systems and microservices architecture.", "type": "technical", "time_min": 5},
            {"q": "Describe a challenging bug you debugged. Walk me through your process.", "type": "problem_solving", "time_min": 5},
            {"q": "How do you approach code reviews? What do you look for?", "type": "collaboration", "time_min": 3},
            {"q": "Tell me about a project where you had to learn a new technology quickly.", "type": "behavioral", "time_min": 4},
            {"q": "Design a URL shortening service. What components would you use?", "type": "system_design", "time_min": 8},
        ]
    },
    "ui_designer": {
        "title": "UI/UX Designer Interview",
        "questions": [
            {"q": "Walk me through your design process from research to delivery.", "type": "process", "time_min": 5},
            {"q": "How do you handle conflicting feedback from stakeholders?", "type": "behavioral", "time_min": 4},
            {"q": "Describe how you approach accessibility in your designs.", "type": "technical", "time_min": 4},
            {"q": "Show me a project you're most proud of and explain why.", "type": "portfolio", "time_min": 6},
        ]
    },
    "general": {
        "title": "General Interview",
        "questions": [
            {"q": "Tell me about yourself and your professional background.", "type": "introduction", "time_min": 3},
            {"q": "Why are you interested in this position?", "type": "motivation", "time_min": 3},
            {"q": "Describe a situation where you had to work under pressure.", "type": "behavioral", "time_min": 4},
            {"q": "Where do you see yourself in 5 years?", "type": "career", "time_min": 3},
            {"q": "Do you have any questions for us?", "type": "closing", "time_min": 3},
        ]
    },
}

# ── Job Openings ────────────────────────────────────────

JOB_OPENINGS = [
    {"id": "JO001", "title": "Senior Backend Developer", "department": "IT", "grade": "35-36", "status": "active", "applicants": 12},
    {"id": "JO002", "title": "Business Analyst", "department": "Finance", "grade": "34", "status": "active", "applicants": 8},
    {"id": "JO003", "title": "HR Coordinator", "department": "Human Resources", "grade": "32-33", "status": "screening", "applicants": 23},
]

# ── Per Diem Rates (by grade) ───────────────────────────

PER_DIEM_RATES = {
    "chairman": {"international": 3500, "local": 2000},
    "c_level": {"international": 1750, "local": 1200},
    "other": {"international": 1350, "local": 900},
}

# ── Salary Scale ────────────────────────────────────────

SALARY_SCALE = {
    "30": {"min": 4000, "max": 6000, "title": "Clerk"},
    "31": {"min": 5000, "max": 7500, "title": "Senior Clerk"},
    "32": {"min": 6500, "max": 9000, "title": "Officer"},
    "33": {"min": 7500, "max": 11000, "title": "Senior Officer"},
    "34": {"min": 9000, "max": 13000, "title": "Supervisor"},
    "35": {"min": 11000, "max": 16000, "title": "Assistant Manager"},
    "36": {"min": 14000, "max": 20000, "title": "Manager"},
    "37": {"min": 17000, "max": 25000, "title": "Senior Manager"},
    "38": {"min": 20000, "max": 32000, "title": "Director"},
    "39": {"min": 28000, "max": 42000, "title": "General Manager"},
    "40": {"min": 35000, "max": 55000, "title": "C-Level"},
}

# ── Helper Functions ────────────────────────────────────

def get_employee(emp_id: str) -> dict | None:
    return EMPLOYEES.get(emp_id)

def get_team_attendance(manager_id: str) -> list[dict]:
    """Get attendance for employees reporting to manager."""
    team = [e for e in EMPLOYEES.values() if e.get("manager_id") == manager_id]
    statuses = ["present", "present", "present", "remote", "late", "absent", "on_leave"]
    result = []
    for emp in team:
        status = random.choice(statuses)
        check_in = f"0{random.randint(7,9)}:{random.randint(0,59):02d}" if status in ("present", "late", "remote") else None
        check_out = f"{random.randint(16,18)}:{random.randint(0,59):02d}" if status == "present" else None
        result.append({
            "name": emp["name"],
            "status": status,
            "checkIn": check_in,
            "checkOut": check_out,
        })
    return result

def get_pending_approvals(manager_id: str) -> list[dict]:
    """Get leave requests pending this manager's approval."""
    return [lr for lr in LEAVE_REQUESTS if lr.get("approver_id") == manager_id and lr["status"] == "pending"]

def submit_leave_request(emp_id: str, leave_type: str, start: str, end: str, days: int, reason: str) -> dict:
    """Create a new leave request."""
    emp = get_employee(emp_id)
    manager_id = emp.get("manager_id") if emp else None
    lr = {
        "id": f"LR{len(LEAVE_REQUESTS) + 1:03d}",
        "employee_id": emp_id,
        "type": leave_type,
        "start": start,
        "end": end,
        "days": days,
        "reason": reason,
        "status": "pending",
        "approver_id": manager_id,
    }
    LEAVE_REQUESTS.append(lr)
    return lr

def check_loan_eligibility(emp_id: str) -> dict:
    """Check if employee is eligible for a loan."""
    emp = get_employee(emp_id)
    if not emp:
        return {"eligible": False, "reason": "Employee not found"}
    
    join = date.fromisoformat(emp["join_date"])
    service_years = (date.today() - join).days / 365.25
    
    if service_years < 1:
        return {"eligible": False, "reason": "Minimum 1 year of service required"}
    
    existing_loans = emp.get("loans", [])
    active = [l for l in existing_loans if l.get("remaining", 0) > 0]
    
    basic = emp["salary"]["basic"]
    existing_emi = sum(l.get("monthly", 0) for l in active)
    max_emi = basic * 0.33
    available_emi = max_emi - existing_emi
    
    if available_emi <= 0:
        return {"eligible": False, "reason": f"EMI cap reached. Existing EMI: {existing_emi} SAR, Max: {max_emi:.0f} SAR"}
    
    max_amount = min(basic * 2, available_emi * 12)
    
    return {
        "eligible": True,
        "max_amount": int(max_amount),
        "max_emi": int(available_emi),
        "existing_emi": int(existing_emi),
        "basic_salary": basic,
        "service_years": round(service_years, 1),
    }

def get_per_diem(grade: str, international: bool = False) -> int:
    """Get per diem rate based on grade."""
    grade_int = int(grade)
    if grade_int >= 40:
        tier = "chairman"
    elif grade_int >= 38:
        tier = "c_level"
    else:
        tier = "other"
    return PER_DIEM_RATES[tier]["international" if international else "local"]

def get_employee_documents(emp_id: str) -> list[dict]:
    return [d for d in DOCUMENT_REQUESTS if d["employee_id"] == emp_id]

def get_announcements(limit: int = 5) -> list[dict]:
    return ANNOUNCEMENTS[:limit]

def get_employee_loans(emp_id: str) -> list[dict]:
    emp = get_employee(emp_id)
    return emp.get("loans", []) if emp else []
