"""Taliq — تَلِيق — Voice-First HR Agent with real CRUD operations."""

import json
import logging
import os
import asyncio
from dotenv import load_dotenv

from livekit.agents import (
    Agent, AgentSession, AutoSubscribe, JobContext,
    JobExecutorType, WorkerOptions, WorkerType,
    cli, function_tool, RunContext,
)
from livekit.plugins import deepgram, openai, silero
from livekit import rtc

import database as db

load_dotenv()
logger = logging.getLogger("taliq-agent")
logging.basicConfig(level=logging.INFO)

CURRENT_EMPLOYEE_ID = os.getenv("TALIQ_EMPLOYEE_ID", "E001")
_room_ref = None
_session_ref = None

SYSTEM_PROMPT = """You are Taliq (تَلِيق), a voice-first HR assistant with real database access.

Employee: {employee_name} ({employee_id}) | Dept: {department} | Grade: {grade}

You can CREATE, READ, UPDATE records — leave requests, documents, loans, travel.
Keep voice responses SHORT (1-2 sentences). Show UI cards for data.
Use "Marhaba" / "Ahlan" greetings. Currency: SAR. GOSI: 9.75% of basic.

When applying for leave, ask for: type, start date, end date, and reason.
When requesting documents, ask which type: Salary Certificate, Experience Certificate, or Employment Letter.
"""


async def _send_ui(component: str, props: dict, category: str | None = None):
    global _room_ref
    if not _room_ref or not _room_ref.local_participant:
        return
    try:
        payload = json.dumps({"type": "tambo_render", "component": component, "props": props, "category": category or component}).encode("utf-8")
        await _room_ref.local_participant.publish_data(payload, topic="ui_sync", reliable=True)
        logger.info(f"UI: {component}")
    except Exception as e:
        logger.error(f"UI error: {e}")


# ═══════════════════════════════════════════════════════
# LEAVE MANAGEMENT (full CRUD)
# ═══════════════════════════════════════════════════════

@function_tool()
async def check_leave_balance(context: RunContext):
    """Check leave balance — annual, sick, emergency, study days remaining."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    bal = emp["leave_balance"]
    await _send_ui("LeaveBalanceCard", {
        "employeeName": emp["name"], "annual": bal["annual"],
        "sick": bal["sick"], "emergency": bal["emergency"], "study": bal.get("study"),
    }, "leave_balance")
    return f"{bal['annual']} annual, {bal['sick']} sick, {bal['emergency']} emergency days available."


@function_tool()
async def apply_for_leave(context: RunContext, leave_type: str, start_date: str, end_date: str, days: int, reason: str):
    """CREATE a leave request. leave_type: annual|sick|emergency|study. Dates: YYYY-MM-DD."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    bal = emp["leave_balance"].get(leave_type, 0)
    if days > bal:
        await _send_ui("StatusBanner", {"message": f"Insufficient {leave_type} leave ({bal} days left).", "type": "error"}, "status")
        return f"Only {bal} {leave_type} days remaining."

    lr = db.submit_leave_request(CURRENT_EMPLOYEE_ID, leave_type, start_date, end_date, days, reason)
    await _send_ui("LeaveRequestForm", {
        "employeeName": emp["name"], "leaveType": leave_type,
        "startDate": start_date, "endDate": end_date,
        "days": days, "reason": reason, "balance": bal - days,
        "status": "submitted", "reference": lr["ref"],
    }, "leave_request")
    return f"Leave request {lr['ref']} created! {days} {leave_type} days, {start_date} to {end_date}. Sent to your manager."


@function_tool()
async def show_my_leave_requests(context: RunContext):
    """Show all my leave requests with their status."""
    requests = db.get_leave_requests(CURRENT_EMPLOYEE_ID)
    if not requests:
        return "No leave requests found."
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    # Show latest as a card
    lr = requests[0]
    await _send_ui("LeaveRequestForm", {
        "employeeName": emp["name"] if emp else "", "leaveType": lr["leave_type"],
        "startDate": lr["start_date"], "endDate": lr["end_date"],
        "days": lr["days"], "reason": lr["reason"] or "",
        "status": lr["status"], "reference": lr["ref"],
    }, "leave_request")
    summary = ", ".join(f"{r['ref']}({r['status']})" for r in requests[:5])
    return f"You have {len(requests)} leave request(s): {summary}"


# ═══════════════════════════════════════════════════════
# APPROVALS (manager actions)
# ═══════════════════════════════════════════════════════

