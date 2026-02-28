"""AI Interview tools — start, score, and review interviews."""

from livekit.agents import function_tool, RunContext
import database as db
from tools.core import get_current_employee_id_from_context, _send_ui


@function_tool()
async def start_new_interview(context: RunContext, candidate_name: str, position: str = "General", stage: str = "hr_screening"):
    """Start a new AI-powered interview. Stage can be: hr_screening, technical, behavioral, leadership."""
    emp_id = get_current_employee_id_from_context()
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

    responses = db.get_interview_responses(iv["id"])
    all_scores = [r["score"] for r in responses]

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
