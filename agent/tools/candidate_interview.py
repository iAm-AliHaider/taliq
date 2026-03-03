"""Candidate Voice Interview — conducts structured interviews for recruitment pipeline."""

import json
import logging
from livekit.agents import function_tool, RunContext
import database as db
from tools.core import _send_ui

logger = logging.getLogger("taliq-interview")

_interview_state: dict = {}


def _query(sql, params=None, fetch="all"):
    """Helper: run a query using database.py's get_db pattern."""
    conn = db.get_db()
    try:
        c = conn.cursor()
        c.execute(sql, params or ())
        if fetch == "one":
            result = db._fetchone(c)
        elif fetch == "all":
            result = db._fetchall(c)
        else:
            result = None
        conn.commit()
        return result
    except Exception as e:
        conn.rollback()
        logger.error(f"DB error: {e}")
        return [] if fetch == "all" else None
    finally:
        conn.close()


def init_candidate_interview(application_id: int, candidate_name: str, position: str):
    """Initialize interview state when agent connects in interview mode."""
    global _interview_state

    questions = _query(
        "SELECT id, question, category, max_points, evaluation_criteria, sort_order "
        "FROM interview_question_banks WHERE stage = 'hr_screening' ORDER BY sort_order"
    ) or []

    existing = _query(
        "SELECT id, status FROM candidate_interviews WHERE application_id = %s ORDER BY id DESC LIMIT 1",
        (application_id,), "one"
    )

    interview_id = None
    if existing and existing["status"] == "in_progress":
        interview_id = existing["id"]
    elif not existing or existing["status"] != "completed":
        result = _query(
            "INSERT INTO candidate_interviews (application_id, ref, position, questions, status, started_at) "
            "VALUES (%s, %s, %s, %s, 'in_progress', NOW()) RETURNING id",
            (application_id, f"VINT-{application_id}-voice", position, json.dumps([dict(q) for q in questions])),
            "one"
        )
        if result:
            interview_id = result["id"]
        _query(
            "UPDATE job_applications SET interview_ref = %s WHERE id = %s",
            (f"VINT-{application_id}-voice", application_id), None
        )

    _interview_state = {
        "application_id": application_id,
        "candidate_name": candidate_name,
        "position": position,
        "interview_id": interview_id,
        "questions": questions,
        "current_q": 0,
        "answers": [],
        "scores": {},
        "started": True,
        "completed": False,
    }

    logger.info(f"Interview initialized for {candidate_name}, {len(questions)} questions, interview_id={interview_id}")
    return _interview_state


def get_interview_system_prompt(candidate_name: str, position: str, questions: list) -> str:
    q_list = "\n".join([f"  Q{i+1}: {q['question']} (Category: {q['category']}, Max: {q.get('max_points', 10)} pts)" for i, q in enumerate(questions)])

    return f"""You are Taliq, an AI interviewer conducting a structured HR screening interview.

CANDIDATE: {candidate_name}
POSITION: {position}
MODE: Voice Interview — be professional, warm, and encouraging.

YOUR INTERVIEW QUESTIONS (ask them IN ORDER, one at a time):
{q_list}

RULES:
1. Start by greeting the candidate: "Welcome {candidate_name}! I'm Taliq, your AI interviewer today for the {position} role. Take your time with each answer."
2. Ask ONE question at a time. Wait for the answer.
3. After each answer, briefly acknowledge it then call score_candidate_answer with your assessment.
4. After scoring, call next_interview_question to move to the next question.
5. After ALL questions are answered, call complete_candidate_interview.
6. Keep your own speech SHORT (1-2 sentences). Let the candidate talk.
7. Score fairly: 1-2 = poor, 3-4 = below average, 5-6 = average, 7-8 = good, 9-10 = excellent.

DO NOT skip questions. DO NOT ask multiple questions at once. DO NOT reveal scores.
Start with the greeting, then ask Question 1."""