@function_tool()
async def show_pending_approvals(context: RunContext):
    """Show pending leave requests waiting for my approval."""
    approvals = db.get_pending_approvals(CURRENT_EMPLOYEE_ID)
    items = [{
        "id": a["ref"], "employeeName": a["employee_name"],
        "type": a["leave_type"], "startDate": a["start_date"], "endDate": a["end_date"],
        "days": a["days"], "reason": a["reason"] or "", "status": a["status"],
    } for a in approvals]
    await _send_ui("ApprovalQueue", {"items": items}, "approvals")
    return f"{len(items)} pending approval(s)."


@function_tool()
async def approve_leave(context: RunContext, request_ref: str, decision: str = "approved"):
    """Approve or reject a leave request. decision: approved|rejected."""
    result = db.approve_leave_request(request_ref, decision)
    if not result:
        return f"Request {request_ref} not found."
    name = result.get("employee_name", request_ref)
    await _send_ui("StatusBanner", {
        "message": f"✓ {request_ref} for {name}: {decision}",
        "type": "success" if decision == "approved" else "warning",
    }, "status")
    return f"Leave {request_ref} {decision} for {name}."


# ═══════════════════════════════════════════════════════
# EMPLOYEE PROFILE & PAY
# ═══════════════════════════════════════════════════════

@function_tool()
async def show_my_profile(context: RunContext):
    """Show employee profile card."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    mgr = db.get_employee(emp.get("manager_id", ""))
    await _send_ui("EmployeeProfileCard", {
        "name": emp["name"], "nameAr": emp["name_ar"],
        "position": emp["position"], "department": emp["department"],
        "email": emp["email"], "phone": emp["phone"],
        "joinDate": emp["join_date"], "employeeId": emp["id"],
        "grade": f"Grade {emp['grade']} / Level {emp['level']}",
        "manager": mgr["name"] if mgr else "N/A",
    }, "profile")
    return f"Profile for {emp['name']}, {emp['position']}."


@function_tool()
async def show_pay_slip(context: RunContext, month: str = "February 2026"):
    """Show pay slip with GOSI deductions."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    sal = emp["salary"]
    gosi = int(sal["basic"] * 0.0975)
    net = sal["total"] - gosi
    await _send_ui("PaySlipCard", {
        "employeeName": emp["name"], "month": month,
        "basic": sal["basic"], "housing": sal["housing"], "transport": sal["transport"],
        "deductions": gosi, "gosiDeduction": gosi, "netPay": net, "currency": "SAR",
    }, "payslip")
    return f"Net pay: {net:,} SAR after {gosi:,} GOSI deduction."


# ═══════════════════════════════════════════════════════
# LOANS (eligibility + balance + apply)
# ═══════════════════════════════════════════════════════

@function_tool()
async def check_loan_eligibility(context: RunContext):
    """Check loan eligibility and max amount."""
    result = db.check_loan_eligibility(CURRENT_EMPLOYEE_ID)
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    await _send_ui("LoanCard", {
        "employeeName": emp["name"], "loanType": "Eligibility",
        "amount": 0, "currency": "SAR",
        "eligible": result["eligible"], "maxAmount": result.get("max_amount"),
        "status": "eligible" if result["eligible"] else "ineligible",
    }, "loan")
    if result["eligible"]:
        return f"Eligible! Max: {result['max_amount']:,} SAR, max EMI: {result['max_emi']:,} SAR/month."
    return f"Not eligible: {result['reason']}"


