"""AI Interview tools — start, score (multi-dimensional), analyze, and review interviews.
Inspired by FoloUp's structured rubric: communication, technical, soft skills, per-question summaries."""

import json
from livekit.agents import function_tool, RunContext
import database as db
from tools.core import get_current_employee_id_from_context, _send_ui


# ── Multi-dimensional scoring rubric ───────────────────────────

SCORING_DIMENSIONS = {
    "communication": {
        "label": "Communication",
        "description": "Clarity, articulation, active listening, structured responses",
        "weight": 0.25,
    },
    "technical": {
        "label": "Technical Knowledge",
        "description": "Domain expertise, problem-solving, practical application",
        "weight": 0.35,
    },
    "soft_skills": {
        "label": "Soft Skills",
        "description": "Teamwork, adaptability, leadership, emotional intelligence",
        "weight": 0.20,
    },
    "cultural_fit": {
        "label": "Cultural Fit",
        "description": "Values alignment, work ethic, initiative, professionalism",
        "weight": 0.20,
    },
}

CANDIDATE_STATUS = {
    "strongly_recommend": {"min": 4.0, "label": "Strongly Recommend", "color": "emerald"},
    "recommend": {"min": 3.0, "label": "Recommend", "color": "blue"},
    "consider": {"min": 2.0, "label": "Consider with Reservations", "color": "amber"},
    "reject": {"min": 0, "label": "Do Not Recommend", "color": "red"},
}


def get_candidate_status(score: float) -> dict:
    for key, cfg in CANDIDATE_STATUS.items():
        if score >= cfg["min"]:
            return {"status": key, **cfg}
    return {"status": "reject", **CANDIDATE_STATUS["reject"]}


def compute_weighted_score(dimension_scores: dict) -> float:
    """Compute weighted overall score from dimension scores."""
    total_weight = 0
    weighted_sum = 0
    for dim, cfg in SCORING_DIMENSIONS.items():
        if dim in dimension_scores:
            weighted_sum += dimension_scores[dim] * cfg["weight"]
            total_weight += cfg["weight"]
    if total_weight == 0:
        return 0
    return round(weighted_sum / total_weight, 2)


# ── Tools ──────────────────────────────────────────────────────

@function_tool()
async def start_new_interview(
    context: RunContext,
    candidate_name: str,
    position: str = "General",
    stage: str = "hr_screening",
):
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
        "questionSummaries": [],
        "dimensionScores": {},
        "status": "in_progress",
        "interviewRef": iv["ref"],
        "stage": stage,
        "scoringDimensions": SCORING_DIMENSIONS,
    }, "main_card")
    return f"Interview {iv['ref']} started! {stage.replace('_', ' ').title()} for {candidate_name} ({position}). Question 1: {q['question']}"