@function_tool()
async def next_interview_question(context: RunContext):
    """Move to the next interview question. Call this after scoring the previous answer."""
    global _interview_state
    state = _interview_state
    if not state.get("started"):
        return "No interview in progress."

    idx = state["current_q"]
    questions = state["questions"]

    if idx >= len(questions):
        return "All questions have been asked. Call complete_candidate_interview to finish."

    q = questions[idx]
    state["current_q"] = idx + 1

    await _send_ui("InterviewQuestion", {
        "questionNumber": idx + 1,
        "totalQuestions": len(questions),
        "question": q["question"],
        "category": q["category"],
        "progress": round((idx + 1) / len(questions) * 100),
    }, "interview_card")

    return f"Question {idx + 1} of {len(questions)}: {q['question']}"


@function_tool()
async def score_candidate_answer(
    context: RunContext,
    communication_score: int = 5,
    relevance_score: int = 5,
    depth_score: int = 5,
    summary: str = "",
):
    """Score the candidate's answer. communication_score, relevance_score, depth_score are 1-10."""
    global _interview_state
    state = _interview_state
    if not state.get("started"):
        return "No interview in progress."

    q_idx = state["current_q"] - 1
    if q_idx < 0 or q_idx >= len(state["questions"]):
        return "No question to score."

    q = state["questions"][q_idx]
    avg_score = round((communication_score + relevance_score + depth_score) / 3, 1)
    max_pts = q.get("max_points", 10)
    scaled = round(avg_score / 10 * max_pts, 1)

    answer_record = {
        "question_id": q["id"],
        "question": q["question"],
        "category": q["category"],
        "communication": communication_score,
        "relevance": relevance_score,
        "depth": depth_score,
        "average": avg_score,
        "scaled_score": scaled,
        "max_points": max_pts,
        "summary": summary,
    }
    state["answers"].append(answer_record)
    state["scores"][f"q_{q['id']}"] = avg_score

    logger.info(f"Scored Q{q_idx+1}: comm={communication_score} rel={relevance_score} depth={depth_score} avg={avg_score}")

    remaining = len(state["questions"]) - state["current_q"]
    if remaining > 0:
        return f"Scored question {q_idx+1}: {avg_score}/10. Call next_interview_question for the next question."
    return f"Scored question {q_idx+1}: {avg_score}/10. All questions done — call complete_candidate_interview."


@function_tool()
async def complete_candidate_interview(context: RunContext):
    """Complete the interview, calculate final score, and save results."""
    global _interview_state
    state = _interview_state
    if not state.get("started"):
        return "No interview in progress."

    answers = state["answers"]
    if not answers:
        return "No answers recorded yet."

    total_scored = sum(a["scaled_score"] for a in answers)
    total_max = sum(a["max_points"] for a in answers)
    percentage = round(total_scored / total_max * 100) if total_max > 0 else 0
    passed = percentage >= 60

    if state["interview_id"]:
        _query(
            "UPDATE candidate_interviews SET answers = %s, scores = %s, total_score = %s, "
            "status = 'completed', completed_at = NOW() WHERE id = %s",
            (json.dumps(answers), json.dumps(state["scores"]), percentage, state["interview_id"]),
            None
        )
        _query(
            "UPDATE job_applications SET interview_score = %s, interview_completed_at = NOW() WHERE id = %s",
            (percentage, state["application_id"]),
            None
        )

    state["completed"] = True

    await _send_ui("InterviewComplete", {
        "candidateName": state["candidate_name"],
        "position": state["position"],
        "score": percentage,
        "passed": passed,
        "totalQuestions": len(state["questions"]),
        "answeredQuestions": len(answers),
        "breakdown": [{"question": a["question"][:50], "score": a["average"], "category": a["category"]} for a in answers],
    }, "interview_card")

    return (
        f"Interview complete for {state['candidate_name']}. "
        f"Score: {percentage}%. "
        f"{'Passed — recommended for next stage.' if passed else 'Below threshold.'}"
    )