@function_tool()
async def show_loan_balance(context: RunContext):
    """Show active loans and repayment progress."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    loans = db.get_employee_loans(CURRENT_EMPLOYEE_ID)
    if not loans:
        await _send_ui("StatusBanner", {"message": "No active loans.", "type": "info"}, "loan")
        return "No active loans."
    loan = loans[0]
    await _send_ui("LoanCard", {
        "employeeName": emp["name"], "loanType": loan["loan_type"],
        "amount": loan["amount"], "currency": "SAR",
        "remainingBalance": loan["remaining"], "monthlyInstallment": loan["monthly_installment"],
        "installmentsLeft": loan["installments_left"], "status": "active",
    }, "loan")
    total = sum(l["remaining"] for l in loans)
    return f"{len(loans)} loan(s), {total:,} SAR remaining."


@function_tool()
async def apply_for_loan(context: RunContext, loan_type: str, amount: float, months: int):
    """CREATE a loan application. loan_type: Interest-Free|Advance Salary. amount in SAR."""
    elig = db.check_loan_eligibility(CURRENT_EMPLOYEE_ID)
    if not elig["eligible"]:
        await _send_ui("StatusBanner", {"message": f"Not eligible: {elig['reason']}", "type": "error"}, "status")
        return f"Cannot apply: {elig['reason']}"
    if amount > elig["max_amount"]:
        return f"Amount exceeds max ({elig['max_amount']:,} SAR)."
    loan = db.create_loan(CURRENT_EMPLOYEE_ID, loan_type, amount, months)
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    await _send_ui("LoanCard", {
        "employeeName": emp["name"] if emp else "", "loanType": loan["loan_type"],
        "amount": loan["amount"], "currency": "SAR",
        "remainingBalance": loan["remaining"], "monthlyInstallment": loan["monthly_installment"],
        "installmentsLeft": loan["installments_left"], "status": "active",
    }, "loan")
    return f"Loan {loan['ref']} created! {amount:,.0f} SAR over {months} months ({loan['monthly_installment']:,.0f} SAR/month)."


# ═══════════════════════════════════════════════════════
# DOCUMENTS (request + track)
# ═══════════════════════════════════════════════════════

@function_tool()
async def request_document(context: RunContext, document_type: str):
    """CREATE a document request: Salary Certificate, Experience Certificate, Employment Letter."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    doc = db.create_document_request(CURRENT_EMPLOYEE_ID, document_type)
    await _send_ui("DocumentRequestCard", {
        "employeeName": emp["name"], "documentType": doc["document_type"],
        "requestDate": doc["created_at"][:10], "status": doc["status"],
        "estimatedDate": doc["estimated_date"], "referenceNumber": doc["ref"],
    }, "document")
    return f"Document request {doc['ref']} created! {document_type} ready in 2 business days."


@function_tool()
async def show_my_documents(context: RunContext):
    """Show my document requests."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    docs = db.get_document_requests(CURRENT_EMPLOYEE_ID)
    if not docs: return "No document requests."
    doc = docs[0]
    await _send_ui("DocumentRequestCard", {
        "employeeName": emp["name"], "documentType": doc["document_type"],
        "requestDate": doc["created_at"][:10], "status": doc["status"],
        "estimatedDate": doc.get("estimated_date"), "referenceNumber": doc["ref"],
    }, "document")
    return f"{len(docs)} request(s). Latest: {doc['document_type']} — {doc['status']}."


# ═══════════════════════════════════════════════════════
# TRAVEL & ANNOUNCEMENTS
# ═══════════════════════════════════════════════════════

@function_tool()
async def create_travel_request(context: RunContext, destination: str, start_date: str, end_date: str, days: int, travel_type: str = "business"):
    """CREATE a travel request with per diem calculation."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    tr = db.create_travel_request(CURRENT_EMPLOYEE_ID, destination, start_date, end_date, days, travel_type)
    await _send_ui("TravelRequestCard", {
        "employeeName": emp["name"], "destination": tr["destination"],
        "travelType": tr["travel_type"], "startDate": tr["start_date"],
        "endDate": tr["end_date"], "days": tr["days"],
        "perDiem": tr["per_diem"], "totalAllowance": tr["total_allowance"],
        "currency": "SAR", "status": tr["status"],
    }, "travel")
    return f"Travel request {tr['ref']} created! {destination}, {days} days. Allowance: {tr['total_allowance']:,} SAR."


@function_tool()
async def calculate_travel_allowance(context: RunContext, destination: str, days: int, international: bool = False):
    """Calculate travel per diem without creating a request."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    per_diem = db.get_per_diem(emp.get("grade", "34"), international)
    total = per_diem * min(days, 5)
    await _send_ui("TravelRequestCard", {
        "employeeName": emp["name"], "destination": destination,
        "travelType": "business", "startDate": "TBD", "endDate": "TBD",
        "days": days, "perDiem": per_diem, "totalAllowance": total,
        "currency": "SAR", "status": "draft",
    }, "travel")
    return f"Per diem: {per_diem:,} SAR/day. Total: {total:,} SAR for {min(days,5)} days."


@function_tool()
async def show_announcements(context: RunContext):
    """Show company announcements."""
    anns = db.get_announcements()
    if not anns: return "No announcements."
    a = anns[0]
    await _send_ui("AnnouncementCard", {
        "title": a["title"], "content": a["content"],
        "author": a.get("author"), "date": a["created_at"][:10],
        "priority": a.get("priority", "normal"),
        "acknowledgedCount": a.get("acknowledged_count"), "totalCount": a.get("total_count"),
    }, "announcement")
    return f"Latest: {a['title']}. {len(anns)} total."


@function_tool()
async def show_team_attendance(context: RunContext):
    """Show today's team attendance."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    att = db.get_team_attendance(CURRENT_EMPLOYEE_ID)
    if not att: return "No team members."
    from datetime import date
    await _send_ui("AttendanceDashboard", {
        "managerName": emp["name"], "date": str(date.today()), "team": att,
    }, "attendance")
    p = sum(1 for a in att if a["status"] in ("present", "remote"))
    return f"{p}/{len(att)} present today."


