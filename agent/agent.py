from pixel_office import PixelOffice as _PixelOffice
_po = _PixelOffice("taliq")

"""Taliq - Voice-First HR Agent with real CRUD, interactive forms, and self-service.

Modular architecture:
  tools/core.py       — shared state (_room_ref, _send_ui, employee context)
  tools/forms.py      — interactive form tools
  tools/employee.py   — employee read/CRUD/requests tools
  tools/attendance.py — clock in/out, overtime
  tools/interview.py  — AI interview tools
  tools/performance.py — performance, goals, training, grievance, notifications
  tools/manager.py    — manager dashboard, approvals, analytics, team admin
  tools/expenses.py   — expenses, claims, payments
  tools/gosi.py       — GOSI & end of service
  tools/modules.py    — letters, contracts, assets, shifts, reports, directory, iqama, exit
"""

import json
import logging

# Suppress OpenAI TTS request_id warnings
import logging
logging.getLogger("livekit.plugins.openai.tts").setLevel(logging.ERROR)
import os
import asyncio
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
)
from livekit.plugins import deepgram, openai, silero
from livekit import rtc

import database as db

logger = logging.getLogger('taliq-agent')

# Smart Turn v3.2 — intelligent turn detection
try:
    from smart_turn import SmartTurnDetector
    _smart_turn = SmartTurnDetector(threshold=0.5, use_gpu=True)
    if _smart_turn.available:
        logger.info("Smart Turn v3.2 loaded — enhanced turn detection active")
    else:
        logger.warning("Smart Turn model not available — using VAD-only")
        _smart_turn = None
except Exception as e:
    logger.warning(f"Smart Turn import failed: {e} — using VAD-only")
    _smart_turn = None
from edge_tts_plugin import EdgeTTS

# Import all tools and core utilities from modular tools package
from tools.candidate_interview import (
    init_candidate_interview, get_interview_system_prompt,
    next_interview_question, score_candidate_answer, complete_candidate_interview,
)
from tools.payroll import (
    show_payroll_runs, show_my_payslip, show_journal_voucher,
    list_gl_accounts, show_salary_history, give_salary_raise,
    show_eos_balance, show_all_eos_provisions,
)
from tools import (
    acknowledge_announcement,
    # Core
    get_current_employee_id_from_context,
    set_current_employee_id,
    set_room_ref,
    set_session_ref,
    get_session_ref,
    _send_ui,
    DEFAULT_EMPLOYEE_ID,
    # Forms
    show_leave_form, show_document_form, show_loan_form, show_travel_form, show_profile_edit,
    # Employee
    check_leave_balance, show_my_leave_requests, show_my_profile, show_pay_slip,
    check_loan_eligibility, show_loan_balance, show_my_documents, show_announcements,
    show_team_attendance, show_status, apply_for_leave, apply_for_loan,
    request_document, create_travel_request, show_my_requests,
    # Attendance
    clock_me_in, clock_me_out, show_my_attendance, request_overtime_approval,
    # Interview
    start_new_interview, score_current_answer, show_interview_results,
    # Performance / Training / Grievance / Notifications
    show_my_performance, create_performance_review, show_my_goals, set_new_goal, update_goal,
    show_available_trainings, enroll_in_training, show_my_trainings, show_training_calendar, show_course_materials,
    list_available_exams, start_exam, submit_exam_answers, show_my_exam_history, show_course_content,
    file_grievance, show_my_grievances, show_notifications,
    show_training_calendar, show_course_materials,
    list_available_exams, start_exam, submit_exam_answers, show_my_exam_history, show_course_content,
    # Manager
    show_pending_approvals, approve_leave, show_team_overview, show_department_stats,
    show_leave_calendar, show_dashboard, show_leave_history,
    approve_loan_request, approve_travel_request, approve_overtime_request, approve_document_request,
    show_team_grievances, resolve_team_grievance,
    show_team_performance, show_team_training_compliance, show_all_pending_approvals,
    show_leave_analytics, show_headcount_report, reassign_team_member, show_employee_details,
    # Expenses / Claims / Payments
    submit_expense, show_my_expenses, show_expense_form, approve_expense_request, show_pending_expenses,
    submit_claim, show_my_claims, show_claim_form, approve_claim_request, show_pending_claims,
    show_my_payments, show_all_payments_admin,
    # GOSI
    show_gosi_breakdown, show_end_of_service,
    # Modules
    generate_letter, show_my_letters,
    show_my_contract, show_expiring_contracts,
    show_my_assets, show_all_assets,
    show_my_shift, show_team_shifts,
    show_hr_report, show_payroll_summary,
    search_directory, show_org_chart,
    show_my_iqama_visa, show_expiring_documents,
    initiate_exit_request, show_exit_status, show_all_exits,
    view_audit_log,
    bulk_approve_pending_leaves,
    bulk_approve_pending_expenses,
    send_pending_notifications,
    # Recruitment Pipeline
    list_job_postings, view_job_details, create_job_posting, list_applications,
    advance_candidate, show_recruitment_stats, close_job_posting,
    # Geofencing / GPS Attendance
    clock_in_gps, clock_out_gps, list_office_locations, manage_geofence,
    # Multi-Level Approval Workflows
    view_pending_approvals, approve_request, reject_request, view_approval_chain, show_approval_workflows,
)

