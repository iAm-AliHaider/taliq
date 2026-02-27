"""Taliq — تَلِيق — Voice-First HR Agent (LiveKit Agents v1.4+).

Stability: Matches working Maya/nexus-voice-agent pattern exactly.
Cards use category-based replacement — new card of same category replaces old.
User actions from UI buttons are received via data channel.
"""

import json
import logging
import os
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

from hr_data import (
    EMPLOYEES, INTERVIEW_TEMPLATES, JOB_OPENINGS, ANNOUNCEMENTS,
    get_employee, get_team_attendance, get_pending_approvals,
    submit_leave_request, check_loan_eligibility, get_per_diem,
    get_employee_documents, get_announcements, get_employee_loans,
)

load_dotenv()

logger = logging.getLogger("taliq-agent")
logging.basicConfig(level=logging.INFO)

CURRENT_EMPLOYEE_ID = os.getenv("TALIQ_EMPLOYEE_ID", "E001")
CURRENT_MODE = os.getenv("TALIQ_MODE", "employee")

_room_ref = None
_session_ref = None

SYSTEM_PROMPT = """You are Taliq (تَلِيق), an eloquent Arabic-inspired HR voice assistant.

You serve employees, managers, and candidates with warmth and professionalism.
You speak concisely (1-2 sentences) since this is voice. Show UI widgets when helpful.

CURRENT CONTEXT:
- Employee: {employee_name} ({employee_id})
- Mode: {mode}
- Department: {department}
- Grade: {grade}

YOUR CAPABILITIES:
1. Employee Self-Service: leave balance, apply leave, profile, pay slip, loans, documents
2. Interview: conduct structured voice interviews with scoring
3. Manager: team attendance, approve/reject leave, approvals queue
4. Info: announcements, salary scale, travel per diem, HR policies
5. Travel: request business/vacation travel with per diem calculation

RULES:
- Keep voice responses SHORT (1-2 sentences max)
- Show UI cards when data helps — forms, dashboards, slips
- Be warm but professional. Use "Marhaba" or "Ahlan" in greetings
- Currency is SAR (Saudi Riyal). Week starts Sunday.
- GOSI deduction is 9.75% of basic salary for Saudi employees
- For loans: max EMI is 33% of basic salary including all existing obligations
"""


# ── UI Helper ───────────────────────────────────────────

async def _send_ui(component: str, props: dict, category: str | None = None):
    """Send a UI card to the frontend. Category controls replacement — same category replaces old card."""
    global _room_ref
    if not _room_ref or not _room_ref.local_participant:
        logger.warning("No room ref, can't send UI")
        return
    payload = json.dumps({
        "type": "tambo_render",
        "component": component,
        "props": props,
        "category": category or component,
    }).encode("utf-8")
    try:
        await _room_ref.local_participant.publish_data(payload, topic="ui_sync", reliable=True)
        logger.info(f"UI sent: {component} (cat={category or component})")
    except Exception as e:
        logger.error(f"Failed to send UI: {e}")


# ── Employee Self-Service Tools ─────────────────────────

@function_tool()
async def check_leave_balance(context: RunContext):
    """Check the employee's leave balance (annual, sick, emergency days remaining)."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."
    bal = emp["leave_balance"]
    await _send_ui("LeaveBalanceCard", {
        "employeeName": emp["name"],
        "annual": bal["annual"],
        "sick": bal["sick"],
        "emergency": bal["emergency"],
        "study": bal.get("study"),
    }, category="leave_balance")
    return f"{emp['name']} has {bal['annual']} annual, {bal['sick']} sick, and {bal['emergency']} emergency days remaining."


@function_tool()
async def apply_for_leave(
    context: RunContext,
    leave_type: str,
    start_date: str,
    end_date: str,
    days: int,
    reason: str,
):
    """Submit a leave request. leave_type: annual|sick|emergency|study. Dates in YYYY-MM-DD."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."
    bal = emp["leave_balance"].get(leave_type, 0)
    if days > bal:
        await _send_ui("StatusBanner", {
            "message": f"Insufficient {leave_type} leave. You have {bal} days.",
            "type": "error"
        }, category="status")
        return f"Cannot apply. Only {bal} {leave_type} days remaining."

    lr = submit_leave_request(CURRENT_EMPLOYEE_ID, leave_type, start_date, end_date, days, reason)
    emp["leave_balance"][leave_type] -= days

    await _send_ui("LeaveRequestForm", {
        "employeeName": emp["name"],
        "leaveType": leave_type,
        "startDate": start_date,
        "endDate": end_date,
        "days": days,
        "reason": reason,
        "balance": bal - days,
        "status": "submitted",
    }, category="leave_request")
    return f"Leave request {lr['id']} submitted! {days} {leave_type} days from {start_date} to {end_date}."


