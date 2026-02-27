"""Taliq - Voice-First HR Agent with real CRUD and form previews."""

import json
import logging
import os
import asyncio
from datetime import date as dt
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

SYSTEM_PROMPT = """You are Taliq, a voice-first HR assistant with real database access.

Employee: {employee_name} ({employee_id}) | Dept: {department} | Grade: {grade}

You can CREATE, READ, UPDATE records. Keep voice responses SHORT (1-2 sentences).
Use Marhaba/Ahlan greetings. Currency: SAR. GOSI: 9.75% of basic.

WORKFLOW for CREATE actions (ALWAYS follow this):
1. When user wants to CREATE something (leave, document, travel, loan):
   FIRST call the preview tool (preview_leave_form, preview_document_form, etc.)
   This shows an empty form so the user sees what info is needed.
2. Ask the user for missing details via voice.
3. As you get info, call preview again with partial data to update the form.
4. Once you have ALL required info, call the actual create tool to save it.

Leave needs: type (annual/sick/emergency/study), start_date, end_date, days, reason.
Documents: Salary Certificate, Experience Certificate, or Employment Letter.
Loans: type (Interest-Free/Advance Salary), amount in SAR, duration in months.
Travel: destination, start_date, end_date, days.
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


# ---- PREVIEW TOOLS (show form before collecting data) ----

@function_tool()
async def preview_leave_form(context: RunContext, leave_type: str = "", start_date: str = "", end_date: str = "", days: int = 0, reason: str = ""):
    """Show a leave request PREVIEW form. Call FIRST when user wants to apply for leave."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    bal = emp["leave_balance"].get(leave_type, emp["leave_balance"]["annual"])
    await _send_ui("LeaveRequestForm", {
        "employeeName": emp["name"],
        "leaveType": leave_type if leave_type else "---",
        "startDate": start_date if start_date else "---",
        "endDate": end_date if end_date else "---",
        "days": days, "reason": reason,
        "balance": bal, "status": "preview",
    }, "leave_request")
    missing = []
    if not leave_type: missing.append("leave type")
    if not start_date: missing.append("start date")
    if not end_date: missing.append("end date")
    if not reason: missing.append("reason")
    if missing:
        return f"Form preview shown. Still need: {', '.join(missing)}."
    return "All details collected. Ready to submit."


@function_tool()
async def preview_document_form(context: RunContext, document_type: str = ""):
    """Show document request PREVIEW. Call when user wants to request a document."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    await _send_ui("DocumentRequestCard", {
        "employeeName": emp["name"],
        "documentType": document_type if document_type else "Select type...",
        "requestDate": str(dt.today()), "status": "preview", "referenceNumber": "---",
    }, "document")
    if not document_type:
        return "Form shown. Which type: Salary Certificate, Experience Certificate, or Employment Letter?"
    return f"Preview for {document_type}. Confirm to submit."


@function_tool()
async def preview_loan_form(context: RunContext, loan_type: str = "", amount: float = 0, months: int = 0):
    """Show loan application PREVIEW. Call when user wants to apply for a loan."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    elig = db.check_loan_eligibility(CURRENT_EMPLOYEE_ID)
    monthly = round(amount / months, 2) if months > 0 and amount > 0 else 0
    await _send_ui("LoanCard", {
        "employeeName": emp["name"],
        "loanType": loan_type if loan_type else "Select type...",
        "amount": amount, "currency": "SAR",
        "eligible": elig.get("eligible", False),
        "maxAmount": elig.get("max_amount"),
        "monthlyInstallment": monthly,
        "installmentsLeft": months,
        "status": "preview",
    }, "loan")
    if not loan_type or amount == 0:
        return f"Form shown. Max eligible: {elig.get('max_amount', 0):,} SAR. Need: type, amount, months."
    return f"Preview: {amount:,.0f} SAR over {months} months. Confirm to submit."