load_dotenv()
logger = logging.getLogger("taliq-agent")
logging.basicConfig(level=logging.INFO)


# ============================================================
# SYSTEM PROMPT
# ============================================================

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
- "Submit a travel expense for 450 SAR" -> show_expense_form (PRE-FILLED with extracted details for review)
- "Submit expense" / "New expense" (no details) -> show_expense_form (interactive form)
- "Show my expenses" -> show_my_expenses
- Categories: travel, meals, office_supplies, training, communication, other

CLAIMS:
- "Submit claim" / "File a claim" -> show_claim_form (interactive form)
- "Show my claims" -> show_my_claims
- Types: medical, dental, vision, education, relocation, other

GOSI & END OF SERVICE:
- "Show my GOSI" / "GOSI breakdown" -> show_gosi_breakdown
- "End of service" / "Gratuity" / "EOS" -> show_end_of_service (reason: termination/resignation)

PAYMENTS:
- "Show my payments" / "Payment history" -> show_my_payments (salary, reimbursements, bonuses)

LETTERS:
- "Generate employment certificate" -> generate_letter
- "Show my letters" -> show_my_letters

CONTRACTS:
- "Show my contract" -> show_my_contract

ASSETS:
- "Show my assets" -> show_my_assets

SHIFTS:
- "Show my shift" -> show_my_shift

IQAMA / VISA:
- "Show my iqama" -> show_my_iqama_visa

EXIT:
- "I want to resign" -> initiate_exit_request
- "Exit status" -> show_exit_status

DIRECTORY:
- "Search directory" -> search_directory
- "Org chart" -> show_org_chart

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
- "HR report" -> show_hr_report
- "Payroll summary" -> show_payroll_summary

Grievance Management:
- "Team grievances" -> show_team_grievances
- "Resolve grievance GRV-xxx" -> resolve_team_grievance (ref, resolution)

Team Administration:
- "Show employee details E001" -> show_employee_details (full 360 view)
- "Reassign employee" -> reassign_team_member (employee_id, new_manager_id)
- "Expiring contracts" -> show_expiring_contracts
- "All assets" -> show_all_assets
- "Team shifts" -> show_team_shifts
- "Expiring documents" -> show_expiring_documents
- "All exits" -> show_all_exits

When a manager logs in, proactively mention pending items count.