@function_tool()
async def show_my_profile(context: RunContext):
    """Show the employee's profile card with personal and job details."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."
    manager = get_employee(emp.get("manager_id", ""))
    await _send_ui("EmployeeProfileCard", {
        "name": emp["name"],
        "nameAr": emp["name_ar"],
        "position": emp["position"],
        "department": emp["department"],
        "email": emp["email"],
        "phone": emp["phone"],
        "joinDate": emp["join_date"],
        "employeeId": emp["id"],
        "grade": f"Grade {emp.get('grade', 'N/A')} / Level {emp.get('level', 'N/A')}",
        "manager": manager["name"] if manager else "N/A",
    }, category="profile")
    return f"Here's your profile, {emp['name']}. You're a {emp['position']} in {emp['department']}."


@function_tool()
async def show_pay_slip(context: RunContext, month: str = "February 2026"):
    """Show the employee's pay slip for a given month."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."
    sal = emp["salary"]
    gosi = int(sal["basic"] * 0.0975)
    net = sal["total"] - gosi
    await _send_ui("PaySlipCard", {
        "employeeName": emp["name"],
        "month": month,
        "basic": sal["basic"],
        "housing": sal["housing"],
        "transport": sal["transport"],
        "deductions": gosi,
        "gosiDeduction": gosi,
        "netPay": net,
        "currency": sal["currency"],
    }, category="payslip")
    return f"Here's your pay slip for {month}. Net pay: {net:,} {sal['currency']}."


# ── Loan Tools ──────────────────────────────────────────

@function_tool()
async def check_loan_eligibility_tool(context: RunContext):
    """Check if the employee is eligible for a loan and show maximum amount."""
    result = check_loan_eligibility(CURRENT_EMPLOYEE_ID)
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."

    await _send_ui("LoanCard", {
        "employeeName": emp["name"],
        "loanType": "Eligibility Check",
        "amount": 0,
        "currency": "SAR",
        "eligible": result["eligible"],
        "maxAmount": result.get("max_amount"),
        "status": "eligible" if result["eligible"] else "ineligible",
    }, category="loan")

    if result["eligible"]:
        return f"You're eligible! Max loan: {result['max_amount']:,} SAR."
    return f"Not eligible: {result['reason']}"


@function_tool()
async def show_loan_balance(context: RunContext):
    """Show the employee's active loan balances and repayment status."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."
    loans = get_employee_loans(CURRENT_EMPLOYEE_ID)
    if not loans:
        await _send_ui("StatusBanner", {"message": "You have no active loans.", "type": "info"}, category="loan")
        return "You have no active loans."

    # Show the first/primary loan (replaces previous loan card)
    loan = loans[0]
    await _send_ui("LoanCard", {
        "employeeName": emp["name"],
        "loanType": loan["type"],
        "amount": loan["amount"],
        "currency": "SAR",
        "remainingBalance": loan["remaining"],
        "monthlyInstallment": loan["monthly"],
        "installmentsLeft": loan["installments_left"],
        "status": "active" if loan["remaining"] > 0 else "completed",
    }, category="loan")

    total_remaining = sum(l["remaining"] for l in loans)
    return f"You have {len(loans)} loan(s). Total remaining: {total_remaining:,} SAR."


# ── Document Tools ──────────────────────────────────────

@function_tool()
async def request_document(context: RunContext, document_type: str):
    """Request an HR document. Types: Salary Certificate, Experience Certificate, Employment Letter."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."

    from datetime import date as dt, timedelta
    ref = f"DOC-{dt.today().strftime('%Y')}-{len(get_employee_documents(CURRENT_EMPLOYEE_ID)) + 3:03d}"

    await _send_ui("DocumentRequestCard", {
        "employeeName": emp["name"],
        "documentType": document_type,
        "requestDate": str(dt.today()),
        "status": "requested",
        "estimatedDate": str(dt.today() + timedelta(days=2)),
        "referenceNumber": ref,
    }, category="document")
    return f"Document request submitted! Reference: {ref}. Ready in 2 business days."


