"""Taliq - Voice-First HR Agent with real CRUD, interactive forms, and self-service."""

import json
import logging
import os
import asyncio
from datetime import date as dt
from dotenv import load_dotenv

from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobExecutorType,
    WorkerOptions,
    WorkerType,
    cli,
    function_tool,
    RunContext,
)
from livekit.plugins import deepgram, openai, silero
from livekit import rtc

import database as db
from edge_tts_plugin import EdgeTTS

load_dotenv()
logger = logging.getLogger("taliq-agent")
logging.basicConfig(level=logging.INFO)

DEFAULT_EMPLOYEE_ID = os.getenv("TALIQ_EMPLOYEE_ID", "E001")
_room_ref = None
_session_ref = None
_current_employee_id = None


def get_current_employee_id_from_context() -> str:
    global _current_employee_id
    if _current_employee_id:
        return _current_employee_id
    return DEFAULT_EMPLOYEE_ID


def set_current_employee_id(emp_id: str):
    global _current_employee_id
    _current_employee_id = emp_id


SYSTEM_PROMPT = """You are Taliq, a voice-first HR assistant for Saudi Arabian employees.

Employee: {employee_name} ({employee_id}) | Dept: {department} | Grade: {grade}

You have real database access. Keep voice responses SHORT (1-2 sentences max).
Use Marhaba/Ahlan greetings. Currency: SAR. GOSI: 9.75% of basic.

DASHBOARD:
When conversation starts or user says 'home'/'dashboard', call show_dashboard first.

SELF-SERVICE FORMS:
When user wants to CREATE something, show the interactive FORM (not just a preview):
- "Apply for leave" -> show_leave_form (interactive form with dropdowns & date pickers)
- "Request document" -> show_document_form (interactive document selection)
- "Apply for loan" -> show_loan_form (interactive with amount slider)
- "Travel request" -> show_travel_form (interactive with destination picker)
- "Edit profile" -> show_profile_edit (editable fields)

The forms have SUBMIT buttons. When user submits via the form, you'll get a form_submit message.
Process it and confirm the result via voice.

For READ operations, show the display cards as before.

ATTENDANCE:
- "Clock me in" / "I'm at work" -> clock_me_in
- "Clock me out" / "I'm leaving" -> clock_me_out
- "Show my attendance" -> show_my_attendance
- "Request overtime" -> request_overtime_approval

AI INTERVIEWER:
- "Start interview for [name]" -> start_new_interview (needs candidate_name + position)
- After each answer, score 1-5 -> score_current_answer
- "Show interview results" -> show_interview_results
Interview stages: hr_screening (default), technical, behavioral, leadership.

PERFORMANCE:
- "Show my performance review" -> show_my_performance
- "Show my goals" -> show_my_goals
- "Set goal" -> set_new_goal
- "Update goal progress" -> update_goal

TRAINING:
- "Show available courses" -> show_available_trainings
- "Enroll in course" -> enroll_in_training
- "My trainings" -> show_my_trainings

GRIEVANCE:
- "File a complaint" -> file_grievance (categories: harassment, discrimination, safety, policy, compensation, other)
- "Show my grievances" -> show_my_grievances

NOTIFICATIONS:
- "Show notifications" -> show_notifications

ALL REQUESTS:
- "Show my requests" / "What are my requests" / "My status" -> show_my_requests (shows ALL requests at once)

EXPENSES:
- "Submit expense" / "New expense" -> show_expense_form (interactive form)
- "Show my expenses" -> show_my_expenses
- Categories: travel, meals, office_supplies, training, communication, other

CLAIMS:
- "Submit claim" / "File a claim" -> show_claim_form (interactive form)
- "Show my claims" -> show_my_claims
- Types: medical, dental, vision, education, relocation, other

PAYMENTS:
- "Show my payments" / "Payment history" -> show_my_payments (salary, reimbursements, bonuses)

MANAGER TOOLS (only for managers E002, E003, E005):
Approval actions:
- "Show all pending" -> show_all_pending_approvals (shows ALL pending items at once)
- "Approve leave LR-xxx" -> approve_leave (ref, decision)
- "Approve loan LN-xxx" -> approve_loan_request (ref, decision)
- "Approve travel TR-xxx" -> approve_travel_request (ref, decision)
- "Approve overtime" -> approve_overtime_request (record_id, decision)
- "Approve document DOC-xxx" -> approve_document_request (ref, decision)
Use decision='approved'/'rejected' (or 'ready'/'rejected' for docs).

Expense & Claim Approvals:
- "Pending expenses" -> show_pending_expenses
- "Approve expense EXP-xxx" -> approve_expense_request (ref, decision)
- "Pending claims" -> show_pending_claims
- "Approve claim CLM-xxx" -> approve_claim_request (ref, decision)
- "All payments" -> show_all_payments_admin

Team Analytics:
- "Show team performance" -> show_team_performance
- "Training compliance" -> show_team_training_compliance
- "Leave analytics" -> show_leave_analytics
- "Headcount report" -> show_headcount_report

Grievance Management:
- "Team grievances" -> show_team_grievances
- "Resolve grievance GRV-xxx" -> resolve_team_grievance (ref, resolution)

Team Administration:
- "Show employee details E001" -> show_employee_details (full 360 view)
- "Reassign employee" -> reassign_team_member (employee_id, new_manager_id)

When a manager logs in, proactively mention pending items count.
"""


async def _send_ui(component: str, props: dict, category: str | None = None):
    global _room_ref
    if not _room_ref or not _room_ref.local_participant:
        return
    try:
        payload = json.dumps(
            {
                "type": "tambo_render",
                "component": component,
                "props": props,
                "category": category or component,
            }
        ).encode("utf-8")
        await _room_ref.local_participant.publish_data(
            payload, topic="ui_sync", reliable=True
        )
        logger.info(f"UI: {component}")
    except Exception as e:
        logger.error(f"UI error: {e}")


# ---- INTERACTIVE FORMS ----


@function_tool()
async def show_leave_form(context: RunContext):
    """Show interactive leave application form with dropdowns, date pickers, and submit button. Call when user wants to APPLY for leave."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    bal = emp["leave_balance"]
    await _send_ui(
        "LeaveRequestForm",
        {
            "employeeName": emp["name"],
            "balance": bal.get("annual", 0),
            "status": "preview",
            "mode": "form",
        },
        "main_card",
    )
    return "Leave form shown. User can fill in type, dates, and reason, then submit."


@function_tool()
async def show_document_form(context: RunContext):
    """Show interactive document request form. Call when user wants to request a document."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    await _send_ui(
        "DocumentRequestForm",
        {
            "employeeName": emp["name"],
        },
        "main_card",
    )
    return "Document request form shown. User can select type and submit."


@function_tool()
async def show_loan_form(context: RunContext):
    """Show interactive loan application form with amount slider. Call when user wants to apply for a loan."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    elig = db.check_loan_eligibility(get_current_employee_id_from_context())
    await _send_ui(
        "LoanApplicationForm",
        {
            "employeeName": emp["name"],
            "eligible": elig.get("eligible", False),
            "maxAmount": elig.get("max_amount", 0),
            "currency": "SAR",
            "basicSalary": emp["salary"]["basic"],
        },
        "main_card",
    )
    if elig.get("eligible"):
        return f"Loan form shown. Max eligible: {elig['max_amount']:,} SAR."
    return "Not eligible for a loan at this time."


@function_tool()
async def show_travel_form(context: RunContext):
    """Show interactive travel request form with destination picker. Call when user wants to request travel."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    per_diem = db.get_per_diem(emp.get("grade", "34"))
    await _send_ui(
        "TravelRequestForm",
        {
            "employeeName": emp["name"],
            "grade": emp.get("grade", ""),
            "perDiemRates": {"international": per_diem, "local": int(per_diem * 0.67)},
            "currency": "SAR",
        },
        "main_card",
    )
    return "Travel form shown. User can pick destination, dates, and submit."


@function_tool()
async def show_profile_edit(context: RunContext):
    """Show profile with editable fields (phone, email, emergency contact, IBAN). Call when user wants to edit profile."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    mgr = db.get_employee(emp.get("manager_id", ""))
    await _send_ui(
        "ProfileEditCard",
        {
            "name": emp["name"],
            "nameAr": emp["name_ar"],
            "position": emp["position"],
            "department": emp["department"],
            "email": emp["email"],
            "phone": emp["phone"],
            "joinDate": emp["join_date"],
            "employeeId": emp["id"],
            "grade": f"Grade {emp['grade']} / Level {emp['level']}",
            "manager": mgr["name"] if mgr else "N/A",
            "nationality": emp.get("nationality", ""),
            "maritalStatus": emp.get("marital_status", ""),
            "emergencyContact": emp.get("emergency_contact", ""),
            "emergencyPhone": emp.get("emergency_phone", ""),
            "bankIban": emp.get("bank_iban", ""),
        },
        "main_card",
    )
    return "Profile shown with edit mode. User can update phone, email, emergency contact, and IBAN."


# ---- READ OPERATIONS ----


@function_tool()
async def check_leave_balance(context: RunContext):
    """Show leave balance overview."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    bal = emp["leave_balance"]
    await _send_ui(
        "LeaveBalanceCard",
        {
            "employeeName": emp["name"],
            "annual": bal["annual"],
            "sick": bal["sick"],
            "emergency": bal["emergency"],
            "study": bal.get("study"),
        },
        "main_card",
    )
    return f"{bal['annual']} annual, {bal['sick']} sick, {bal['emergency']} emergency days."