@function_tool()
async def preview_travel_form(context: RunContext, destination: str = "", start_date: str = "", end_date: str = "", days: int = 0):
    """Show travel request PREVIEW. Call when user wants to create a travel request."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    per_diem = db.get_per_diem(emp.get("grade", "34")) if destination else 0
    total = per_diem * min(days, 5) if days > 0 else 0
    await _send_ui("TravelRequestCard", {
        "employeeName": emp["name"],
        "destination": destination if destination else "---",
        "travelType": "business",
        "startDate": start_date if start_date else "---",
        "endDate": end_date if end_date else "---",
        "days": days, "perDiem": per_diem,
        "totalAllowance": total, "currency": "SAR", "status": "preview",
    }, "travel")
    missing = []
    if not destination: missing.append("destination")
    if not start_date: missing.append("dates")
    if missing:
        return f"Form shown. Need: {', '.join(missing)}."
    return f"Preview: {days} days to {destination}. Confirm to submit."


# ---- LEAVE MANAGEMENT ----

@function_tool()
async def check_leave_balance(context: RunContext):
    """Check leave balance."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    bal = emp["leave_balance"]
    await _send_ui("LeaveBalanceCard", {
        "employeeName": emp["name"], "annual": bal["annual"],
        "sick": bal["sick"], "emergency": bal["emergency"], "study": bal.get("study"),
    }, "leave_balance")
    return f"{bal['annual']} annual, {bal['sick']} sick, {bal['emergency']} emergency days."


@function_tool()
async def apply_for_leave(context: RunContext, leave_type: str, start_date: str, end_date: str, days: int, reason: str):
    """CREATE a leave request in the database. Only call after preview and confirmation."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Employee not found."
    bal = emp["leave_balance"].get(leave_type, 0)
    if days > bal:
        await _send_ui("StatusBanner", {"message": f"Insufficient {leave_type} leave ({bal} left).", "type": "error"}, "status")
        return f"Only {bal} {leave_type} days remaining."
    lr = db.submit_leave_request(CURRENT_EMPLOYEE_ID, leave_type, start_date, end_date, days, reason)
    await _send_ui("LeaveRequestForm", {
        "employeeName": emp["name"], "leaveType": leave_type,
        "startDate": start_date, "endDate": end_date,
        "days": days, "reason": reason, "balance": bal - days,
        "status": "submitted", "reference": lr["ref"],
    }, "leave_request")
    return f"Leave {lr['ref']} created! {days} {leave_type} days. Sent to manager."


@function_tool()
async def show_my_leave_requests(context: RunContext):
    """Show all my leave requests."""
    reqs = db.get_leave_requests(CURRENT_EMPLOYEE_ID)
    if not reqs: return "No leave requests."
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    lr = reqs[0]
    await _send_ui("LeaveRequestForm", {
        "employeeName": emp["name"] if emp else "", "leaveType": lr["leave_type"],
        "startDate": lr["start_date"], "endDate": lr["end_date"],
        "days": lr["days"], "reason": lr["reason"] or "",
        "status": lr["status"], "reference": lr["ref"],
    }, "leave_request")
    summary = ", ".join(f"{r['ref']}({r['status']})" for r in reqs[:5])
    return f"{len(reqs)} request(s): {summary}"


# ---- APPROVALS ----

@function_tool()
async def show_pending_approvals(context: RunContext):
    """Show pending approvals for me as manager."""
    approvals = db.get_pending_approvals(CURRENT_EMPLOYEE_ID)
    items = [{"id": a["ref"], "employeeName": a["employee_name"], "type": a["leave_type"],
              "startDate": a["start_date"], "endDate": a["end_date"], "days": a["days"],
              "reason": a["reason"] or "", "status": a["status"]} for a in approvals]
    await _send_ui("ApprovalQueue", {"items": items}, "approvals")
    return f"{len(items)} pending."


@function_tool()
async def approve_leave(context: RunContext, request_ref: str, decision: str = "approved"):
    """Approve or reject a leave request."""
    result = db.approve_leave_request(request_ref, decision)
    if not result: return f"Request {request_ref} not found."
    await _send_ui("StatusBanner", {
        "message": f"{request_ref} for {result.get('employee_name', '?')}: {decision}",
        "type": "success" if decision == "approved" else "warning",
    }, "status")
    return f"Leave {request_ref} {decision}."


# ---- PROFILE & PAY ----

@function_tool()
async def show_my_profile(context: RunContext):
    """Show employee profile."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Not found."
    mgr = db.get_employee(emp.get("manager_id", ""))
    await _send_ui("EmployeeProfileCard", {
        "name": emp["name"], "nameAr": emp["name_ar"],
        "position": emp["position"], "department": emp["department"],
        "email": emp["email"], "phone": emp["phone"],
        "joinDate": emp["join_date"], "employeeId": emp["id"],
        "grade": f"Grade {emp['grade']} / Level {emp['level']}",
        "manager": mgr["name"] if mgr else "N/A",
    }, "profile")
    return f"{emp['name']}, {emp['position']}."


