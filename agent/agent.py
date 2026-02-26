"""Taliq — تَلِيق — Voice-First HR Agent (LiveKit Agents v1.4+)."""

import json
import logging
import os
from dotenv import load_dotenv

from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    function_tool,
    RunContext,
)
from livekit.plugins import deepgram, openai, silero

from hr_data import (
    EMPLOYEES, INTERVIEW_TEMPLATES, JOB_OPENINGS,
    get_employee, get_team_attendance, get_pending_approvals,
    submit_leave_request,
)

load_dotenv()

logger = logging.getLogger("taliq-agent")

# ── Current User Context ────────────────────────────────
# In production, this comes from auth token / room metadata
CURRENT_EMPLOYEE_ID = os.getenv("TALIQ_EMPLOYEE_ID", "E001")
CURRENT_MODE = os.getenv("TALIQ_MODE", "employee")  # employee | interviewer | manager

_room_ref = None

SYSTEM_PROMPT = """You are Taliq (تَلِيق), an eloquent Arabic-inspired HR voice assistant.

You serve employees, managers, and candidates with warmth and professionalism.
You speak concisely (1-2 sentences) since this is voice.
You can show UI widgets on the user's screen while you talk.

CURRENT CONTEXT:
- Employee: {employee_name} ({employee_id})
- Mode: {mode}
- Department: {department}

YOUR CAPABILITIES:
1. Employee Self-Service: check leave balance, apply for leave, view profile, view pay slip
2. Interview: conduct structured interviews with scoring
3. Manager: view team attendance, approve/reject leave, see analytics
4. General: answer HR policy questions, guide onboarding

RULES:
- Keep voice responses SHORT (1-2 sentences max)
- Show UI when it helps — forms, cards, dashboards
- Be warm but professional
- Use "Marhaba" (مرحبا) or "Ahlan" (أهلاً) in greetings
- Currency is SAR (Saudi Riyal)
- Week starts Sunday in Saudi Arabia
"""


# ── UI Helper ───────────────────────────────────────────

async def _send_ui(component: str, props: dict):
    global _room_ref
    if not _room_ref or not _room_ref.local_participant:
        logger.warning("No room, can't send UI")
        return
    payload = json.dumps({
        "type": "tambo_render",
        "component": component,
        "props": props,
    }).encode("utf-8")
    await _room_ref.local_participant.publish_data(payload, topic="ui_sync", reliable=True)
    logger.info(f"UI sent: {component}")


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
    })
    return f"{emp['name']} has {bal['annual']} annual, {bal['sick']} sick, and {bal['emergency']} emergency days."


@function_tool()
async def apply_for_leave(
    context: RunContext,
    leave_type: str,
    start_date: str,
    end_date: str,
    days: int,
    reason: str,
):
    """Submit a leave request. leave_type: annual|sick|emergency. Dates in YYYY-MM-DD."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."
    bal = emp["leave_balance"].get(leave_type, 0)
    if days > bal:
        await _send_ui("StatusBanner", {"message": f"Insufficient {leave_type} leave. You have {bal} days.", "type": "error"})
        return f"Cannot apply. Only {bal} {leave_type} days remaining."
    
    await _send_ui("LeaveRequestForm", {
        "employeeName": emp["name"],
        "leaveType": leave_type,
        "startDate": start_date,
        "endDate": end_date,
        "days": days,
        "reason": reason,
        "balance": bal,
        "status": "preview",
    })
    
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
    })
    return f"Leave request {lr['id']} submitted! {days} {leave_type} days from {start_date} to {end_date}."


@function_tool()
async def show_my_profile(context: RunContext):
    """Show the employee's profile card with personal and job details."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."
    await _send_ui("EmployeeProfileCard", {
        "name": emp["name"],
        "nameAr": emp["name_ar"],
        "position": emp["position"],
        "department": emp["department"],
        "email": emp["email"],
        "phone": emp["phone"],
        "joinDate": emp["join_date"],
        "employeeId": emp["id"],
    })
    return f"Here's your profile, {emp['name']}."


@function_tool()
async def show_pay_slip(context: RunContext, month: str = "February 2026"):
    """Show the employee's pay slip for a given month."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."
    sal = emp["salary"]
    deductions = int(sal["total"] * 0.0975)  # ~GOSI
    await _send_ui("PaySlipCard", {
        "employeeName": emp["name"],
        "month": month,
        "basic": sal["basic"],
        "housing": sal["housing"],
        "transport": sal["transport"],
        "deductions": deductions,
        "netPay": sal["total"] - deductions,
        "currency": sal["currency"],
    })
    return f"Here's your pay slip for {month}. Net pay: {sal['total'] - deductions} {sal['currency']}."


# ── Interview Tools ─────────────────────────────────────

@function_tool()
async def start_interview(
    context: RunContext,
    job_type: str = "general",
    candidate_name: str = "Candidate",
):
    """Start a structured interview. job_type: software_engineer|ui_designer|general."""
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
    })
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
    """Move to next interview question. score 1-5 for previous answer."""
    template = INTERVIEW_TEMPLATES.get(job_type, INTERVIEW_TEMPLATES["general"])
    questions = template["questions"]
    
    try:
        scores = json.loads(scores_json)
    except:
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
        })
        return f"Interview complete! Average score: {avg:.1f}/5. {candidate_name} scored {scores}."
    
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
    })
    return f"Question {question_number}: {q['q']}"


# ── Manager Tools ───────────────────────────────────────

@function_tool()
async def show_team_attendance(context: RunContext):
    """Show today's attendance for the manager's team."""
    emp = get_employee(CURRENT_EMPLOYEE_ID)
    if not emp:
        return "Employee not found."
    attendance = get_team_attendance(CURRENT_EMPLOYEE_ID)
    await _send_ui("AttendanceDashboard", {
        "managerName": emp["name"],
        "date": str(__import__('datetime').date.today()),
        "team": attendance,
    })
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
    await _send_ui("ApprovalQueue", {"items": items})
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
            })
            return f"Leave {request_id} {decision} for {name}."
    return f"Leave request {request_id} not found."


@function_tool()
async def show_status(context: RunContext, message: str, status_type: str = "info"):
    """Show a notification banner. status_type: info|success|warning|error."""
    await _send_ui("StatusBanner", {"message": message, "type": status_type})
    return f"Status shown: {message}"


# ── Agent Class ─────────────────────────────────────────

class TaliqAgent(Agent):
    def __init__(self):
        emp = get_employee(CURRENT_EMPLOYEE_ID) or {}
        prompt = SYSTEM_PROMPT.format(
            employee_name=emp.get("name", "Unknown"),
            employee_id=CURRENT_EMPLOYEE_ID,
            mode=CURRENT_MODE,
            department=emp.get("department", "Unknown"),
        )
        super().__init__(
            instructions=prompt,
            tools=[
                check_leave_balance, apply_for_leave, show_my_profile,
                show_pay_slip, start_interview, next_interview_question,
                show_team_attendance, show_pending_approvals, approve_leave,
                show_status,
            ],
        )


async def entrypoint(ctx: JobContext):
    global _room_ref
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    _room_ref = ctx.room
    logger.info(f"Taliq connected to room: {ctx.room.name}")

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
            base_url="http://localhost:8000/v1",
            api_key="not-needed",
        ),
    )

    await session.start(room=ctx.room, agent=TaliqAgent())

    emp = get_employee(CURRENT_EMPLOYEE_ID)
    name = emp["name"].split()[0] if emp else "there"
    await session.say(
        f"Ahlan, {name}! I'm Taliq, your HR assistant. How can I help you today?",
        allow_interruptions=True,
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, agent_name="taliq"))