@function_tool()
async def show_my_leave_requests(context: RunContext):
    """Show all my leave requests."""
    reqs = db.get_leave_requests(get_current_employee_id_from_context())
    if not reqs:
        return "No leave requests."
    emp = db.get_employee(get_current_employee_id_from_context())
    lr = reqs[0]
    await _send_ui(
        "LeaveRequestForm",
        {
            "employeeName": emp["name"] if emp else "",
            "leaveType": lr["leave_type"],
            "startDate": lr["start_date"],
            "endDate": lr["end_date"],
            "days": lr["days"],
            "reason": lr["reason"] or "",
            "status": lr["status"],
            "reference": lr["ref"],
            "mode": "display",
        },
        "main_card",
    )
    summary = ", ".join(f"{r['ref']}({r['status']})" for r in reqs[:5])
    return f"{len(reqs)} request(s): {summary}"


@function_tool()
async def show_pending_approvals(context: RunContext):
    """Show pending approvals for me as manager."""
    approvals = db.get_pending_approvals(get_current_employee_id_from_context())
    items = [
        {
            "id": a["ref"],
            "employeeName": a["employee_name"],
            "type": a["leave_type"],
            "startDate": a["start_date"],
            "endDate": a["end_date"],
            "days": a["days"],
            "reason": a["reason"] or "",
            "status": a["status"],
        }
        for a in approvals
    ]
    await _send_ui("ApprovalQueue", {"items": items}, "main_card")
    return f"{len(items)} pending."


@function_tool()
async def approve_leave(
    context: RunContext, request_ref: str, decision: str = "approved"
):
    """Approve or reject a leave request."""
    result = db.approve_leave_request(request_ref, decision)
    if not result:
        return f"Request {request_ref} not found."
    await _send_ui(
        "StatusBanner",
        {
            "message": f"{request_ref} for {result.get('employee_name', '?')}: {decision}",
            "type": "success" if decision == "approved" else "warning",
        },
        "main_card",
    )
    return f"Leave {request_ref} {decision}."


@function_tool()
async def show_my_profile(context: RunContext):
    """Show employee profile (read-only view)."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    mgr = db.get_employee(emp.get("manager_id", ""))
    await _send_ui(
        "EmployeeProfileCard",
        {
            "name": emp["name"],
            "nameAr": emp["name_ar"],
            "position": emp["position"],
            "department": emp["department"],
            "email": emp["email"],
            "phone": emp["phone"],
            "joinDate": emp["join_date"],
            "employeeId": emp["id"],
            "grade": f"Grade {emp['grade']} / Level {emp['level']}",
            "manager": mgr["name"] if mgr else "N/A",
        },
        "main_card",
    )
    return f"{emp['name']}, {emp['position']}."


@function_tool()
async def show_pay_slip(context: RunContext, month: str = "February 2026"):
    """Show pay slip."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    sal = emp["salary"]
    gosi = int(sal["basic"] * 0.0975)
    net = sal["total"] - gosi
    await _send_ui(
        "PaySlipCard",
        {
            "employeeName": emp["name"],
            "month": month,
            "basic": sal["basic"],
            "housing": sal["housing"],
            "transport": sal["transport"],
            "deductions": gosi,
            "gosiDeduction": gosi,
            "netPay": net,
            "currency": "SAR",
        },
        "main_card",
    )
    return f"Net: {net:,} SAR after {gosi:,} GOSI."


@function_tool()
async def check_loan_eligibility(context: RunContext):
    """Check loan eligibility."""
    result = db.check_loan_eligibility(get_current_employee_id_from_context())
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    await _send_ui(
        "LoanCard",
        {
            "employeeName": emp["name"],
            "loanType": "Eligibility",
            "amount": 0,
            "currency": "SAR",
            "eligible": result["eligible"],
            "maxAmount": result.get("max_amount"),
            "status": "eligible" if result["eligible"] else "ineligible",
        },
        "main_card",
    )
    if result["eligible"]:
        return f"Eligible! Max: {result['max_amount']:,} SAR."
    return f"Not eligible: {result['reason']}"


@function_tool()
async def show_loan_balance(context: RunContext):
    """Show active loans."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    loans = db.get_employee_loans(get_current_employee_id_from_context())
    if not loans:
        await _send_ui(
            "StatusBanner", {"message": "No active loans.", "type": "info"}, "main_card"
        )
        return "No active loans."
    loan = loans[0]
    await _send_ui(
        "LoanCard",
        {
            "employeeName": emp["name"],
            "loanType": loan["loan_type"],
            "amount": loan["amount"],
            "currency": "SAR",
            "remainingBalance": loan["remaining"],
            "monthlyInstallment": loan["monthly_installment"],
            "installmentsLeft": loan["installments_left"],
            "status": "active",
        },
        "main_card",
    )
    return (
        f"{len(loans)} loan(s), {sum(l['remaining'] for l in loans):,} SAR remaining."
    )


@function_tool()
async def show_my_documents(context: RunContext):
    """Show my document requests."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    docs = db.get_document_requests(get_current_employee_id_from_context())
    if not docs:
        return "No requests."
    doc = docs[0]
    await _send_ui(
        "DocumentRequestCard",
        {
            "employeeName": emp["name"],
            "documentType": doc["document_type"],
            "requestDate": doc["created_at"][:10],
            "status": doc["status"],
            "referenceNumber": doc["ref"],
        },
        "main_card",
    )
    return f"{len(docs)} request(s). Latest: {doc['document_type']} - {doc['status']}."


@function_tool()
async def show_announcements(context: RunContext):
    """Show announcements."""
    anns = db.get_announcements()
    if not anns:
        return "None."
    a = anns[0]
    await _send_ui(
        "AnnouncementCard",
        {
            "title": a["title"],
            "content": a["content"],
            "author": a.get("author"),
            "date": a["created_at"][:10],
            "priority": a.get("priority", "normal"),
            "acknowledgedCount": a.get("acknowledged_count"),
            "totalCount": a.get("total_count"),
        },
        "main_card",
    )
    return f"Latest: {a['title']}."


@function_tool()
async def show_team_attendance(context: RunContext):
    """Show team attendance."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    att = db.get_team_attendance(get_current_employee_id_from_context())
    if not att:
        return "No team."
    await _send_ui(
        "AttendanceDashboard",
        {
            "managerName": emp["name"],
            "date": str(dt.today()),
            "team": att,
        },
        "main_card",
    )
    p = sum(1 for a in att if a["status"] in ("present", "remote"))
    return f"{p}/{len(att)} present."


@function_tool()
async def show_status(context: RunContext, message: str, status_type: str = "info"):
    """Show notification."""
    await _send_ui(
        "StatusBanner", {"message": message, "type": status_type}, "main_card"
    )
    return message


# ---- CRUD (called by form submissions or voice) ----


@function_tool()
async def apply_for_leave(
    context: RunContext,
    leave_type: str,
    start_date: str,
    end_date: str,
    days: int,
    reason: str,
):
    """CREATE a leave request in the database."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    bal = emp["leave_balance"].get(leave_type, 0)
    if days > bal:
        await _send_ui(
            "StatusBanner",
            {
                "message": f"Insufficient {leave_type} leave ({bal} left).",
                "type": "error",
            },
            "main_card",
        )
        return f"Only {bal} {leave_type} days remaining."
    lr = db.submit_leave_request(
        get_current_employee_id_from_context(), leave_type, start_date, end_date, days, reason
    )
    await _send_ui(
        "LeaveRequestForm",
        {
            "employeeName": emp["name"],
            "leaveType": leave_type,
            "startDate": start_date,
            "endDate": end_date,
            "days": days,
            "reason": reason,
            "balance": bal - days,
            "status": "submitted",
            "reference": lr["ref"],
            "mode": "display",
        },
        "main_card",
    )
    return f"Leave {lr['ref']} created! {days} {leave_type} days. Sent to manager."