@function_tool()
async def show_pay_slip(context: RunContext, month: str = "February 2026"):
    """Show pay slip."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Not found."
    sal = emp["salary"]
    gosi = int(sal["basic"] * 0.0975)
    net = sal["total"] - gosi
    await _send_ui("PaySlipCard", {
        "employeeName": emp["name"], "month": month,
        "basic": sal["basic"], "housing": sal["housing"], "transport": sal["transport"],
        "deductions": gosi, "gosiDeduction": gosi, "netPay": net, "currency": "SAR",
    }, "payslip")
    return f"Net: {net:,} SAR after {gosi:,} GOSI."


# ---- LOANS ----

@function_tool()
async def check_loan_eligibility(context: RunContext):
    """Check loan eligibility."""
    result = db.check_loan_eligibility(CURRENT_EMPLOYEE_ID)
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Not found."
    await _send_ui("LoanCard", {
        "employeeName": emp["name"], "loanType": "Eligibility",
        "amount": 0, "currency": "SAR",
        "eligible": result["eligible"], "maxAmount": result.get("max_amount"),
        "status": "eligible" if result["eligible"] else "ineligible",
    }, "loan")
    if result["eligible"]:
        return f"Eligible! Max: {result['max_amount']:,} SAR."
    return f"Not eligible: {result['reason']}"


@function_tool()
async def show_loan_balance(context: RunContext):
    """Show active loans."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Not found."
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
    return f"{len(loans)} loan(s), {sum(l['remaining'] for l in loans):,} SAR remaining."


@function_tool()
async def apply_for_loan(context: RunContext, loan_type: str, amount: float, months: int):
    """CREATE a loan. Only call after preview and confirmation."""
    elig = db.check_loan_eligibility(CURRENT_EMPLOYEE_ID)
    if not elig["eligible"]:
        await _send_ui("StatusBanner", {"message": f"Not eligible: {elig['reason']}", "type": "error"}, "status")
        return f"Cannot apply: {elig['reason']}"
    if amount > elig["max_amount"]:
        return f"Exceeds max ({elig['max_amount']:,} SAR)."
    loan = db.create_loan(CURRENT_EMPLOYEE_ID, loan_type, amount, months)
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    await _send_ui("LoanCard", {
        "employeeName": emp["name"] if emp else "", "loanType": loan["loan_type"],
        "amount": loan["amount"], "currency": "SAR",
        "remainingBalance": loan["remaining"], "monthlyInstallment": loan["monthly_installment"],
        "installmentsLeft": loan["installments_left"], "status": "active",
    }, "loan")
    return f"Loan {loan['ref']} created! {amount:,.0f} SAR over {months} months."


# ---- DOCUMENTS ----