@function_tool()
async def show_my_documents(context: RunContext):
    """Show the employee's document request history."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."
    docs = get_employee_documents(CURRENT_EMPLOYEE_ID)
    if not docs:
        return "No document requests found."

    # Show most recent document
    doc = docs[-1]
    await _send_ui("DocumentRequestCard", {
        "employeeName": emp["name"],
        "documentType": doc["type"],
        "requestDate": doc.get("request_date"),
        "status": doc["status"],
        "referenceNumber": doc.get("reference"),
    }, category="document")
    return f"You have {len(docs)} document request(s). Latest: {doc['type']} — {doc['status']}."


# ── Announcements ───────────────────────────────────────

@function_tool()
async def show_announcements(context: RunContext):
    """Show recent company announcements."""
    anns = get_announcements()
    # Show the most important one (replaces)
    ann = anns[0]
    await _send_ui("AnnouncementCard", {
        "title": ann["title"],
        "content": ann["content"],
        "author": ann.get("author"),
        "date": ann.get("date"),
        "priority": ann.get("priority", "normal"),
        "acknowledgedCount": ann.get("acknowledged_count"),
        "totalCount": ann.get("total_count"),
    }, category="announcement")
    return f"Latest announcement: {ann['title']}. There are {len(anns)} total announcements."


# ── Travel Tools ────────────────────────────────────────

@function_tool()
async def calculate_travel_allowance(
    context: RunContext,
    destination: str,
    days: int,
    international: bool = False,
):
    """Calculate travel per diem for a business trip."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."

    per_diem = get_per_diem(emp.get("grade", "34"), international)
    total = per_diem * min(days, 5)

    await _send_ui("TravelRequestCard", {
        "employeeName": emp["name"],
        "destination": destination,
        "travelType": "business",
        "startDate": "TBD",
        "endDate": "TBD",
        "days": days,
        "perDiem": per_diem,
        "totalAllowance": total,
        "currency": "SAR",
        "status": "draft",
    }, category="travel")

    return f"Per diem for {destination}: {per_diem:,} SAR/day. Total for {min(days,5)} days: {total:,} SAR."


# ── Interview Tools ─────────────────────────────────────

@function_tool()
async def start_interview(
    context: RunContext,
    job_type: str = "general",
    candidate_name: str = "Candidate",
):
    """Start a structured voice interview. job_type: software_engineer|ui_designer|general."""
    template = INTERVIEW_TEMPLATES.get(job_type, INTERVIEW_TEMPLATES["general"])
    questions = template["questions"]

    await _send_ui("InterviewPanel", {
        "title": template["title"],
        "candidateName": candidate_name,
        "currentQuestion": 1,
        "totalQuestions": len(questions),
        "question": questions[0]["q"],
        "questionType": questions[0]["type"],
        "timeMinutes": questions[0]["time_min"],
        "scores": [],
        "status": "in_progress",
    }, category="interview")
    return f"Starting {template['title']} for {candidate_name}. First question: {questions[0]['q']}"


@function_tool()
async def next_interview_question(
    context: RunContext,
    job_type: str,
    question_number: int,
    previous_score: int = 0,
    candidate_name: str = "Candidate",
    scores_json: str = "[]",
):
    """Move to next interview question. Score 1-5 for previous answer."""
    template = INTERVIEW_TEMPLATES.get(job_type, INTERVIEW_TEMPLATES["general"])
    questions = template["questions"]

    try:
        scores = json.loads(scores_json)
    except Exception:
        scores = []
    if previous_score > 0:
        scores.append(previous_score)

    if question_number > len(questions):
        avg = sum(scores) / len(scores) if scores else 0
        await _send_ui("InterviewPanel", {
            "title": template["title"],
            "candidateName": candidate_name,
            "currentQuestion": len(questions),
            "totalQuestions": len(questions),
            "question": "Interview Complete",
            "questionType": "summary",
            "timeMinutes": 0,
            "scores": scores,
            "status": "completed",
            "averageScore": round(avg, 1),
        }, category="interview")
        return f"Interview complete! Average score: {avg:.1f}/5."

    q = questions[question_number - 1]
    await _send_ui("InterviewPanel", {
        "title": template["title"],
        "candidateName": candidate_name,
        "currentQuestion": question_number,
        "totalQuestions": len(questions),
        "question": q["q"],
        "questionType": q["type"],
        "timeMinutes": q["time_min"],
        "scores": scores,
        "status": "in_progress",
    }, category="interview")
    return f"Question {question_number}: {q['q']}"


# ── Manager Tools ───────────────────────────────────────

@function_tool()
async def show_team_attendance(context: RunContext):
    """Show today's attendance for the manager's team."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."
    attendance = get_team_attendance(CURRENT_EMPLOYEE_ID)
    if not attendance:
        return "No team members found reporting to you."

    from datetime import date
    await _send_ui("AttendanceDashboard", {
        "managerName": emp["name"],
        "date": str(date.today()),
        "team": attendance,
    }, category="attendance")
    present = sum(1 for a in attendance if a["status"] in ("present", "remote"))
    return f"Team attendance: {present}/{len(attendance)} present today."


@function_tool()
async def show_pending_approvals(context: RunContext):
    """Show pending leave requests awaiting the manager's approval."""
    approvals = get_pending_approvals(CURRENT_EMPLOYEE_ID)
    items = []
    for lr in approvals:
        emp = get_employee(lr["employee_id"])
        items.append({
            "id": lr["id"],
            "employeeName": emp["name"] if emp else lr["employee_id"],
            "type": lr["type"],
            "startDate": lr["start"],
            "endDate": lr["end"],
            "days": lr["days"],
            "reason": lr["reason"],
            "status": lr["status"],
        })
    await _send_ui("ApprovalQueue", {"items": items}, category="approvals")
    return f"You have {len(items)} pending approval{'s' if len(items) != 1 else ''}."