@function_tool()
async def apply_for_loan(
    context: RunContext, loan_type: str, amount: float, months: int
):
    """CREATE a loan application."""
    elig = db.check_loan_eligibility(get_current_employee_id_from_context())
    if not elig["eligible"]:
        await _send_ui(
            "StatusBanner",
            {"message": f"Not eligible: {elig['reason']}", "type": "error"},
            "main_card",
        )
        return f"Cannot apply: {elig['reason']}"
    if amount > elig["max_amount"]:
        return f"Exceeds max ({elig['max_amount']:,} SAR)."
    loan = db.create_loan(get_current_employee_id_from_context(), loan_type, amount, months)
    emp = db.get_employee(get_current_employee_id_from_context())
    await _send_ui(
        "LoanCard",
        {
            "employeeName": emp["name"] if emp else "",
            "loanType": loan["loan_type"],
            "amount": loan["amount"],
            "currency": "SAR",
            "remainingBalance": loan["remaining"],
            "monthlyInstallment": loan["monthly_installment"],
            "installmentsLeft": loan["installments_left"],
            "status": "active",
        },
        "main_card",
    )
    return f"Loan {loan['ref']} created! {amount:,.0f} SAR over {months} months."


@function_tool()
async def request_document(context: RunContext, document_type: str):
    """CREATE a document request."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    doc = db.create_document_request(get_current_employee_id_from_context(), document_type)
    await _send_ui(
        "DocumentRequestCard",
        {
            "employeeName": emp["name"],
            "documentType": doc["document_type"],
            "requestDate": doc["created_at"][:10],
            "status": "requested",
            "estimatedDate": doc["estimated_date"],
            "referenceNumber": doc["ref"],
        },
        "main_card",
    )
    return f"Request {doc['ref']} created! Ready in 2 days."


@function_tool()
async def create_travel_request(
    context: RunContext,
    destination: str,
    start_date: str,
    end_date: str,
    days: int,
    travel_type: str = "business",
):
    """CREATE a travel request."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    tr = db.create_travel_request(
        get_current_employee_id_from_context(), destination, start_date, end_date, days, travel_type
    )
    await _send_ui(
        "TravelRequestCard",
        {
            "employeeName": emp["name"],
            "destination": tr["destination"],
            "travelType": tr["travel_type"],
            "startDate": tr["start_date"],
            "endDate": tr["end_date"],
            "days": tr["days"],
            "perDiem": tr["per_diem"],
            "totalAllowance": tr["total_allowance"],
            "currency": "SAR",
            "status": "pending",
        },
        "main_card",
    )
    return f"Travel {tr['ref']} created! {destination}, {days} days, {tr['total_allowance']:,} SAR."



@function_tool
async def show_my_requests(context: RunContext):
    """Show ALL of the employee's requests across all categories - leaves, loans, documents, travel, grievances."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Employee not found."
    
    leaves = db.get_leave_requests(emp_id)
    loans = db.get_employee_loans(emp_id)
    docs = db.get_document_requests(emp_id)
    travel = db.get_travel_requests(emp_id)
    grievances = db.get_my_grievances(emp_id)
    
    await _send_ui("MyRequestsCard", {
        "employeeName": emp["name"],
        "leaveRequests": [{
            "ref": r["ref"], "type": r["leave_type"], "days": r["days"],
            "startDate": r["start_date"], "status": r["status"],
        } for r in leaves],
        "loans": [{
            "ref": r["ref"], "type": r["loan_type"], "amount": r["amount"],
            "remaining": r["remaining"], "status": r["status"],
        } for r in loans],
        "documents": [{
            "ref": r["ref"], "type": r["document_type"], "status": r["status"],
        } for r in docs],
        "travel": [{
            "ref": r["ref"], "destination": r["destination"], "days": r["days"],
            "status": r["status"],
        } for r in travel],
        "grievances": [{
            "ref": r["ref"], "subject": r["subject"], "status": r["status"],
        } for r in grievances],
    }, "my_requests")
    
    parts = []
    if leaves: parts.append(f"{len(leaves)} leave requests")
    if loans: parts.append(f"{len(loans)} loans")
    if docs: parts.append(f"{len(docs)} documents")
    if travel: parts.append(f"{len(travel)} travel requests")
    if grievances: parts.append(f"{len(grievances)} grievances")
    
    if not parts:
        return "You have no active requests."
    return f"You have: {', '.join(parts)}."


# ---- MANAGER TOOLS ----


@function_tool()
async def show_team_overview(context: RunContext):
    """Show overview of all direct reports with their current status. Call when manager wants to see team overview."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You are not a manager."
    emp = db.get_employee(emp_id)
    reports = db.get_direct_reports(emp_id)
    if not reports:
        return "You have no direct reports."
    att = db.get_team_attendance(emp_id)
    att_map = {a["name"].split()[0]: a["status"] for a in att}
    team = []
    for r in reports:
        first_name = r["name"].split()[0]
        status = att_map.get(first_name, "unknown")
        team.append({
            "id": r["id"],
            "name": r["name"],
            "position": r["position"],
            "department": r["department"],
            "status": status,
        })
    await _send_ui("TeamOverviewCard", {
        "managerName": emp["name"] if emp else "",
        "team": team,
    }, "main_card")
    return f"You have {len(team)} direct reports."


@function_tool()
async def show_department_stats(context: RunContext):
    """Show department statistics including headcount, leave, pending approvals, and attendance. Call when manager wants to see department stats."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You are not a manager."
    emp = db.get_employee(emp_id)
    stats = db.get_department_stats(emp_id)
    await _send_ui("ManagerDashboard", {
        "activeTab": "overview",
        "managerName": emp["name"] if emp else "",
        "department": emp["department"] if emp else "",
        "stats": stats,
    }, "main_card")
    return f"Department: {stats['headcount']} employees, {stats['on_leave']} on leave, {stats['pending_approvals']} pending, {stats['avg_attendance']}% attendance."


@function_tool()
async def show_leave_calendar(context: RunContext):
    """Show visual team leave calendar. Call when manager wants to see team leave calendar."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You are not a manager."
    emp = db.get_employee(emp_id)
    reports = db.get_direct_reports(emp_id)
    if not reports:
        return "You have no direct reports."
    conn = db.get_db()
    rows = conn.execute(
        """SELECT lr.employee_id, e.name, lr.start_date, lr.end_date, lr.leave_type, lr.status
           FROM leave_requests lr JOIN employees e ON lr.employee_id = e.id
           WHERE e.manager_id = ? AND lr.status = 'approved'""",
        (emp_id,),
    ).fetchall()
    conn.close()
    leaves = [dict(r) for r in rows]
    await _send_ui("ManagerDashboard", {
        "activeTab": "calendar",
        "managerName": emp["name"] if emp else "",
        "leaves": leaves,
    }, "main_card")
    return f"Showing {len(leaves)} approved leaves."


@function_tool()
async def show_dashboard(context: RunContext):
    """Show the employee's personal dashboard with stats, quick actions, and overview. Call at start of conversation or when user asks for dashboard/home."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Employee not found."
    is_mgr = db.is_manager(emp_id)
    loans = db.get_employee_loans(emp_id)
    docs = db.get_document_requests(emp_id)
    pending_docs = [d for d in docs if d["status"] in ("requested", "processing")]
    today_att = db.get_today_attendance(emp_id)
    anns = db.get_announcements(3)
    
    props = {
        "employeeName": emp["name"],
        "employeeId": emp["id"],
        "position": emp["position"],
        "department": emp["department"],
        "isManager": is_mgr,
        "leaveBalance": emp["leave_balance"],
        "activeLoans": len(loans),
        "pendingRequests": len(pending_docs),
        "announcements": len(anns),
        "todayAttendance": dict(today_att) if today_att else None,
    }
    
    if is_mgr:
        approvals = db.get_pending_approvals(emp_id)
        reports = db.get_direct_reports(emp_id)
        props["pendingApprovals"] = len(approvals)
        props["teamSize"] = len(reports)
    
    await _send_ui("QuickDashboard", props, "main_card")
    parts = [f"Dashboard for {emp['name']}."]
    if today_att and today_att.get("clock_in"):
        parts.append(f"Clocked in at {today_att['clock_in']}.")
    else:
        parts.append("Not clocked in yet.")
    parts.append(f"{emp['leave_balance']['annual']} annual leave days.")
    if is_mgr:
        parts.append(f"{props.get('pendingApprovals', 0)} pending approvals.")
    return " ".join(parts)


@function_tool()
async def show_leave_history(context: RunContext):
    """Show all leave requests with history. Call when user asks to see leave history or all leave requests."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Not found."
    reqs = db.get_leave_requests(emp_id)
    await _send_ui("LeaveHistoryCard", {
        "employeeName": emp["name"],
        "requests": reqs,
    }, "main_card")
    return f"{len(reqs)} leave request(s)."


# ---- ATTENDANCE TOOLS ----


