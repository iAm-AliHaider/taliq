"""Candidate Voice Interview — conducts structured interviews for recruitment pipeline.

When mode='interview' is detected in room metadata, the agent enters interview mode:
- Greets candidate by name
- Asks questions from the interview question bank
- Scores answers using multi-dimensional rubric
- Saves results back to candidate_interviews table
"""

import json
import logging
from livekit.agents import function_tool, RunContext
import database as db
from tools.core import _send_ui

logger = logging.getLogger("taliq-interview")

# Interview state (per-session)
_interview_state: dict = {}


def init_candidate_interview(application_id: int, candidate_name: str, position: str):
    """Initialize interview state when agent connects in interview mode."""
    global _interview_state
    
    # Load questions from DB
    questions = db.run_query(
        "SELECT id, question, category, max_points, evaluation_criteria, sort_order "
        "FROM interview_question_banks WHERE stage = 'hr_screening' ORDER BY sort_order"
    )
    
    # Check for existing interview
    existing = db.run_query(
        "SELECT id, status FROM candidate_interviews WHERE application_id = %s ORDER BY id DESC LIMIT 1",
        (application_id,)
    )
    
    interview_id = None
    if existing and existing[0]["status"] == "in_progress":
        interview_id = existing[0]["id"]
    elif not existing or existing[0]["status"] != "completed":
        # Create new interview record
        result = db.run_query(
            "INSERT INTO candidate_interviews (application_id, ref, position, questions, status, started_at) "
            "VALUES (%s, %s, %s, %s, 'in_progress', NOW()) RETURNING id",
            (application_id, f"VINT-{application_id}-voice", position, json.dumps([dict(q) for q in questions]))
        )
        if result:
            interview_id = result[0]["id"]
        # Update application
        db.run_query(
            "UPDATE job_applications SET interview_ref = %s WHERE id = %s",
            (f"VINT-{application_id}-voice", application_id)
        )
    
    _interview_state = {
        "application_id": application_id,
        "candidate_name": candidate_name,
        "position": position,
        "interview_id": interview_id,
        "questions": questions or [],
        "current_q": 0,
        "answers": [],
        "scores": {},
        "started": True,
        "completed": False,
    }
    
    logger.info(f"Interview initialized for {candidate_name}, {len(questions)} questions, interview_id={interview_id}")
    return _interview_state


def get_interview_system_prompt(candidate_name: str, position: str, questions: list) -> str:
    """Generate the system prompt for interview mode."""
    q_list = "\n".join([f"  Q{i+1}: {q['question']} (Category: {q['category']}, Max: {q['max_points']} pts)" for i, q in enumerate(questions)])
    
    return f"""You are Taliq, an AI interviewer conducting a structured HR screening interview.

CANDIDATE: {candidate_name}
POSITION: {position}
MODE: Voice Interview — be professional, warm, and encouraging.

YOUR INTERVIEW QUESTIONS (ask them IN ORDER, one at a time):
{q_list}

RULES:
1. Start by greeting the candidate warmly: "Welcome {candidate_name}! I'm Taliq, your AI interviewer today. We'll go through a few questions about your background and experience for the {position} role. Take your time with each answer."
2. Ask ONE question at a time. Wait for the answer.
3. After each answer, briefly acknowledge it ("Thank you" or "Great, let me note that") then call score_candidate_answer with your assessment.
4. After scoring, call next_interview_question to move to the next question.
5. After ALL questions are answered, call complete_candidate_interview.
6. Keep your own speech SHORT (1-2 sentences). Let the candidate talk.
7. If the candidate asks to repeat a question, repeat it.
8. Be encouraging but professional. This is a formal interview.
9. Score fairly: 1-2 = poor, 3-4 = below average, 5-6 = average, 7-8 = good, 9-10 = excellent.

DO NOT skip questions. DO NOT ask multiple questions at once. DO NOT reveal scores to the candidate.
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
    
    # Send question card to UI
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
    """Score the candidate's answer on the current question.
    
    Args:
        communication_score: 1-10, how well they communicated (clarity, structure)
        relevance_score: 1-10, how relevant to the question
        depth_score: 1-10, depth of answer (examples, specifics)
        summary: Brief summary of what the candidate said
    """
    global _interview_state
    state = _interview_state
    if not state.get("started"):
        return "No interview in progress."
    
    q_idx = state["current_q"] - 1  # current_q was already incremented
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
    
    return f"Scored question {q_idx+1}: {avg_score}/10. {'Move to next question.' if q_idx + 1 < len(state['questions']) else 'All questions done. Call complete_candidate_interview.'}"


@function_tool()
async def complete_candidate_interview(context: RunContext):
    """Complete the interview, calculate final score, and save results. Call after all questions are scored."""
    global _interview_state
    state = _interview_state
    if not state.get("started"):
        return "No interview in progress."
    
    answers = state["answers"]
    if not answers:
        return "No answers recorded. Cannot complete interview."
    
    # Calculate final score
    total_scored = sum(a["scaled_score"] for a in answers)
    total_max = sum(a["max_points"] for a in answers)
    percentage = round(total_scored / total_max * 100) if total_max > 0 else 0
    
    passed = percentage >= 60
    
    # Save to DB
    if state["interview_id"]:
        db.run_query(
            "UPDATE candidate_interviews SET answers = %s, scores = %s, total_score = %s, "
            "status = 'completed', completed_at = NOW() WHERE id = %s",
            (json.dumps(answers), json.dumps(state["scores"]), percentage, state["interview_id"])
        )
        db.run_query(
            "UPDATE job_applications SET interview_score = %s, interview_completed_at = NOW() WHERE id = %s",
            (percentage, state["application_id"])
        )
    
    state["completed"] = True
    
    # Send result card
    await _send_ui("InterviewComplete", {
        "candidateName": state["candidate_name"],
        "position": state["position"],
        "score": percentage,
        "passed": passed,
        "totalQuestions": len(state["questions"]),
        "answeredQuestions": len(answers),
        "breakdown": [{"question": a["question"][:50], "score": a["average"], "category": a["category"]} for a in answers],
    }, "interview_card")
    
    result_msg = (
        f"Interview complete for {state['candidate_name']}. "
        f"Score: {percentage}%. "
        f"{'Passed — candidate is recommended for the next stage.' if passed else 'Below threshold — candidate may not be a strong fit.'}"
    )
    
    logger.info(f"Interview complete: {state['candidate_name']}, score={percentage}%, passed={passed}")
    return result_msg