@function_tool()
async def approve_leave(context: RunContext, request_id: str, decision: str = "approved"):
    """Approve or reject a leave request. decision: approved|rejected."""
    from hr_data import LEAVE_REQUESTS
    for lr in LEAVE_REQUESTS:
        if lr["id"] == request_id:
            lr["status"] = decision
            emp = get_employee(lr["employee_id"])
            name = emp["name"] if emp else lr["employee_id"]
            await _send_ui("StatusBanner", {
                "message": f"Leave {request_id} for {name} has been {decision}.",
                "type": "success" if decision == "approved" else "warning",
            }, category="status")
            return f"Leave {request_id} {decision} for {name}."
    return f"Leave request {request_id} not found."


@function_tool()
async def show_status(context: RunContext, message: str, status_type: str = "info"):
    """Show a notification banner. status_type: info|success|warning|error."""
    await _send_ui("StatusBanner", {"message": message, "type": status_type}, category="status")
    return f"Status shown: {message}"


# ── Agent Class ─────────────────────────────────────────

ALL_TOOLS = [
    check_leave_balance, apply_for_leave, show_my_profile, show_pay_slip,
    check_loan_eligibility_tool, show_loan_balance,
    request_document, show_my_documents,
    show_announcements,
    calculate_travel_allowance,
    start_interview, next_interview_question,
    show_team_attendance, show_pending_approvals, approve_leave,
    show_status,
]


class TaliqAgent(Agent):
    def __init__(self):
        emp = get_employee(CURRENT_EMPLOYEE_ID) or {}
        prompt = SYSTEM_PROMPT.format(
            employee_name=emp.get("name", "Unknown"),
            employee_id=CURRENT_EMPLOYEE_ID,
            mode=CURRENT_MODE,
            department=emp.get("department", "Unknown"),
            grade=emp.get("grade", "N/A"),
        )
        super().__init__(instructions=prompt, tools=ALL_TOOLS)


async def _handle_user_action(data: bytes):
    """Handle button clicks from the frontend."""
    global _session_ref
    try:
        msg = json.loads(data.decode("utf-8"))
        if msg.get("type") != "user_action":
            return
        action = msg.get("action", "")
        logger.info(f"User action received: {action} — {msg}")
        
        # Route action to the agent as a spoken instruction
        if _session_ref and action:
            # Map UI actions to natural language for the agent
            action_prompts = {
                "approve_leave": f"Approve leave request {msg.get('request_id', '')}",
                "check_leave_balance": "Show my leave balance",
                "show_pay_slip": "Show my pay slip",
                "request_document": f"Request a {msg.get('document_type', 'Salary Certificate')}",
                "apply_leave_prompt": "I want to apply for leave",
                "download_payslip": f"Download pay slip for {msg.get('month', 'this month')}",
                "apply_loan": "I want to apply for a loan",
            }
            prompt = action_prompts.get(action, f"User clicked: {action}")
            # Inject as a chat message the agent processes
            await _session_ref.say(f"Processing your request...", allow_interruptions=True)
            logger.info(f"Routed user action to agent: {prompt}")
    except Exception as e:
        logger.error(f"Failed to handle user action: {e}")


async def entrypoint(ctx: JobContext):
    global _room_ref, _session_ref
    logger.info(f"Job started: room={ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    _room_ref = ctx.room
    logger.info(f"Connected. room.metadata={ctx.room.metadata!r}")

    # Listen for user actions from the frontend
    @ctx.room.on("data_received")
    def on_data(data: rtc.DataPacket):
        if data.topic == "user_action":
            import asyncio
            asyncio.ensure_future(_handle_user_action(data.data))

    session = AgentSession(
        vad=silero.VAD.load(
            min_silence_duration=1.5,
            activation_threshold=0.35,
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

    await session.start(room=ctx.room, agent=TaliqAgent())

    emp = get_employee(CURRENT_EMPLOYEE_ID)
    name = emp["name"].split()[0] if emp else "there"
    await session.say(
        f"Ahlan, {name}! I'm Taliq, your HR assistant. How can I help you today?",
        allow_interruptions=True,
    )
    logger.info("Greeting sent. Agent ready.")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        agent_name="taliq",
        worker_type=WorkerType.ROOM,
        job_executor_type=JobExecutorType.THREAD,
    ))