@function_tool()
async def clock_me_in(context: RunContext, location: str = "office"):
    """Clock in the employee for today. Call when user says 'clock me in' or 'I'm at work'."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Employee not found."
    result = db.clock_in(emp_id, location)
    if "error" in result:
        await _send_ui("StatusBanner", {"message": result["error"], "type": "warning"}, "main_card")
        return result["error"]
    status = "on time" if result["status"] == "present" else "late"
    await _send_ui("ClockInCard", {
        "employeeName": emp["name"],
        "date": result["date"],
        "clockIn": result["clock_in"],
        "status": result["status"],
        "location": location,
        "mode": "clocked_in",
    }, "main_card")
    return f"Clocked in at {result['clock_in']}, {status}. Location: {location}."


@function_tool()
async def clock_me_out(context: RunContext):
    """Clock out the employee for today. Call when user says 'clock me out' or 'I'm leaving'."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Employee not found."
    result = db.clock_out(emp_id)
    if "error" in result:
        await _send_ui("StatusBanner", {"message": result["error"], "type": "warning"}, "main_card")
        return result["error"]
    await _send_ui("ClockInCard", {
        "employeeName": emp["name"],
        "date": result["date"],
        "clockIn": result["clock_in"],
        "clockOut": result["clock_out"],
        "hoursWorked": result["hours_worked"],
        "overtimeHours": result["overtime_hours"],
        "status": result["status"],
        "mode": "clocked_out",
    }, "main_card")
    return f"Clocked out at {result['clock_out']}. Worked {result['hours_worked']} hours."


@function_tool()
async def show_my_attendance(context: RunContext, days: int = 7):
    """Show my attendance for the last N days. Call when user asks about attendance history."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Employee not found."
    records = db.get_my_attendance(emp_id, days)
    today = db.get_today_attendance(emp_id)
    await _send_ui("MyAttendanceCard", {
        "employeeName": emp["name"],
        "records": records,
        "today": today,
        "days": days,
    }, "main_card")
    present = sum(1 for r in records if r["status"] in ("present", "late", "remote"))
    return f"{present}/{len(records)} days present in last {days} days."


@function_tool()
async def request_overtime_approval(context: RunContext, hours: float, reason: str):
    """Request overtime approval. Call when user wants to log overtime hours."""
    emp_id = get_current_employee_id_from_context()
    result = db.request_overtime(emp_id, hours, reason)
    if "error" in result:
        return result["error"]
    await _send_ui("StatusBanner", {
        "message": f"Overtime request: {hours}h - {reason}. Sent to manager.",
        "type": "success",
    }, "main_card")
    return f"Overtime of {hours} hours requested. Pending manager approval."


# ---- INTERVIEW TOOLS ----


@function_tool()
async def start_new_interview(context: RunContext, candidate_name: str, position: str = "General", stage: str = "hr_screening"):
    """Start a new AI-powered interview. Stage can be: hr_screening, technical, behavioral, leadership."""
    emp_id = get_current_employee_id_from_context()
    # Check if already has active interview
    active = db.get_current_interview(emp_id)
    if active:
        await _send_ui("StatusBanner", {
            "message": f"You have an active interview ({active['ref']}) with {active['candidate_name']}. Complete it first.",
            "type": "warning",
        }, "main_card")
        return f"Active interview exists: {active['ref']} with {active['candidate_name']}."
    
    iv = db.start_interview(emp_id, candidate_name, position, stage)
    q = db.get_interview_question(iv["id"], 0)
    
    await _send_ui("InterviewPanel", {
        "title": f"{stage.replace('_', ' ').title()} Interview",
        "candidateName": candidate_name,
        "position": position,
        "currentQuestion": 1,
        "totalQuestions": iv["total_questions"],
        "question": q["question"],
        "questionType": q["type"],
        "timeMinutes": q["time_minutes"],
        "scores": [],
        "status": "in_progress",
        "interviewRef": iv["ref"],
        "stage": stage,
    }, "main_card")
    return f"Interview {iv['ref']} started! {stage.replace('_', ' ').title()} for {candidate_name} ({position}). Question 1: {q['question']}"


@function_tool()
async def score_current_answer(context: RunContext, score: int, feedback: str = ""):
    """Score the candidate's answer (1-5) and move to next question. 1=Poor, 2=Below Average, 3=Average, 4=Good, 5=Excellent."""
    emp_id = get_current_employee_id_from_context()
    iv = db.get_current_interview(emp_id)
    if not iv:
        return "No active interview. Start one first."
    
    current_q = iv["current_question"]
    result = db.score_answer(iv["id"], current_q, score, feedback)
    if "error" in result:
        return result["error"]
    
    # Get all scores so far
    responses = db.get_interview_responses(iv["id"])
    all_scores = [r["score"] for r in responses]
    
    # Check if interview is complete
    if current_q + 1 >= iv["total_questions"]:
        completed = db.complete_interview(iv["id"])
        await _send_ui("InterviewPanel", {
            "title": f"{iv['stage'].replace('_', ' ').title()} Interview",
            "candidateName": iv["candidate_name"],
            "position": iv["position"],
            "currentQuestion": iv["total_questions"],
            "totalQuestions": iv["total_questions"],
            "question": "",
            "questionType": "",
            "timeMinutes": 0,
            "scores": all_scores,
            "status": "completed",
            "averageScore": completed["average_score"],
            "interviewRef": iv["ref"],
        }, "main_card")
        return f"Interview complete! Average score: {completed['average_score']}/5. {candidate_rating(completed['average_score'])}"
    
    # Get next question
    next_q = db.get_interview_question(iv["id"], current_q + 1)
    await _send_ui("InterviewPanel", {
        "title": f"{iv['stage'].replace('_', ' ').title()} Interview",
        "candidateName": iv["candidate_name"],
        "position": iv["position"],
        "currentQuestion": current_q + 2,
        "totalQuestions": iv["total_questions"],
        "question": next_q["question"],
        "questionType": next_q["type"],
        "timeMinutes": next_q["time_minutes"],
        "scores": all_scores,
        "status": "in_progress",
        "interviewRef": iv["ref"],
    }, "main_card")
    return f"Scored {score}/5. Next question {current_q + 2}: {next_q['question']}"


@function_tool()
async def show_interview_results(context: RunContext):
    """Show results of the last completed interview."""
    emp_id = get_current_employee_id_from_context()
    conn = db.get_db()
    row = conn.execute(
        "SELECT * FROM interviews WHERE interviewer_id = ? ORDER BY completed_at DESC LIMIT 1",
        (emp_id,)
    ).fetchone()
    conn.close()
    if not row:
        return "No interviews found."
    iv = dict(row)
    responses = db.get_interview_responses(iv["id"])
    all_scores = [r["score"] for r in responses]
    
    await _send_ui("InterviewPanel", {
        "title": f"{iv['stage'].replace('_', ' ').title()} Interview",
        "candidateName": iv["candidate_name"],
        "position": iv["position"],
        "currentQuestion": iv["total_questions"],
        "totalQuestions": iv["total_questions"],
        "question": "",
        "questionType": "",
        "timeMinutes": 0,
        "scores": all_scores,
        "status": iv["status"],
        "averageScore": iv["average_score"],
        "interviewRef": iv["ref"],
    }, "main_card")
    return f"Interview {iv['ref']}: {iv['candidate_name']} for {iv['position']}. Score: {iv['average_score']}/5."


def candidate_rating(score: float) -> str:
    if score >= 4.5: return "Strongly recommend hiring."
    if score >= 3.5: return "Recommend hiring."
    if score >= 2.5: return "Consider with reservations."
    return "Do not recommend."


# ---- PERFORMANCE REVIEW TOOLS ----


@function_tool()
async def show_my_performance(context: RunContext):
    """Show employee's latest performance review and rating."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp: return "Not found."
    reviews = db.get_employee_reviews(emp_id)
    goals = db.get_goals(emp_id)
    if not reviews:
        await _send_ui("StatusBanner", {"message": "No performance reviews yet.", "type": "info"}, "main_card")
        return "No reviews found."
    r = reviews[0]
    await _send_ui("PerformanceReviewCard", {
        "employeeName": emp["name"], "period": r["period"], "rating": r["rating"],
        "goalsMet": r["goals_met"], "totalGoals": r["total_goals"],
        "strengths": r["strengths"], "improvements": r["improvements"],
        "comments": r.get("comments", ""), "reviewerName": r.get("reviewer_name", ""),
        "status": r["status"], "goals": goals,
    }, "main_card")
    return f"Rating: {r['rating']}/5 for {r['period']}. {r['goals_met']}/{r['total_goals']} goals met."


@function_tool()
async def create_performance_review(context: RunContext, employee_id: str, rating: int, strengths: str, improvements: str, comments: str = ""):
    """Create a performance review for a team member. Manager only. Rating 1-5."""
    reviewer_id = get_current_employee_id_from_context()
    if not db.is_manager(reviewer_id):
        return "Only managers can create reviews."
    rv = db.create_review(reviewer_id, employee_id, "Q1 2026", rating, strengths, improvements, comments)
    emp = db.get_employee(employee_id)
    db.create_notification(employee_id, "review", "Performance Review", f"Your Q1 2026 review is ready. Rating: {rating}/5")
    await _send_ui("StatusBanner", {"message": f"Review created for {emp['name'] if emp else employee_id}: {rating}/5", "type": "success"}, "main_card")
    return f"Review created. {emp['name'] if emp else employee_id} rated {rating}/5."


@function_tool()
async def show_my_goals(context: RunContext):
    """Show employee's performance goals with progress."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp: return "Not found."
    goals = db.get_goals(emp_id)
    await _send_ui("GoalsCard", {
        "employeeName": emp["name"], "goals": goals,
    }, "main_card")
    active = sum(1 for g in goals if g["status"] == "active")
    completed = sum(1 for g in goals if g["status"] == "completed")
    return f"{len(goals)} goals: {active} active, {completed} completed."