@function_tool()
async def score_current_answer(
    context: RunContext,
    score: int,
    feedback: str = "",
    communication_score: int = 3,
    technical_score: int = 3,
    soft_skills_score: int = 3,
    cultural_fit_score: int = 3,
    strengths: str = "",
    improvement_areas: str = "",
    supporting_quote: str = "",
):
    """Score the candidate's answer with multi-dimensional evaluation.
    Each dimension is 1-5: communication_score, technical_score, soft_skills_score, cultural_fit_score.
    Also provide: strengths (comma-separated), improvement_areas (comma-separated), supporting_quote (key quote from answer).
    The overall score (1-5) is still required as the primary rating."""
    emp_id = get_current_employee_id_from_context()
    iv = db.get_current_interview(emp_id)
    if not iv:
        return "No active interview. Start one first."

    current_q = iv["current_question"]
    result = db.score_answer(iv["id"], current_q, score, feedback)
    if "error" in result:
        return result["error"]

    # Build rich per-question analytics
    question_data = db.get_interview_question(iv["id"], current_q)
    question_analytics = {
        "question_index": current_q,
        "question": question_data["question"] if question_data else f"Q{current_q+1}",
        "overall_score": score,
        "dimensions": {
            "communication": communication_score,
            "technical": technical_score,
            "soft_skills": soft_skills_score,
            "cultural_fit": cultural_fit_score,
        },
        "strengths": [s.strip() for s in strengths.split(",") if s.strip()] if strengths else [],
        "improvement_areas": [a.strip() for a in improvement_areas.split(",") if a.strip()] if improvement_areas else [],
        "supporting_quote": supporting_quote,
        "feedback": feedback,
    }

    # Store analytics in interview record
    conn = db.get_db()
    c = conn.cursor()
    c.execute("SELECT notes FROM interviews WHERE id = %s", (iv["id"],))
    row = db._fetchone(c)
    existing_analytics = json.loads(row["notes"] or "[]") if row and row.get("notes") else []
    existing_analytics.append(question_analytics)
    c.execute("UPDATE interviews SET notes = %s WHERE id = %s", (json.dumps(existing_analytics), iv["id"]))
    conn.commit()
    conn.close()

    responses = db.get_interview_responses(iv["id"])
    all_scores = [r["score"] for r in responses]

    # Compute running dimension averages
    dim_totals = {"communication": [], "technical": [], "soft_skills": [], "cultural_fit": []}
    for qa in existing_analytics:
        for dim in dim_totals:
            if dim in qa.get("dimensions", {}):
                dim_totals[dim].append(qa["dimensions"][dim])
    dim_avgs = {dim: round(sum(vals) / len(vals), 1) if vals else 0 for dim, vals in dim_totals.items()}

    if current_q + 1 >= iv["total_questions"]:
        # Complete interview with rich analytics
        completed = db.complete_interview(iv["id"])
        weighted_overall = compute_weighted_score(dim_avgs)
        status = get_candidate_status(weighted_overall)

        # Collect all strengths and improvement areas
        all_strengths = []
        all_improvements = []
        all_quotes = []
        for qa in existing_analytics:
            all_strengths.extend(qa.get("strengths", []))
            all_improvements.extend(qa.get("improvement_areas", []))
            if qa.get("supporting_quote"):
                all_quotes.append({
                    "quote": qa["supporting_quote"],
                    "question": qa["question"],
                    "type": "strength" if qa["overall_score"] >= 4 else "improvement_area",
                })

        await _send_ui("InterviewResultsCard", {
            "candidateName": iv["candidate_name"],
            "position": iv["position"],
            "stage": iv["stage"],
            "interviewRef": iv["ref"],
            "overallScore": weighted_overall,
            "simpleAverage": completed["average_score"],
            "candidateStatus": status,
            "dimensionScores": dim_avgs,
            "scoringDimensions": SCORING_DIMENSIONS,
            "questionSummaries": existing_analytics,
            "strengths": list(set(all_strengths)),
            "improvementAreas": list(set(all_improvements)),
            "supportingQuotes": all_quotes,
            "totalQuestions": iv["total_questions"],
            "scores": all_scores,
            "status": "completed",
        }, "main_card")
        return f"Interview complete! Weighted score: {weighted_overall}/5. {status['label']}. Dimensions: Communication {dim_avgs['communication']}, Technical {dim_avgs['technical']}, Soft Skills {dim_avgs['soft_skills']}, Cultural Fit {dim_avgs['cultural_fit']}."

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
        "questionSummaries": existing_analytics,
        "dimensionScores": dim_avgs,
        "status": "in_progress",
        "interviewRef": iv["ref"],
        "stage": iv["stage"],
        "scoringDimensions": SCORING_DIMENSIONS,
    }, "main_card")
    return f"Scored {score}/5 (Comm:{communication_score} Tech:{technical_score} Soft:{soft_skills_score} Culture:{cultural_fit_score}). Next Q{current_q + 2}: {next_q['question']}"


@function_tool()
async def show_interview_results(context: RunContext):
    """Show detailed results of the last completed interview with multi-dimensional analysis."""
    emp_id = get_current_employee_id_from_context()
    conn = db.get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM interviews WHERE interviewer_id = %s ORDER BY completed_at DESC LIMIT 1", (emp_id,))
    iv = db._fetchone(c)
    conn.close()
    if not iv:
        return "No interviews found."

    responses = db.get_interview_responses(iv["id"])
    all_scores = [r["score"] for r in responses]
    analytics = json.loads(iv.get("notes") or "[]") if iv.get("notes") else []

    # Compute dimension averages from stored analytics
    dim_totals = {"communication": [], "technical": [], "soft_skills": [], "cultural_fit": []}
    all_strengths = []
    all_improvements = []
    all_quotes = []
    for qa in analytics:
        for dim in dim_totals:
            if dim in qa.get("dimensions", {}):
                dim_totals[dim].append(qa["dimensions"][dim])
        all_strengths.extend(qa.get("strengths", []))
        all_improvements.extend(qa.get("improvement_areas", []))
        if qa.get("supporting_quote"):
            all_quotes.append({
                "quote": qa["supporting_quote"],
                "question": qa.get("question", ""),
                "type": "strength" if qa.get("overall_score", 0) >= 4 else "improvement_area",
            })

    dim_avgs = {dim: round(sum(vals) / len(vals), 1) if vals else 0 for dim, vals in dim_totals.items()}
    weighted = compute_weighted_score(dim_avgs) if any(dim_avgs.values()) else iv.get("average_score", 0)
    status = get_candidate_status(weighted)

    await _send_ui("InterviewResultsCard", {
        "candidateName": iv["candidate_name"],
        "position": iv["position"],
        "stage": iv.get("stage", "hr_screening"),
        "interviewRef": iv["ref"],
        "overallScore": weighted,
        "simpleAverage": iv.get("average_score", 0),
        "candidateStatus": status,
        "dimensionScores": dim_avgs,
        "scoringDimensions": SCORING_DIMENSIONS,
        "questionSummaries": analytics,
        "strengths": list(set(all_strengths)),
        "improvementAreas": list(set(all_improvements)),
        "supportingQuotes": all_quotes,
        "totalQuestions": iv["total_questions"],
        "scores": all_scores,
        "status": iv["status"],
    }, "main_card")
    return f"Interview {iv['ref']}: {iv['candidate_name']} for {iv['position']}. Weighted: {weighted}/5. {status['label']}."
