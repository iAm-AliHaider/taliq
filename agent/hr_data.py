"""Taliq — Mock HR Database.

In production, replace with real DB queries (Postgres, PocketBase, or ERP API).
"""

from datetime import date, timedelta
import random

# ── Employee Directory ──────────────────────────────────

EMPLOYEES = {
    "E001": {
        "id": "E001", "name": "Ahmed Al-Rashid", "name_ar": "أحمد الراشد",
        "department": "Engineering", "position": "Senior Developer",
        "manager": "E005", "join_date": "2022-03-15",
        "email": "ahmed@taliq.ai", "phone": "+966501234567",
        "leave_balance": {"annual": 18, "sick": 10, "emergency": 3},
        "salary": {"basic": 15000, "housing": 5000, "transport": 1500, "total": 21500, "currency": "SAR"},
    },
    "E002": {
        "id": "E002", "name": "Fatima Hassan", "name_ar": "فاطمة حسن",
        "department": "Design", "position": "UI/UX Designer",
        "manager": "E005", "join_date": "2023-01-10",
        "email": "fatima@taliq.ai", "phone": "+966502345678",
        "leave_balance": {"annual": 22, "sick": 10, "emergency": 3},
        "salary": {"basic": 12000, "housing": 4000, "transport": 1500, "total": 17500, "currency": "SAR"},
    },
    "E003": {
        "id": "E003", "name": "Omar Khalid", "name_ar": "عمر خالد",
        "department": "Engineering", "position": "Backend Developer",
        "manager": "E005", "join_date": "2023-06-01",
        "email": "omar@taliq.ai", "phone": "+966503456789",
        "leave_balance": {"annual": 15, "sick": 8, "emergency": 3},
        "salary": {"basic": 13000, "housing": 4500, "transport": 1500, "total": 19000, "currency": "SAR"},
    },
    "E004": {
        "id": "E004", "name": "Sara Al-Mutairi", "name_ar": "سارة المطيري",
        "department": "HR", "position": "HR Specialist",
        "manager": "E005", "join_date": "2021-11-20",
        "email": "sara@taliq.ai", "phone": "+966504567890",
        "leave_balance": {"annual": 20, "sick": 10, "emergency": 3},
        "salary": {"basic": 11000, "housing": 3500, "transport": 1500, "total": 16000, "currency": "SAR"},
    },
    "E005": {
        "id": "E005", "name": "Khalid bin Nasser", "name_ar": "خالد بن ناصر",
        "department": "Engineering", "position": "Engineering Manager",
        "manager": None, "join_date": "2020-06-01",
        "email": "khalid@taliq.ai", "phone": "+966505678901",
        "leave_balance": {"annual": 25, "sick": 10, "emergency": 3},
        "salary": {"basic": 22000, "housing": 7000, "transport": 2000, "total": 31000, "currency": "SAR"},
    },
}

# ── Leave Requests ──────────────────────────────────────

LEAVE_REQUESTS = [
    {"id": "LR001", "employee_id": "E001", "type": "annual", "start": "2026-03-01", "end": "2026-03-03", "days": 3, "status": "pending", "reason": "Family visit"},
    {"id": "LR002", "employee_id": "E002", "type": "sick", "start": "2026-02-20", "end": "2026-02-21", "days": 2, "status": "approved", "reason": "Medical appointment"},
    {"id": "LR003", "employee_id": "E003", "type": "annual", "start": "2026-03-10", "end": "2026-03-14", "days": 5, "status": "pending", "reason": "Vacation"},
]

# ── Attendance (today) ──────────────────────────────────

def get_team_attendance(manager_id: str) -> list:
    """Get attendance for a manager's direct reports."""
    team = [e for e in EMPLOYEES.values() if e["manager"] == manager_id]
    statuses = ["present", "present", "present", "late", "on_leave", "remote"]
    result = []
    for emp in team:
        status = random.choice(statuses)
        result.append({
            "id": emp["id"],
            "name": emp["name"],
            "department": emp["department"],
            "status": status,
            "check_in": "08:15" if status == "present" else ("09:30" if status == "late" else None),
        })
    return result