@function_tool()
async def set_new_goal(context: RunContext, goal: str, target: str, due_date: str = "2026-06-30"):
    """Set a new performance goal."""
    emp_id = get_current_employee_id_from_context()
    g = db.set_goal(emp_id, goal, target, due_date)
    await _send_ui("StatusBanner", {"message": f"Goal set: {goal}. Due: {due_date}", "type": "success"}, "main_card")
    return f"Goal created: {goal}, target: {target}, due: {due_date}."


@function_tool()
async def update_goal(context: RunContext, goal_id: int, progress: int):
    """Update progress on a goal (0-100%)."""
    r = db.update_goal_progress(goal_id, progress)
    if "error" in r: return r["error"]
    status = "completed!" if r["status"] == "completed" else f"{progress}% done"
    await _send_ui("StatusBanner", {"message": f"Goal updated: {status}", "type": "success"}, "main_card")
    return f"Goal {goal_id} updated to {progress}%. {status}"


# ---- TRAINING TOOLS ----


@function_tool()
async def show_available_trainings(context: RunContext):
    """Show available training courses to enroll in."""
    courses = db.get_available_courses()
    await _send_ui("TrainingCatalogCard", {"courses": courses}, "main_card")
    mandatory = sum(1 for c in courses if c["mandatory"])
    return f"{len(courses)} courses available ({mandatory} mandatory)."


@function_tool()
async def enroll_in_training(context: RunContext, course_id: int):
    """Enroll in a training course."""
    emp_id = get_current_employee_id_from_context()
    r = db.enroll_in_course(emp_id, course_id)
    if "error" in r:
        await _send_ui("StatusBanner", {"message": r["error"], "type": "warning"}, "main_card")
        return r["error"]
    await _send_ui("StatusBanner", {"message": f"Enrolled in {r.get('title', 'course')}!", "type": "success"}, "main_card")
    return f"Enrolled in course {r.get('title', course_id)}."


@function_tool()
async def show_my_trainings(context: RunContext):
    """Show my enrolled and completed training courses."""
    emp_id = get_current_employee_id_from_context()
    trainings = db.get_my_trainings(emp_id)
    stats = db.get_training_stats(emp_id)
    await _send_ui("MyTrainingsCard", {"trainings": trainings, "stats": stats}, "main_card")
    return f"{stats['completed']}/{stats['total_enrolled']} completed. Compliance: {stats['compliance']}%."


# ---- GRIEVANCE TOOLS ----


@function_tool()
async def file_grievance(context: RunContext, category: str, subject: str, description: str, severity: str = "medium"):
    """File a grievance or complaint. Categories: harassment, discrimination, safety, policy, compensation, other. Severity: low, medium, high, critical."""
    emp_id = get_current_employee_id_from_context()
    g = db.submit_grievance(emp_id, category, subject, description, severity)
    await _send_ui("GrievanceListCard", {
        "grievances": [g], "mode": "submitted",
    }, "main_card")
    return f"Grievance {g['ref']} filed. Category: {category}, severity: {severity}. HR will review."


@function_tool()
async def show_my_grievances(context: RunContext):
    """Show my filed grievances and their status."""
    emp_id = get_current_employee_id_from_context()
    grievances = db.get_my_grievances(emp_id)
    await _send_ui("GrievanceListCard", {"grievances": grievances}, "main_card")
    pending = sum(1 for g in grievances if g["status"] not in ("resolved", "closed"))
    return f"{len(grievances)} grievance(s), {pending} pending."


# ---- NOTIFICATION TOOLS ----


@function_tool()
async def show_notifications(context: RunContext):
    """Show unread notifications."""
    emp_id = get_current_employee_id_from_context()
    notifs = db.get_unread_notifications(emp_id)
    all_notifs = db.get_all_notifications(emp_id)
    await _send_ui("NotificationCard", {"notifications": all_notifs, "unreadCount": len(notifs)}, "main_card")
    return f"{len(notifs)} unread notification(s)."


# ---- AGENT TOOLS LIST ----

# ── Manager: Comprehensive Approval Tools ───────────────

@function_tool
async def approve_loan_request(
    context: RunContext,
    employee_name: str = "",
    decision: str = "approved",
):
    """Approve or reject a pending loan. Say the employee name (e.g. 'approve Sara loan')."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    
    pending = db.get_pending_loan_requests(emp_id)
    if not pending:
        return "No pending loan requests."
    
    if employee_name:
        name_lower = employee_name.lower()
        matched = [p for p in pending if name_lower in p["employee_name"].lower()]
        if len(matched) == 1:
            result = db.approve_loan(matched[0]["ref"], decision)
            if result:
                await _send_ui("StatusBanner", {
                    "message": f"Loan {decision}: {result['employee_name']} - {result['amount']:,.0f} SAR",
                    "type": "success" if decision == "approved" else "warning",
                }, f"loan_approval_{matched[0]['ref']}")
                return f"{result['employee_name']}'s loan has been {decision}."
        elif len(matched) > 1:
            return "Multiple matches. " + ", ".join(f"{p['employee_name']} ({p['loan_type']} {p['amount']:,.0f} SAR)" for p in matched)
    
    items = [f"- {p['employee_name']}: {p['loan_type']} {p['amount']:,.0f} SAR ({p['installments_left']} months)" for p in pending]
    return f"{len(pending)} pending loans:\n" + "\n".join(items)


@function_tool
async def approve_travel_request(
    context: RunContext,
    employee_name: str = "",
    decision: str = "approved",
):
    """Approve or reject a travel request. Say the employee name."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    
    pending = db.get_pending_travel_requests(emp_id)
    if not pending:
        return "No pending travel requests."
    
    if employee_name:
        name_lower = employee_name.lower()
        matched = [p for p in pending if name_lower in p["employee_name"].lower()]
        if len(matched) == 1:
            result = db.approve_travel(matched[0]["ref"], decision)
            if result:
                await _send_ui("StatusBanner", {
                    "message": f"Travel {decision}: {result['employee_name']} to {result['destination']}",
                    "type": "success" if decision == "approved" else "warning",
                }, f"travel_approval_{matched[0]['ref']}")
                return f"{result['employee_name']}'s travel request has been {decision}."
    
    items = [f"- {p['employee_name']} to {p['destination']} ({p['days']} days)" for p in pending]
    return f"{len(pending)} pending travel requests:\n" + "\n".join(items)


@function_tool
async def approve_overtime_request(
    context: RunContext,
    record_id: int = 0,
    decision: str = "approved",
):
    """Approve or reject an overtime request."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    
    if not record_id:
        pending = db.get_pending_overtime_requests(emp_id)
        if not pending:
            return "No pending overtime requests."
        items = []
        for p in pending:
            items.append(f"ID {p['id']}: {p['employee_name']} - {p['overtime_hours']}h on {p['date']} ({p.get('notes', 'No reason')})")
        return f"Pending overtime requests:\n" + "\n".join(items)
    
    result = db.approve_overtime(record_id, decision)
    if result:
        await _send_ui("StatusBanner", {
            "message": f"Overtime {decision}: {result['employee_name']} - {result['overtime_hours']}h on {result['date']}",
            "type": "success" if decision == "approved" else "warning",
        }, f"ot_approval_{record_id}")
        return f"Overtime request {decision}."
    return "Overtime request not found."


@function_tool
async def approve_document_request(
    context: RunContext,
    employee_name: str = "",
    decision: str = "ready",
):
    """Approve a document request. Say the employee name. Decision: 'ready' or 'rejected'."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    
    pending = db.get_pending_document_requests(emp_id)
    if not pending:
        return "No pending document requests."
    
    if employee_name:
        name_lower = employee_name.lower()
        matched = [p for p in pending if name_lower in p["employee_name"].lower()]
        if len(matched) == 1:
            result = db.approve_document(matched[0]["ref"], decision)
            if result:
                await _send_ui("StatusBanner", {
                    "message": f"Document {decision}: {result['employee_name']} - {result['document_type']}",
                    "type": "success",
                }, f"doc_approval_{matched[0]['ref']}")
                return f"{result['employee_name']}'s document request marked as {decision}."
    
    items = [f"- {p['employee_name']}: {p['document_type']} ({p['status']})" for p in pending]
    return f"{len(pending)} pending documents:\n" + "\n".join(items)