EXAMS & ASSESSMENTS:
- "Show available exams" -> list_available_exams
- "Take the safety exam" -> start_exam (needs exam_id)
- "Show my exam history" -> show_my_exam_history
- "Show course materials for course 1" -> show_course_content (needs course_id)
- "Show training calendar" -> show_training_calendar
When a user submits exam answers via the form, use submit_exam_answers with the attempt_id and answers JSON.
Exams can be for training verification OR interview assessments.
"""


# ============================================================
# TOOL LISTS
# ============================================================

ALL_TOOLS = [
    # Dashboard
    show_dashboard, show_leave_history,
    # Interactive forms
    show_leave_form, show_document_form, show_loan_form, show_travel_form, show_profile_edit,
    # Read
    check_leave_balance, show_my_leave_requests, show_pending_approvals,
    show_my_profile, show_pay_slip, check_loan_eligibility, show_loan_balance,
    show_my_documents, show_announcements, show_team_attendance, show_status,
    # CRUD
    apply_for_leave, approve_leave, apply_for_loan, request_document, create_travel_request,
    # Attendance
    clock_me_in, clock_me_out, show_my_attendance, request_overtime_approval,
    # Interview
    start_new_interview, score_current_answer, show_interview_results,
    # Performance
    show_my_performance, create_performance_review, show_my_goals, set_new_goal, update_goal,
    # Training
    show_available_trainings, enroll_in_training, show_my_trainings, show_training_calendar, show_course_materials,
    list_available_exams, start_exam, submit_exam_answers, show_my_exam_history, show_course_content,
    # Grievance
    file_grievance, show_my_grievances,
    # Notifications
    show_notifications,
    acknowledge_announcement,
    # All Requests
    show_my_requests,
    # Expenses
    submit_expense, show_my_expenses, show_expense_form,
    # Claims
    submit_claim, show_my_claims, show_claim_form,
    # Payments
    show_my_payments,
    # Manager - Basic
    show_team_overview, show_department_stats, show_leave_calendar,
    # Manager - Approvals
    approve_loan_request, approve_travel_request, approve_overtime_request, approve_document_request,
    # Manager - Grievance
    show_team_grievances, resolve_team_grievance,
    # Manager - Analytics
    show_team_performance, show_team_training_compliance, show_all_pending_approvals,
    show_leave_analytics, show_headcount_report,
    # Manager - Expenses & Claims
    approve_expense_request, show_pending_expenses,
    approve_claim_request, show_pending_claims,
    show_all_payments_admin,
    show_gosi_breakdown, show_end_of_service,
    # Manager - Administration
    reassign_team_member, show_employee_details,
    # Letter Generation
    generate_letter, show_my_letters,
    # Contract Management
    show_my_contract, show_expiring_contracts,
    # Asset Tracking
    show_my_assets, show_all_assets,
    # Shift Scheduling
    show_my_shift, show_team_shifts,
    # Reports & Analytics
    show_hr_report, show_payroll_summary,
    # Employee Directory
    search_directory, show_org_chart,
    # Iqama / Visa
    show_my_iqama_visa, show_expiring_documents,
    # Exit / Offboarding
    initiate_exit_request, show_exit_status, show_all_exits,
    # Admin operations
    view_audit_log, bulk_approve_pending_leaves, bulk_approve_pending_expenses, send_pending_notifications,
    # Recruitment Pipeline
    list_job_postings, view_job_details, create_job_posting, list_applications, advance_candidate, show_recruitment_stats, close_job_posting,
    # Geofencing / GPS Attendance
    clock_in_gps, clock_out_gps, list_office_locations, manage_geofence,
    # Multi-Level Approval Workflows
    view_pending_approvals, approve_request, reject_request, view_approval_chain, show_approval_workflows,
    show_payroll_runs,
    show_my_payslip,
    show_journal_voucher,
    list_gl_accounts,
    show_salary_history,
    give_salary_raise,
    show_eos_balance,
    show_all_eos_provisions,
]


# Candidate interview tools (used in interview mode only)
INTERVIEW_TOOLS = [
    next_interview_question,
    score_candidate_answer,
    complete_candidate_interview,
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
    "approve_expense_request", "show_pending_expenses",
    "approve_claim_request", "show_pending_claims",
    "show_all_payments_admin",
    "show_expiring_contracts", "show_all_assets", "show_team_shifts",
    "show_hr_report", "show_payroll_summary",
    "show_expiring_documents", "show_all_exits",
    "view_audit_log", "bulk_approve_pending_leaves", "bulk_approve_pending_expenses", "send_pending_notifications",
    # Recruitment (manager)
    "create_job_posting", "advance_candidate", "close_job_posting", "show_recruitment_stats",
    # Geofencing management
    "manage_geofence",
    # Approval workflows (manager)
    "view_pending_approvals", "approve_request", "reject_request", "show_approval_workflows",
}


def get_tools_for_employee(emp_id: str):
    tools = list(ALL_TOOLS)
    if not db.is_manager(emp_id):
        tools = [t for t in tools if t.__name__ not in MANAGER_ONLY_TOOLS]
    return tools


# ============================================================
# AGENT CLASS
# ============================================================


class InterviewAgent(Agent):
    """Agent in candidate interview mode — uses interview-specific prompt and tools."""
    def __init__(self, candidate_name: str, position: str, questions: list):
        super().__init__(
            instructions=get_interview_system_prompt(candidate_name, position, questions),
            tools=INTERVIEW_TOOLS,
        )

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


# ============================================================
# DATA CHANNEL HANDLER
# ============================================================

async def _handle_data(data: rtc.DataPacket):
    session = get_session_ref()
    if not session:
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
            "submit_expense": lambda: f"Submit expense: {msg.get('category','')} - {msg.get('description','')} - {msg.get('amount',0)} SAR on {msg.get('expense_date','')}",
            "submit_claim": lambda: f"Submit claim: {msg.get('claim_type','')} - {msg.get('description','')} - {msg.get('amount',0)} SAR",
            "submit_leave": lambda: f"Submit leave request: {msg.get('leave_type', 'annual')} leave from {msg.get('start_date', '')} to {msg.get('end_date', '')}, {msg.get('days', 0)} days, reason: {msg.get('reason', 'personal')}",
            "submit_loan": lambda: f"Apply for {msg.get('loan_type', 'Interest-Free')} loan of {msg.get('amount', 0)} SAR over {msg.get('months', 12)} months",
            "submit_document_request": lambda: f"Request a {msg.get('document_type', 'Salary Certificate')}",
            "submit_travel": lambda: f"Create travel request to {msg.get('destination', '')} from {msg.get('start_date', '')} to {msg.get('end_date', '')}, {msg.get('days', 0)} days, {msg.get('travel_type', 'business')}",
            "update_profile": lambda: f"Update profile: phone={msg.get('phone', '')}, email={msg.get('email', '')}",
            "approve_leave": lambda: f"Approve leave {msg.get('request_id', '')} decision {msg.get('decision', 'approved')}",
            "check_leave_balance": lambda: "Show my leave balance",
            "show_pay_slip": lambda: "Show my pay slip",
            "request_document": lambda: f"Request a {msg.get('document_type', 'Salary Certificate')}",
            "apply_leave_prompt": lambda: "I want to apply for leave. Show the leave form.",
            "download_payslip": lambda: f"Show pay slip for {msg.get('month', 'this month')}",
            "apply_loan": lambda: "I want to apply for a loan. Show the loan form.",
            "clock_in": lambda: f"Clock me in at {msg.get('location', 'office')}",
            "clock_out": lambda: "Clock me out",
            "calculate_eos": lambda: f"Calculate end of service for {msg.get('reason', 'termination')}",
            "submit_exam": lambda: f"Submit exam answers for attempt {msg.get('attempt_id', '')} with answers: {json.dumps(msg.get('answers', {}))}",
            "retry_exam": lambda: f"Start exam {msg.get('exam_id', '')} again",
            "enroll_training": lambda: f"Enroll in training course {msg.get('courseId', '')}",
        }
        handler = action_map.get(action)
        text = handler() if handler else f"User action: {action}"

    if not text:
        return

    logger.info(f"Input: {text}")
    try:
        session.generate_reply(user_input=text)
    except Exception as e:
        logger.error(f"Reply error: {e}")


# ============================================================
# ENTRYPOINT
# ============================================================

async def entrypoint(ctx: JobContext):
    logger.info("Entrypoint starting...")
    try:
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    except Exception as e:
        logger.error(f"Failed to connect: {e}")
        return
    set_room_ref(ctx.room)
    _po.busy("Taliq HR - active session")
    ctx.room.on("disconnected", lambda *_: _po.online("Waiting for calls..."))
    logger.info(f"Connected to room: {ctx.room.name}, metadata: {ctx.room.metadata}")

    employee_id = DEFAULT_EMPLOYEE_ID
    lang = "en"
    meta_sources = [ctx.room.metadata]
    for p in ctx.room.remote_participants.values():
        if p.metadata:
            meta_sources.append(p.metadata)
    for meta_str in meta_sources:
        if not meta_str:
            continue
        try:
            metadata = json.loads(meta_str)
            if metadata.get("employee_id"):
                employee_id = metadata["employee_id"]
                lang = metadata.get("lang", "en")
                logger.info(f"Got employee_id={employee_id}, lang={lang} from metadata")
                break
        except (json.JSONDecodeError, TypeError):
            continue
    # Detect interview mode
    interview_mode = False
    interview_meta = {}
    for meta_str in meta_sources:
        if not meta_str:
            continue
        try:
            m = json.loads(meta_str)
            if m.get("mode") == "interview":
                interview_mode = True
                interview_meta = m
                logger.info(f"INTERVIEW MODE: candidate={m.get('candidate_name')}, app_ref={m.get('application_ref')}")
                break
        except (json.JSONDecodeError, TypeError):
            continue

    set_current_employee_id(employee_id)

    session = AgentSession(
        vad=silero.VAD.load(
            min_silence_duration=0.4,
            activation_threshold=0.3,
            prefix_padding_duration=0.3,
        ),
        stt=deepgram.STT(model="nova-3", language="ar" if lang == "ar" else "en", smart_format=True, no_delay=True, punctuate=True, interim_results=True),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=EdgeTTS(voice="ar-SA-HamedNeural") if lang == "ar" else openai.TTS(
            model="speaches-ai/Kokoro-82M-v1.0-ONNX",
            voice="af_heart",
            base_url=os.getenv("SPEACHES_URL", "http://localhost:8000") + "/v1",
            api_key="not-needed",
        ),
        allow_interruptions=True,
        min_endpointing_delay=0.15,
        max_endpointing_delay=1.2,
        min_interruption_duration=0.08,
    )
    set_session_ref(session)

    @ctx.room.on("data_received")
    def on_data(pkt: rtc.DataPacket):
        if pkt.topic in ("lk-chat", "user_action"):
            asyncio.ensure_future(_handle_data(pkt))

    # Branch based on mode
    if interview_mode:
        cand_name = interview_meta.get("candidate_name", "Candidate")
        cand_position = interview_meta.get("position", "General Position")
        app_id = interview_meta.get("application_id", 0)
        
        # Initialize interview state
        state = init_candidate_interview(int(app_id) if app_id else 0, cand_name, cand_position)
        questions = state.get("questions", [])
        
        await session.start(room=ctx.room, agent=InterviewAgent(cand_name, cand_position, questions))
        logger.info(f"Interview mode active for {cand_name}, {len(questions)} questions — LLM will drive")
        return
    
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

        await _send_ui("StatusBanner", {
            "message": f"Logged in as {full_name} - {position}, {dept}{role_label}",
            "type": "info",
        }, "session_info")

        if lang == "ar":
            greeting = f"أهلاً {name}! أنا تليق. مرحباً بك في قسم {dept}. كيف أقدر أساعدك؟"
        else:
            greeting = f"Ahlan {name}! I'm Taliq, your HR assistant. You're logged in as {full_name}, {position} in {dept}. How can I help you today?"
    else:
        name = "there"
        logger.warning(f"Employee {employee_id} not found in database")
        greeting = "Hello! I couldn't find your profile. Please log out and try again."

    await session.say(greeting, allow_interruptions=True)

    # Check for unread login announcements
    try:
        unread_announcements = db.get_unread_login_announcements(employee_id)
        if unread_announcements:
            for ann in unread_announcements[:3]:  # Max 3 announcements at login
                db.mark_announcement_read(ann["id"], employee_id)
                await _send_ui("AnnouncementCard", {
                    "id": ann["id"],
                    "title": ann["title"],
                    "content": ann["content"],
                    "author": ann["author"],
                    "priority": ann["priority"],
                    "date": str(ann["created_at"])[:10],
                    "requireAcknowledge": True,
                }, "announcement")
                # Speak the announcement
                priority_prefix = "Urgent announcement: " if ann["priority"] == "urgent" else "Important announcement: " if ann["priority"] == "important" else ""
                await session.say(
                    f"{priority_prefix}{ann['title']}. {ann['content']}. Please acknowledge this announcement.",
                    allow_interruptions=True
                )
                await asyncio.sleep(0.5)
    except Exception as e:
        logger.error(f"Error checking login announcements: {e}")

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


# ============================================================
# ADMIN API & MAIN
# ============================================================

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
    def _prewarm(proc):
        _po.online("Taliq HR Agent - ready")

    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=_prewarm,
            agent_name="taliq",
            worker_type=WorkerType.ROOM,
            job_executor_type=JobExecutorType.THREAD,
        )
    )
