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
    # Manager
    show_team_overview,
    show_department_stats,
    show_leave_calendar,
]


def get_tools_for_employee(emp_id: str):
    tools = list(ALL_TOOLS)
    if not db.is_manager(emp_id):
        tools = [t for t in tools if t.__name__ not in ("show_team_overview", "show_department_stats", "show_leave_calendar", "create_performance_review")]
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
        except (json.JSONDecodeError, TypeError):
            pass
    set_current_employee_id(employee_id)

    session = AgentSession(
        vad=silero.VAD.load(
            min_silence_duration=0.8,
            activation_threshold=0.25,
            prefix_padding_duration=0.3,
        ),
        stt=deepgram.STT(model="nova-3", language="en"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(
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
    name = emp["name"].split()[0] if emp else "there"
    await session.say(
        f"Ahlan {name}! I'm Taliq. How can I help?", allow_interruptions=True
    )
    
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


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="taliq",
            worker_type=WorkerType.ROOM,
            job_executor_type=JobExecutorType.THREAD,
        )
    )