# ── Manager: Grievance Management ───────────────────────

@function_tool
async def show_team_grievances(context: RunContext):
    """Show all grievances from team members. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    
    grievances = db.get_department_grievances(emp_id)
    if not grievances:
        return "No grievances from your team."
    
    await _send_ui("GrievanceListCard", {
        "grievances": [{
            "ref": g["ref"],
            "category": g["category"],
            "subject": g["subject"],
            "severity": g["severity"],
            "status": g["status"],
            "employeeName": g.get("employee_name", "Unknown"),
            "submittedAt": g["submitted_at"],
        } for g in grievances],
        "isManager": True,
    }, "team_grievances")
    
    return f"Found {len(grievances)} grievances from your team."


@function_tool
async def resolve_team_grievance(
    context: RunContext,
    reference: str = "",
    resolution: str = "",
):
    """Resolve a grievance with a resolution note. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    
    if not reference or not resolution:
        return "Please provide the grievance reference and resolution."
    
    result = db.resolve_grievance(reference, resolution)
    if result and "error" not in result:
        await _send_ui("StatusBanner", {
            "message": f"Grievance {reference} resolved",
            "type": "success",
        }, f"grievance_resolved_{reference}")
        return f"Grievance {reference} has been resolved."
    return f"Could not resolve grievance {reference}."


# ── Manager: Team Analytics ─────────────────────────────

@function_tool
async def show_team_performance(context: RunContext):
    """Show performance summary for all direct reports. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    
    summary = db.get_team_performance_summary(emp_id)
    if not summary:
        return "No direct reports found."
    
    await _send_ui("TeamPerformanceCard", {
        "employees": [{
            "employeeId": s["employee_id"],
            "name": s["name"],
            "position": s["position"],
            "rating": s["latest_rating"],
            "reviewPeriod": s["review_period"],
            "goalsTotal": s["goals_total"],
            "goalsCompleted": s["goals_completed"],
            "trainingsEnrolled": s["trainings_enrolled"],
            "trainingsCompleted": s["trainings_completed"],
            "attendanceDays": s["attendance_days"],
            "attendancePresent": s["attendance_present"],
        } for s in summary],
    }, "team_performance")
    
    return f"Performance summary for {len(summary)} team members."


@function_tool
async def show_team_training_compliance(context: RunContext):
    """Show training compliance for all direct reports. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    
    compliance = db.get_team_training_compliance(emp_id)
    if not compliance:
        return "No direct reports found."
    
    await _send_ui("TeamTrainingCard", {
        "employees": [{
            "employeeId": c["employee_id"],
            "name": c["name"],
            "position": c["position"],
            "totalEnrolled": c["total_enrolled"],
            "completed": c["completed"],
            "mandatoryTotal": c["mandatory_total"],
            "mandatoryCompleted": c["mandatory_completed"],
            "compliance": c["compliance"],
        } for c in compliance],
    }, "team_training")
    
    return f"Training compliance for {len(compliance)} team members."


@function_tool
async def show_all_pending_approvals(context: RunContext):
    """Show ALL pending items across all categories. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    
    all_pending = db.get_all_pending_for_manager(emp_id)
    
    counts = {k: len(v) for k, v in all_pending.items()}
    total = sum(counts.values())
    
    await _send_ui("ManagerPendingCard", {
        "leaveRequests": [{
            "ref": r["ref"], "employeeName": r["employee_name"],
            "leaveType": r["leave_type"], "days": r["days"],
            "startDate": r["start_date"], "reason": r.get("reason", ""),
        } for r in all_pending["leave_requests"]],
        "loanRequests": [{
            "ref": r["ref"], "employeeName": r["employee_name"],
            "loanType": r["loan_type"], "amount": r["amount"],
            "installments": r["installments_left"],
        } for r in all_pending["loan_requests"]],
        "travelRequests": [{
            "ref": r["ref"], "employeeName": r["employee_name"],
            "destination": r["destination"], "days": r["days"],
            "allowance": r["total_allowance"],
        } for r in all_pending["travel_requests"]],
        "overtimeRequests": [{
            "id": r["id"], "employeeName": r["employee_name"],
            "hours": r["overtime_hours"], "date": r["date"],
            "reason": r.get("notes", ""),
        } for r in all_pending["overtime_requests"]],
        "documentRequests": [{
            "ref": r["ref"], "employeeName": r["employee_name"],
            "documentType": r["document_type"], "status": r["status"],
        } for r in all_pending["document_requests"]],
        "grievances": [{
            "ref": r["ref"], "employeeName": r.get("employee_name", ""),
            "category": r["category"], "severity": r["severity"],
            "subject": r["subject"],
        } for r in all_pending["grievances"]],
        "pendingReviews": [{
            "employeeId": r["id"], "name": r["name"],
            "position": r["position"],
        } for r in all_pending["pending_reviews"]],
        "counts": counts,
        "total": total,
    }, "all_pending")
    
    summary_parts = []
    if counts["leave_requests"]: summary_parts.append(f"{counts['leave_requests']} leave")
    if counts["loan_requests"]: summary_parts.append(f"{counts['loan_requests']} loan")
    if counts["travel_requests"]: summary_parts.append(f"{counts['travel_requests']} travel")
    if counts["overtime_requests"]: summary_parts.append(f"{counts['overtime_requests']} overtime")
    if counts["document_requests"]: summary_parts.append(f"{counts['document_requests']} document")
    if counts["grievances"]: summary_parts.append(f"{counts['grievances']} grievance")
    if counts["pending_reviews"]: summary_parts.append(f"{counts['pending_reviews']} review")
    
    if total == 0:
        return "All clear! No pending items."
    return f"You have {total} pending items: {', '.join(summary_parts)}."


@function_tool
async def show_leave_analytics(context: RunContext):
    """Show leave analytics for your team. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    
    analytics = db.get_leave_analytics(emp_id)
    
    await _send_ui("LeaveAnalyticsCard", {
        "totalRequests": analytics["total_requests"],
        "byType": analytics["by_type"],
        "byStatus": analytics["by_status"],
    }, "leave_analytics")
    
    return f"Leave analytics: {analytics['total_requests']} total requests."


@function_tool
async def show_headcount_report(context: RunContext):
    """Show headcount breakdown by department. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    
    breakdown = db.get_headcount_by_department()
    total = sum(d["count"] for d in breakdown)
    
    await _send_ui("HeadcountCard", {
        "departments": [{
            "department": d["department"],
            "count": d["count"],
            "percentage": round(d["count"] / total * 100) if total > 0 else 0,
        } for d in breakdown],
        "total": total,
    }, "headcount")
    
    return f"Total headcount: {total} across {len(breakdown)} departments."


@function_tool
async def reassign_team_member(
    context: RunContext,
    employee_id: str = "",
    new_manager_id: str = "",
):
    """Reassign an employee to a different manager. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    
    if not employee_id or not new_manager_id:
        reports = db.get_direct_reports(emp_id)
        all_mgrs = [e for e in db.get_all_employees_summary() if db.is_manager(e["id"])]
        report_list = ", ".join(f"{r['id']} ({r['name']})" for r in reports)
        mgr_list = ", ".join(f"{m['id']} ({m['name']})" for m in all_mgrs)
        return f"Your reports: {report_list}. Available managers: {mgr_list}. Specify employee_id and new_manager_id."
    
    result = db.reassign_employee(employee_id, new_manager_id)
    if "error" not in result:
        new_mgr = db.get_employee(new_manager_id)
        await _send_ui("StatusBanner", {
            "message": f"{result['name']} reassigned to {new_mgr['name'] if new_mgr else new_manager_id}",
            "type": "success",
        }, "reassignment")
        return f"{result['name']} has been reassigned to {new_mgr['name'] if new_mgr else new_manager_id}."
    return result.get("error", "Failed to reassign.")