# ── Interview Questions ─────────────────────────────────

INTERVIEW_TEMPLATES = {
    "software_engineer": {
        "title": "Software Engineer Interview",
        "questions": [
            {"q": "Tell me about yourself and your experience.", "type": "behavioral", "time_min": 3},
            {"q": "Describe a challenging technical problem you solved recently.", "type": "behavioral", "time_min": 4},
            {"q": "How would you design a REST API for a leave management system?", "type": "technical", "time_min": 5},
            {"q": "What's the difference between SQL and NoSQL databases? When would you choose each?", "type": "technical", "time_min": 3},
            {"q": "How do you handle disagreements with team members?", "type": "behavioral", "time_min": 3},
            {"q": "Write a function to find duplicates in an array. Walk me through your approach.", "type": "coding", "time_min": 5},
        ],
    },
    "ui_designer": {
        "title": "UI/UX Designer Interview",
        "questions": [
            {"q": "Walk me through your design process from research to handoff.", "type": "behavioral", "time_min": 4},
            {"q": "How do you approach designing for accessibility?", "type": "technical", "time_min": 3},
            {"q": "Tell me about a design you're most proud of and why.", "type": "behavioral", "time_min": 4},
            {"q": "How would you design an employee self-service portal?", "type": "technical", "time_min": 5},
            {"q": "How do you handle feedback when stakeholders disagree with your design?", "type": "behavioral", "time_min": 3},
        ],
    },
    "general": {
        "title": "General Interview",
        "questions": [
            {"q": "Tell me about yourself.", "type": "behavioral", "time_min": 3},
            {"q": "Why are you interested in this role?", "type": "behavioral", "time_min": 3},
            {"q": "What are your strengths and areas for improvement?", "type": "behavioral", "time_min": 3},
            {"q": "Where do you see yourself in 5 years?", "type": "behavioral", "time_min": 3},
            {"q": "Do you have any questions for us?", "type": "behavioral", "time_min": 3},
        ],
    },
}

# ── Job Openings ────────────────────────────────────────

JOB_OPENINGS = [
    {"id": "JOB001", "title": "Senior React Developer", "department": "Engineering", "location": "Riyadh", "type": "Full-time", "applicants": 24, "status": "open"},
    {"id": "JOB002", "title": "Product Designer", "department": "Design", "location": "Remote", "type": "Full-time", "applicants": 18, "status": "open"},
    {"id": "JOB003", "title": "DevOps Engineer", "department": "Engineering", "location": "Jeddah", "type": "Full-time", "applicants": 12, "status": "interviewing"},
    {"id": "JOB004", "title": "Marketing Intern", "department": "Marketing", "location": "Riyadh", "type": "Internship", "applicants": 45, "status": "open"},
]


def get_employee(employee_id: str) -> dict | None:
    return EMPLOYEES.get(employee_id)


def get_pending_approvals(manager_id: str) -> list:
    """Get pending leave requests for a manager's reports."""
    team_ids = {e["id"] for e in EMPLOYEES.values() if e["manager"] == manager_id}
    return [lr for lr in LEAVE_REQUESTS if lr["employee_id"] in team_ids and lr["status"] == "pending"]


def submit_leave_request(employee_id: str, leave_type: str, start: str, end: str, days: int, reason: str) -> dict:
    """Submit a new leave request."""
    lr_id = f"LR{len(LEAVE_REQUESTS)+1:03d}"
    new_lr = {
        "id": lr_id, "employee_id": employee_id, "type": leave_type,
        "start": start, "end": end, "days": days,
        "status": "pending", "reason": reason,
    }
    LEAVE_REQUESTS.append(new_lr)
    return new_lr