@function_tool()
async def request_document(context: RunContext, document_type: str):
    """CREATE a document request. Only call after preview."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Not found."
    doc = db.create_document_request(CURRENT_EMPLOYEE_ID, document_type)
    await _send_ui("DocumentRequestCard", {
        "employeeName": emp["name"], "documentType": doc["document_type"],
        "requestDate": doc["created_at"][:10], "status": "requested",
        "estimatedDate": doc["estimated_date"], "referenceNumber": doc["ref"],
    }, "document")
    return f"Request {doc['ref']} created! Ready in 2 days."


@function_tool()
async def show_my_documents(context: RunContext):
    """Show my document requests."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Not found."
    docs = db.get_document_requests(CURRENT_EMPLOYEE_ID)
    if not docs: return "No requests."
    doc = docs[0]
    await _send_ui("DocumentRequestCard", {
        "employeeName": emp["name"], "documentType": doc["document_type"],
        "requestDate": doc["created_at"][:10], "status": doc["status"],
        "referenceNumber": doc["ref"],
    }, "document")
    return f"{len(docs)} request(s). Latest: {doc['document_type']} - {doc['status']}."


# ---- TRAVEL & MISC ----

@function_tool()
async def create_travel_request(context: RunContext, destination: str, start_date: str, end_date: str, days: int, travel_type: str = "business"):
    """CREATE a travel request. Only call after preview."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Not found."
    tr = db.create_travel_request(CURRENT_EMPLOYEE_ID, destination, start_date, end_date, days, travel_type)
    await _send_ui("TravelRequestCard", {
        "employeeName": emp["name"], "destination": tr["destination"],
        "travelType": tr["travel_type"], "startDate": tr["start_date"],
        "endDate": tr["end_date"], "days": tr["days"],
        "perDiem": tr["per_diem"], "totalAllowance": tr["total_allowance"],
        "currency": "SAR", "status": "pending",
    }, "travel")
    return f"Travel {tr['ref']} created! {destination}, {days} days, {tr['total_allowance']:,} SAR."


@function_tool()
async def show_announcements(context: RunContext):
    """Show announcements."""
    anns = db.get_announcements()
    if not anns: return "None."
    a = anns[0]
    await _send_ui("AnnouncementCard", {
        "title": a["title"], "content": a["content"],
        "author": a.get("author"), "date": a["created_at"][:10],
        "priority": a.get("priority", "normal"),
        "acknowledgedCount": a.get("acknowledged_count"), "totalCount": a.get("total_count"),
    }, "announcement")
    return f"Latest: {a['title']}."


@function_tool()
async def show_team_attendance(context: RunContext):
    """Show team attendance."""
    emp = db.get_employee(CURRENT_EMPLOYEE_ID)
    if not emp: return "Not found."
    att = db.get_team_attendance(CURRENT_EMPLOYEE_ID)
    if not att: return "No team."
    await _send_ui("AttendanceDashboard", {
        "managerName": emp["name"], "date": str(dt.today()), "team": att,
    }, "attendance")
    p = sum(1 for a in att if a["status"] in ("present", "remote"))
    return f"{p}/{len(att)} present."


@function_tool()
async def show_status(context: RunContext, message: str, status_type: str = "info"):
    """Show notification."""
    await _send_ui("StatusBanner", {"message": message, "type": status_type}, "status")
    return message


# ---- AGENT ----

ALL_TOOLS = [
    preview_leave_form, preview_document_form, preview_loan_form, preview_travel_form,
    check_leave_balance, apply_for_leave, show_my_leave_requests,
    show_pending_approvals, approve_leave,
    show_my_profile, show_pay_slip,
    check_loan_eligibility, show_loan_balance, apply_for_loan,
    request_document, show_my_documents,
    create_travel_request, show_announcements, show_team_attendance, show_status,
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
            "approve_leave": f"Approve leave {msg.get('request_id', '')} decision {msg.get('decision', 'approved')}",
            "check_leave_balance": "Show my leave balance",
            "show_pay_slip": "Show my pay slip",
            "request_document": f"Request a {msg.get('document_type', 'Salary Certificate')}",
            "apply_leave_prompt": "I want to apply for leave. Show the preview form first, then ask me for details.",
            "download_payslip": f"Show pay slip for {msg.get('month', 'this month')}",
            "apply_loan": "I want to apply for a loan. Show the preview form and check eligibility.",
        }
        text = prompts.get(action, f"User action: {action}")
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
        if pkt.topic in ("lk-chat", "user_action"):
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