@function_tool
async def show_employee_details(
    context: RunContext,
    employee_id: str = "",
):
    """View full details of a team member. Manager only."""
    mgr_id = get_current_employee_id_from_context()
    if not db.is_manager(mgr_id):
        return "You don't have manager access."
    
    if not employee_id:
        reports = db.get_direct_reports(mgr_id)
        return "Your team: " + ", ".join(f"{r['id']} ({r['name']})" for r in reports) + ". Which employee?"
    
    emp = db.get_employee(employee_id)
    if not emp:
        return f"Employee {employee_id} not found."
    
    # Get comprehensive data
    leaves = db.get_leave_requests(employee_id)
    loans = db.get_employee_loans(employee_id)
    reviews = db.get_employee_reviews(employee_id)
    goals = db.get_goals(employee_id)
    trainings = db.get_my_trainings(employee_id)
    grievances = db.get_my_grievances(employee_id)
    training_stats = db.get_training_stats(employee_id)
    
    await _send_ui("EmployeeDetailCard", {
        "employee": {
            "id": emp["id"], "name": emp["name"], "nameAr": emp.get("name_ar"),
            "position": emp["position"], "department": emp["department"],
            "email": emp.get("email"), "phone": emp.get("phone"),
            "joinDate": emp["join_date"], "grade": emp.get("grade"),
            "nationality": emp.get("nationality"),
            "salary": emp["salary"], "leaveBalance": emp["leave_balance"],
        },
        "leaveRequests": len(leaves),
        "pendingLeaves": len([l for l in leaves if l["status"] == "pending"]),
        "activeLoans": len(loans),
        "loanBalance": sum(l.get("remaining", 0) for l in loans),
        "reviews": [{
            "period": r["period"], "rating": r["rating"],
        } for r in reviews[:3]],
        "goalsTotal": len(goals),
        "goalsCompleted": len([g for g in goals if g["status"] == "completed"]),
        "trainingCompliance": training_stats["compliance"],
        "trainingsCompleted": training_stats["completed"],
        "grievanceCount": len(grievances),
        "openGrievances": len([g for g in grievances if g["status"] not in ("resolved", "closed")]),
    }, f"employee_detail_{employee_id}")
    
    return f"Showing full details for {emp['name']}."



# ── Expense Management Tools ────────────────────────────

@function_tool
async def submit_expense(ctx: RunContext, category: str, description: str, amount: float, expense_date: str) -> str:
    """Submit a new expense claim. Categories: travel, meals, office_supplies, training, communication, other."""
    emp_id = get_current_employee_id_from_context()
    result = db.create_expense(emp_id, category, description, amount, expense_date)
    await _send_ui("ExpenseListCard", {
        "expenses": db.get_employee_expenses(emp_id),
        "summary": db.get_expense_summary(emp_id),
    }, f"expenses_{emp_id}")
    return f"Expense {result['ref']} submitted for {amount} SAR. Category: {category}. Pending manager approval."

@function_tool
async def show_my_expenses(ctx: RunContext) -> str:
    """Show the employee's expense history and summary."""
    emp_id = get_current_employee_id_from_context()
    expenses = db.get_employee_expenses(emp_id)
    summary = db.get_expense_summary(emp_id)
    await _send_ui("ExpenseListCard", {
        "expenses": expenses,
        "summary": summary,
    }, f"expenses_{emp_id}")
    if not expenses:
        return "You have no expenses on record."
    return f"You have {len(expenses)} expenses. {summary.get('pending', 0)} pending, {summary.get('approved', 0)} approved."

@function_tool
async def show_expense_form(ctx: RunContext) -> str:
    """Show the interactive expense submission form."""
    await _send_ui("ExpenseForm", {
        "categories": ["travel", "meals", "office_supplies", "training", "communication", "other"],
    }, "expense_form")
    return "Here's the expense form. Fill in the details and submit."

@function_tool
async def approve_expense_request(ctx: RunContext, ref: str, decision: str) -> str:
    """Approve or reject an expense request. Decision: approved/rejected."""
    result = db.approve_expense(ref, decision)
    if not result:
        return f"Expense {ref} not found or already processed."
    return f"Expense {ref} has been {result['status']}."

@function_tool
async def show_pending_expenses(ctx: RunContext) -> str:
    """Show all pending expense requests for manager approval."""
    emp_id = get_current_employee_id_from_context()
    pending = db.get_pending_expenses(emp_id)
    if not pending:
        return "No pending expense requests."
    await _send_ui("ExpenseApprovalCard", {
        "expenses": pending,
    }, "pending_expenses")
    return f"You have {len(pending)} pending expense requests to review."


# ── Claims Management Tools ─────────────────────────────

@function_tool
async def submit_claim(ctx: RunContext, claim_type: str, description: str, amount: float) -> str:
    """Submit an insurance/reimbursement claim. Types: medical, dental, vision, education, relocation, other."""
    emp_id = get_current_employee_id_from_context()
    result = db.submit_claim(emp_id, claim_type, description, amount)
    await _send_ui("ClaimListCard", {
        "claims": db.get_employee_claims(emp_id),
    }, f"claims_{emp_id}")
    return f"Claim {result['ref']} submitted for {amount} SAR. Type: {claim_type}. Pending review."

@function_tool
async def show_my_claims(ctx: RunContext) -> str:
    """Show the employee's claims history."""
    emp_id = get_current_employee_id_from_context()
    claims = db.get_employee_claims(emp_id)
    await _send_ui("ClaimListCard", {
        "claims": claims,
    }, f"claims_{emp_id}")
    if not claims:
        return "You have no claims on record."
    pending = len([c for c in claims if c.get("status") == "pending"])
    return f"You have {len(claims)} claims. {pending} pending."

@function_tool
async def show_claim_form(ctx: RunContext) -> str:
    """Show the interactive claim submission form."""
    await _send_ui("ClaimForm", {
        "types": ["medical", "dental", "vision", "education", "relocation", "other"],
    }, "claim_form")
    return "Here's the claim form. Fill in the details and submit."

@function_tool
async def approve_claim_request(ctx: RunContext, ref: str, decision: str) -> str:
    """Approve or reject a claim. Decision: approved/rejected."""
    result = db.approve_claim(ref, decision)
    if not result:
        return f"Claim {ref} not found or already processed."
    return f"Claim {ref} has been {result['status']}."

@function_tool
async def show_pending_claims(ctx: RunContext) -> str:
    """Show all pending claims for manager review."""
    emp_id = get_current_employee_id_from_context()
    pending = db.get_pending_claims(emp_id)
    if not pending:
        return "No pending claims."
    await _send_ui("ClaimApprovalCard", {
        "claims": pending,
    }, "pending_claims")
    return f"You have {len(pending)} pending claims to review."


# ── Payments Management Tools ───────────────────────────

@function_tool
async def show_my_payments(ctx: RunContext) -> str:
    """Show the employee's payment history (salary, reimbursements, bonuses)."""
    emp_id = get_current_employee_id_from_context()
    payments = db.get_employee_payments(emp_id)
    summary = db.get_payment_summary(emp_id)
    await _send_ui("PaymentListCard", {
        "payments": payments,
        "summary": summary,
    }, f"payments_{emp_id}")
    if not payments:
        return "No payment records found."
    return f"You have {len(payments)} payment records. Total received: {summary.get('total_received', 0)} SAR."

@function_tool
async def show_all_payments_admin(ctx: RunContext) -> str:
    """Show all payments across the organization (manager/admin only)."""
    payments = db.get_all_payments()
    await _send_ui("PaymentListCard", {
        "payments": payments,
        "isAdmin": True,
    }, "all_payments")
    return f"Showing {len(payments)} payment records across all employees."


ALL_TOOLS = [
    # Dashboard
    show_dashboard,
    show_leave_history,
    # Interactive forms
    show_leave_form,
    show_document_form,
    show_loan_form,
    show_travel_form,
    show_profile_edit,
    # Read
    check_leave_balance,
    show_my_leave_requests,
    show_pending_approvals,
    show_my_profile,
    show_pay_slip,
    check_loan_eligibility,
    show_loan_balance,
    show_my_documents,
    show_announcements,
    show_team_attendance,
    show_status,
    # CRUD
    apply_for_leave,
    approve_leave,
    apply_for_loan,
    request_document,
    create_travel_request,
    # Attendance
    clock_me_in,
    clock_me_out,
    show_my_attendance,
    request_overtime_approval,
    # Interview
    start_new_interview,
    score_current_answer,
    show_interview_results,
    # Performance
    show_my_performance,
    create_performance_review,
    show_my_goals,
    set_new_goal,
    update_goal,
    # Training
    show_available_trainings,
    enroll_in_training,
    show_my_trainings,
    # Grievance
    file_grievance,
    show_my_grievances,
    # Notifications
    show_notifications,
    # All Requests
    show_my_requests,
    # Expenses
    submit_expense,
    show_my_expenses,
    show_expense_form,
    # Claims
    submit_claim,
    show_my_claims,
    show_claim_form,
    # Payments
    show_my_payments,
    # Manager - Basic
    show_team_overview,
    show_department_stats,
    show_leave_calendar,
    # Manager - Approvals
    approve_loan_request,
    approve_travel_request,
    approve_overtime_request,
    approve_document_request,
    # Manager - Grievance
    show_team_grievances,
    resolve_team_grievance,
    # Manager - Analytics
    show_team_performance,
    show_team_training_compliance,
    show_all_pending_approvals,
    show_leave_analytics,
    show_headcount_report,
    # Manager - Expenses & Claims
    approve_expense_request,
    show_pending_expenses,
    approve_claim_request,
    show_pending_claims,
    show_all_payments_admin,
    # Manager - Administration
    reassign_team_member,
    show_employee_details,
]