@function_tool()
async def show_status(context: RunContext, message: str, status_type: str = "info"):
    """Show a notification."""
    await _send_ui("StatusBanner", {"message": message, "type": status_type}, "status")
    return message


# ═══════════════════════════════════════════════════════
# AGENT
# ═══════════════════════════════════════════════════════

ALL_TOOLS = [
    check_leave_balance, apply_for_leave, show_my_leave_requests,
    show_pending_approvals, approve_leave,
    show_my_profile, show_pay_slip,
    check_loan_eligibility, show_loan_balance, apply_for_loan,
    request_document, show_my_documents,
    create_travel_request, calculate_travel_allowance,
    show_announcements, show_team_attendance, show_status,
]


class TaliqAgent(Agent):
    def __init__(self):
        emp = db.get_employee(CURRENT_EMPLOYEE_ID) or {}
        super().__init__(
            instructions=SYSTEM_PROMPT.format(
                employee_name=emp.get("name", "Unknown"),
                employee_id=CURRENT_EMPLOYEE_ID,
                department=emp.get("department", "Unknown"),
                grade=emp.get("grade", "N/A"),
            ),
            tools=ALL_TOOLS,
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
    if msg.get("type") == "user_text":
        text = msg.get("text", "").strip()
    elif msg.get("type") == "user_action":
        action = msg.get("action", "")
        prompts = {
            "approve_leave": f"Approve leave request {msg.get('request_id', '')} with decision {msg.get('decision', 'approved')}",
            "check_leave_balance": "Show my leave balance",
            "show_pay_slip": "Show my pay slip",
            "request_document": f"Request a {msg.get('document_type', 'Salary Certificate')}",
            "apply_leave_prompt": "I want to apply for leave. Ask me for: leave type, start date, end date, and reason.",
            "download_payslip": f"Show pay slip for {msg.get('month', 'this month')}",
            "apply_loan": "Check my loan eligibility first, then help me apply.",
        }
        text = prompts.get(action, f"User action: {action}")
    elif msg.get("type") == "form_submit":
        # Direct form submissions from interactive cards
        form = msg.get("form", "")
        data_payload = msg.get("data", {})
        if form == "leave_request":
            text = f"Apply for {data_payload.get('leaveType', 'annual')} leave from {data_payload.get('startDate')} to {data_payload.get('endDate')}, {data_payload.get('days', 1)} days. Reason: {data_payload.get('reason', 'Personal')}"
        elif form == "document_request":
            text = f"Request a {data_payload.get('documentType', 'Salary Certificate')}"
        elif form == "travel_request":
            text = f"Create travel request to {data_payload.get('destination')} from {data_payload.get('startDate')} to {data_payload.get('endDate')}, {data_payload.get('days')} days"
        elif form == "loan_application":
            text = f"Apply for a {data_payload.get('loanType', 'Interest-Free')} loan of {data_payload.get('amount')} SAR over {data_payload.get('months', 12)} months"

    if not text:
        return
    logger.info(f"Input: {text}")
    try:
        _session_ref.generate_reply(user_input=text)
    except Exception as e:
        logger.error(f"Reply error: {e}")


async def entrypoint(ctx: JobContext):
    global _room_ref, _session_ref
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    _room_ref = ctx.room

    session = AgentSession(
        vad=silero.VAD.load(min_silence_duration=0.8, activation_threshold=0.25, prefix_padding_duration=0.3),
        stt=deepgram.STT(model="nova-3", language="en"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(
            model="speaches-ai/Kokoro-82M-v1.0-ONNX", voice="af_heart",
            base_url=os.getenv("SPEACHES_URL", "http://localhost:8000") + "/v1",
            api_key="not-needed",
        ),
        allow_interruptions=True,
        min_endpointing_delay=0.3, max_endpointing_delay=2.5, min_interruption_duration=0.08,
    )
    _session_ref = session

    @ctx.room.on("data_received")
    def on_data(pkt: rtc.DataPacket):
        if pkt.topic in ("lk-chat", "user_action", "form_submit"):
            asyncio.ensure_future(_handle_data(pkt))

    await session.start(room=ctx.room, agent=TaliqAgent())
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    name = emp["name"].split()[0] if emp else "there"
    await session.say(f"Ahlan {name}! I'm Taliq. How can I help?", allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint, agent_name="taliq",
        worker_type=WorkerType.ROOM, job_executor_type=JobExecutorType.THREAD,
    ))
