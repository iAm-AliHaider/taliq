import json
import logging
import datetime
import asyncio
from livekit.agents import function_tool
from .core import _send_ui, get_room_ref
from database import get_db

def _query(sql, params=None, fetch=False):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        if fetch:
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]
        conn.commit()
        return None

_interview_state = {
    "started": False,
    "completed": False,
    "application_id": None,
    "candidate_name": "",
    "position": "",
    "interview_id": None,
    "questions": [],
    "current_q": 0,
    "answers": [],
    "scores": {
        "communication": 0,
        "technical": 0,
        "culture": 0,
        "overall": 0
    }
}

async def _delayed_disconnect(delay=10):
    """Wait for TTS to finish then disconnect."""
    await asyncio.sleep(delay)
    if get_room_ref():
        logger.info("Automatically disconnecting interview call...")
        try:
            await get_room_ref().disconnect()
        except Exception as e:
            logger.error(f"Disconnect error: {e}")

def get_candidate_interview_domain():
    domain = FunctionDomain()
    domain.add_tool(start_candidate_interview)
    domain.add_tool(next_interview_question)
    domain.add_tool(score_candidate_answer)
    domain.add_tool(complete_candidate_interview)
    return domain

@function_tool
async def start_candidate_interview(
    application_id: int,
    candidate_name: str,
    position: str,
    stage: str = "hr_screening"
):
    """Initialize a candidate interview session."""
    global _interview_state
    
    # Check if already started
    if _interview_state.get("started"):
        return f"Interview for {_interview_state['candidate_name']} is already in progress."

    # Fetch questions from bank
    questions = _query(
        "SELECT * FROM interview_question_banks WHERE category = %s ORDER BY sort_order",
        (stage,),
        True
    )
    
    if not questions:
        # Fallback to general questions
        questions = [
            {"id": 1, "question": "Tell me about yourself and your background.", "category": "General", "max_points": 10},
            {"id": 2, "question": "Why are you interested in this position?", "category": "General", "max_points": 10},
            {"id": 3, "question": "What are your greatest professional strengths?", "category": "General", "max_points": 10},
            {"id": 4, "question": "Where do you see yourself in five years?", "category": "General", "max_points": 10},
        ]

    # Create interview record in DB
    res = _query(
        "INSERT INTO candidate_interviews (application_id, candidate_name, position, stage, status, total_questions, started_at) "
        "VALUES (%s, %s, %s, %s, 'in_progress', %s, NOW()) RETURNING id",
        (application_id, candidate_name, position, stage, len(questions)),
        True
    )
    interview_id = res[0]["id"] if res else None

    # Ensure application is in interview stage
    _query("UPDATE job_applications SET stage = 'interview' WHERE id = %s", (application_id,), None)

    _interview_state.update({
        "started": True,
        "completed": False,
        "application_id": application_id,
        "candidate_name": candidate_name,
        "position": position,
        "interview_id": interview_id,
        "questions": questions,
        "current_q": 0,
        "answers": [],
        "scores": {"communication": 0, "technical": 0, "culture": 0, "overall": 0}
    })

    await _send_ui("InterviewStarted", {
        "candidateName": candidate_name,
        "position": position,
        "totalQuestions": len(questions)
    }, "interview_card")

    return (
        f"Interview initialized for {candidate_name} ({position}). "
        f"I have loaded {len(questions)} questions for the {stage} stage. "
        "Instructions for AI: Introduce yourself, explain the process, and then call next_interview_question to begin."
    )

@function_tool
async def next_interview_question():
    """Move to the next interview question."""
    global _interview_state
    state = _interview_state
    if not state.get("started"):
        return "No interview in progress. Call start_candidate_interview first."

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

@function_tool
async def score_candidate_answer(
    communication_score: int = 5,
    relevance_score: int = 5,
    depth_score: int = 5,
    summary: str = "",
):
    """Score the candidate's answer. Scores are 1-10."""
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

    remaining = len(state["questions"]) - state["current_q"]
    
    # Update DB with progress
    if state["interview_id"]:
        _query(
            "UPDATE candidate_interviews SET current_question = %s, answers = %s WHERE id = %s",
            (state["current_q"], json.dumps(state["answers"]), state["interview_id"]),
            None
        )

    if remaining > 0:
        return f"Scored question {q_idx+1}: {avg_score}/10. {remaining} questions left. Call next_interview_question for the next one."
    
    return f"Scored the final question: {avg_score}/10. All questions done. Call complete_candidate_interview to finish."

@function_tool
async def complete_candidate_interview():
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
            "UPDATE candidate_interviews SET answers = %s, total_score = %s, status = 'completed', completed_at = NOW() WHERE id = %s",
            (json.dumps(answers), percentage, state["interview_id"]),
            None
        )
        _query(
            "UPDATE job_applications SET interview_score = %s, interview_completed_at = NOW(), stage = 'interview' WHERE id = %s",
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

    # Start a delayed disconnect task
    asyncio.create_task(_delayed_disconnect(12))

    return (
        f"Interview complete for {state['candidate_name']}. Final score: {percentage}%. "
        f"{'Candidate recommended for next stage.' if passed else 'Performance below threshold.'} "
        "Inform the candidate that the session is complete and will disconnect automatically. Wish them a good day."
    )