MANAGER_ONLY_TOOLS = {
    "show_team_overview", "show_department_stats", "show_leave_calendar",
    "create_performance_review",
    "approve_loan_request", "approve_travel_request", "approve_overtime_request",
    "approve_document_request",
    "show_team_grievances", "resolve_team_grievance",
    "show_team_performance", "show_team_training_compliance",
    "show_all_pending_approvals", "show_leave_analytics", "show_headcount_report",
    "reassign_team_member", "show_employee_details",
    "approve_expense_request", "show_pending_expenses", "approve_claim_request", "show_pending_claims", "show_all_payments_admin",
}


def get_tools_for_employee(emp_id: str):
    tools = list(ALL_TOOLS)
    if not db.is_manager(emp_id):
        tools = [t for t in tools if t.__name__ not in MANAGER_ONLY_TOOLS]
    return tools


class TaliqAgent(Agent):
    def __init__(self):
        emp_id = get_current_employee_id_from_context()
        emp = db.get_employee(emp_id) or {}
        super().__init__(
            instructions=SYSTEM_PROMPT.format(
                employee_name=emp.get("name", "Unknown"),
                employee_id=emp_id,
                department=emp.get("department", "Unknown"),
                grade=emp.get("grade", "N/A"),
            ),
            tools=get_tools_for_employee(emp_id),
        )


async def _handle_data(data: rtc.DataPacket):
    global _session_ref
    if not _session_ref:
        return
    try:
        msg = json.loads(data.data.decode("utf-8"))
    except Exception:
        return

    text = ""
    msg_type = msg.get("type", "")

    if msg_type == "user_text":
        text = msg.get("text", "").strip()

    elif msg_type == "user_action":
        action = msg.get("action", "")
        action_map = {
            # Form submissions from interactive cards
            # Expense form
            "submit_expense": lambda d: f"Submit expense: {d.get('category','')} - {d.get('description','')} - {d.get('amount',0)} SAR on {d.get('expense_date','')}",
            "submit_claim": lambda d: f"Submit claim: {d.get('claim_type','')} - {d.get('description','')} - {d.get('amount',0)} SAR",
            "submit_leave": lambda: f"Submit leave request: {msg.get('leave_type', 'annual')} leave from {msg.get('start_date', '')} to {msg.get('end_date', '')}, {msg.get('days', 0)} days, reason: {msg.get('reason', 'personal')}",
            "submit_loan": lambda: f"Apply for {msg.get('loan_type', 'Interest-Free')} loan of {msg.get('amount', 0)} SAR over {msg.get('months', 12)} months",
            "submit_document_request": lambda: f"Request a {msg.get('document_type', 'Salary Certificate')}",
            "submit_travel": lambda: f"Create travel request to {msg.get('destination', '')} from {msg.get('start_date', '')} to {msg.get('end_date', '')}, {msg.get('days', 0)} days, {msg.get('travel_type', 'business')}",
            "update_profile": lambda: f"Update profile: phone={msg.get('phone', '')}, email={msg.get('email', '')}",
            # Card button actions
            "approve_leave": lambda: f"Approve leave {msg.get('request_id', '')} decision {msg.get('decision', 'approved')}",
            "check_leave_balance": lambda: "Show my leave balance",
            "show_pay_slip": lambda: "Show my pay slip",
            "request_document": lambda: f"Request a {msg.get('document_type', 'Salary Certificate')}",
            "apply_leave_prompt": lambda: "I want to apply for leave. Show the leave form.",
            "download_payslip": lambda: f"Show pay slip for {msg.get('month', 'this month')}",
            "apply_loan": lambda: "I want to apply for a loan. Show the loan form.",
            "clock_in": lambda: f"Clock me in at {msg.get('location', 'office')}",
            "clock_out": lambda: "Clock me out",
        }
        handler = action_map.get(action)
        text = handler() if handler else f"User action: {action}"

    if not text:
        return

    logger.info(f"Input: {text}")
    try:
        _session_ref.generate_reply(user_input=text)
    except Exception as e:
        logger.error(f"Reply error: {e}")




async def entrypoint(ctx: JobContext):
    global _room_ref, _session_ref
    logger.info("Entrypoint starting...")
    try:
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    except Exception as e:
        logger.error(f"Failed to connect: {e}")
        return
    _room_ref = ctx.room
    logger.info(f"Connected to room: {ctx.room.name}, metadata: {ctx.room.metadata}")

    employee_id = DEFAULT_EMPLOYEE_ID
    if ctx.room.metadata:
        try:
            metadata = json.loads(ctx.room.metadata)
            employee_id = metadata.get("employee_id", DEFAULT_EMPLOYEE_ID)
            lang = metadata.get("lang", "en")
            logger.info(f"Language: {lang}")
        except (json.JSONDecodeError, TypeError):
            pass
    lang = locals().get("lang", "en")
    set_current_employee_id(employee_id)

    session = AgentSession(
        vad=silero.VAD.load(
            min_silence_duration=0.8,
            activation_threshold=0.25,
            prefix_padding_duration=0.3,
        ),
        stt=deepgram.STT(model="nova-3", language="ar" if lang == "ar" else "en"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=EdgeTTS(voice="ar-SA-HamedNeural") if lang == "ar" else openai.TTS(
            model="speaches-ai/Kokoro-82M-v1.0-ONNX",
            voice="af_heart",
            base_url=os.getenv("SPEACHES_URL", "http://localhost:8000") + "/v1",
            api_key="not-needed",
        ),
        allow_interruptions=True,
        min_endpointing_delay=0.3,
        max_endpointing_delay=2.5,
        min_interruption_duration=0.08,
    )
    _session_ref = session

    @ctx.room.on("data_received")
    def on_data(pkt: rtc.DataPacket):
        if pkt.topic in ("lk-chat", "user_action"):
            asyncio.ensure_future(_handle_data(pkt))

    await session.start(room=ctx.room, agent=TaliqAgent())
    emp = db.get_employee(get_current_employee_id_from_context())
    if emp:
        name = emp["name"].split()[0]
        full_name = emp["name"]
        position = emp["position"]
        dept = emp["department"]
        is_mgr = db.is_manager(employee_id)
        role_label = " (Manager)" if is_mgr else ""
        logger.info(f"Session: {full_name} [{employee_id}] - {position}, {dept}{role_label} - Lang: {lang}")
        
        # Send identity banner first
        await _send_ui("StatusBanner", {
            "message": f"Logged in as {full_name} - {position}, {dept}{role_label}",
            "type": "info",
        }, "session_info")
        
        if lang == "ar":
            greeting = f"أهلاً {name}! أنا تليق. مرحباً بك في قسم {dept}. كيف أقدر أساعدك؟"
        else:
            greeting = f"Ahlan {name}! I\'m Taliq, your HR assistant. You\'re logged in as {full_name}, {position} in {dept}. How can I help you today?"
    else:
        name = "there"
        logger.warning(f"Employee {employee_id} not found in database")
        greeting = "Hello! I couldn\'t find your profile. Please log out and try again."
    
    await session.say(greeting, allow_interruptions=True)
    
    # Auto-show dashboard on connect
    try:
        emp = db.get_employee(employee_id)
        if emp:
            is_mgr = db.is_manager(employee_id)
            loans = db.get_employee_loans(employee_id)
            docs = db.get_document_requests(employee_id)
            pending_docs = [d for d in docs if d["status"] in ("requested", "processing")]
            today_att = db.get_today_attendance(employee_id)
            anns = db.get_announcements(3)
            props = {
                "employeeName": emp["name"], "employeeId": emp["id"],
                "position": emp["position"], "department": emp["department"],
                "isManager": is_mgr, "leaveBalance": emp["leave_balance"],
                "activeLoans": len(loans), "pendingRequests": len(pending_docs),
                "announcements": len(anns),
                "todayAttendance": dict(today_att) if today_att else None,
            }
            if is_mgr:
                approvals = db.get_pending_approvals(employee_id)
                reports = db.get_direct_reports(employee_id)
                props["pendingApprovals"] = len(approvals)
                props["teamSize"] = len(reports)
            await _send_ui("QuickDashboard", props, "main_card")
    except Exception as e:
        logger.error(f"Dashboard auto-show error: {e}")


# Start admin API in background thread
import threading
from admin_api import start_admin_api

def _start_admin():
    try:
        start_admin_api(8082)
    except Exception as e:
        logger.error(f"Admin API failed: {e}")

_admin_thread = threading.Thread(target=_start_admin, daemon=True)
_admin_thread.start()

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="taliq",
            worker_type=WorkerType.ROOM,
            job_executor_type=JobExecutorType.THREAD,
        )
    )
