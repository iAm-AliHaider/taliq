"""Performance, goals, training, grievance, and notification tools."""

from livekit.agents import function_tool, RunContext
import database as db
from tools.core import get_current_employee_id_from_context, _send_ui


# ---- PERFORMANCE REVIEW ----

@function_tool()
async def show_my_performance(context: RunContext):
    """Show employee's latest performance review and rating."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp: return "Not found."
    reviews = db.get_employee_reviews(emp_id)
    goals = db.get_goals(emp_id)
    if not reviews:
        await _send_ui("StatusBanner", {"message": "No performance reviews yet.", "type": "info"}, "main_card")
        return "No reviews found."
    r = reviews[0]
    await _send_ui("PerformanceReviewCard", {
        "employeeName": emp["name"], "period": r["period"], "rating": r["rating"],
        "goalsMet": r["goals_met"], "totalGoals": r["total_goals"],
        "strengths": r["strengths"], "improvements": r["improvements"],
        "comments": r.get("comments", ""), "reviewerName": r.get("reviewer_name", ""),
        "status": r["status"], "goals": goals,
    }, "main_card")
    return f"Rating: {r['rating']}/5 for {r['period']}. {r['goals_met']}/{r['total_goals']} goals met."


@function_tool()
async def create_performance_review(context: RunContext, employee_id: str, rating: int, strengths: str, improvements: str, comments: str = ""):
    """Create a performance review for a team member. Manager only. Rating 1-5."""
    reviewer_id = get_current_employee_id_from_context()
    if not db.is_manager(reviewer_id):
        return "Only managers can create reviews."
    rv = db.create_review(reviewer_id, employee_id, "Q1 2026", rating, strengths, improvements, comments)
    emp = db.get_employee(employee_id)
    db.create_notification(employee_id, "review", "Performance Review", f"Your Q1 2026 review is ready. Rating: {rating}/5")
    await _send_ui("StatusBanner", {"message": f"Review created for {emp['name'] if emp else employee_id}: {rating}/5", "type": "success"}, "main_card")
    return f"Review created. {emp['name'] if emp else employee_id} rated {rating}/5."


@function_tool()
async def show_my_goals(context: RunContext):
    """Show employee's performance goals with progress."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp: return "Not found."
    goals = db.get_goals(emp_id)
    await _send_ui("GoalsCard", {
        "employeeName": emp["name"], "goals": goals,
    }, "main_card")
    active = sum(1 for g in goals if g["status"] == "active")
    completed = sum(1 for g in goals if g["status"] == "completed")
    return f"{len(goals)} goals: {active} active, {completed} completed."


@function_tool()
async def set_new_goal(context: RunContext, goal: str, target: str, due_date: str = "2026-06-30"):
    """Set a new performance goal."""
    emp_id = get_current_employee_id_from_context()
    g = db.set_goal(emp_id, goal, target, due_date)
    await _send_ui("StatusBanner", {"message": f"Goal set: {goal}. Due: {due_date}", "type": "success"}, "main_card")
    return f"Goal created: {goal}, target: {target}, due: {due_date}."


@function_tool()
async def update_goal(context: RunContext, goal_id: int, progress: int):
    """Update progress on a goal (0-100%)."""
    r = db.update_goal_progress(goal_id, progress)
    if "error" in r: return r["error"]
    status = "completed!" if r["status"] == "completed" else f"{progress}% done"
    await _send_ui("StatusBanner", {"message": f"Goal updated: {status}", "type": "success"}, "main_card")
    return f"Goal {goal_id} updated to {progress}%. {status}"


# ---- TRAINING ----

@function_tool()
async def show_available_trainings(context: RunContext):
    """Show available training courses to enroll in."""
    courses = db.get_available_courses()
    await _send_ui("TrainingCatalogCard", {"courses": courses}, "main_card")
    mandatory = sum(1 for c in courses if c["mandatory"])
    return f"{len(courses)} courses available ({mandatory} mandatory)."


@function_tool()
async def enroll_in_training(context: RunContext, course_id: int):
    """Enroll in a training course."""
    emp_id = get_current_employee_id_from_context()
    r = db.enroll_in_course(emp_id, course_id)
    if "error" in r:
        await _send_ui("StatusBanner", {"message": r["error"], "type": "warning"}, "main_card")
        return r["error"]
    await _send_ui("StatusBanner", {"message": f"Enrolled in {r.get('title', 'course')}!", "type": "success"}, "main_card")
    return f"Enrolled in course {r.get('title', course_id)}."


@function_tool()
async def show_my_trainings(context: RunContext):
    """Show my enrolled and completed training courses."""
    emp_id = get_current_employee_id_from_context()
    trainings = db.get_my_trainings(emp_id)
    stats = db.get_training_stats(emp_id)
    await _send_ui("MyTrainingsCard", {"trainings": trainings, "stats": stats}, "main_card")
    return f"{stats['completed']}/{stats['total_enrolled']} completed. Compliance: {stats['compliance']}%."




@function_tool()
async def show_training_calendar(context: RunContext):
    """Show training calendar with enrolled and upcoming courses."""
    emp_id = get_current_employee_id_from_context()
    trainings = db.get_my_trainings(emp_id)
    courses = db.get_available_courses()
    # Upcoming = courses with start_date in the future
    upcoming = [c for c in courses if c.get("start_date")]
    await _send_ui("TrainingCalendarCard", {"trainings": trainings, "upcoming": upcoming}, "main_card")
    return f"Training calendar showing {len(trainings)} enrollments and {len(upcoming)} upcoming courses."


@function_tool()
async def show_course_materials(context: RunContext, course_id: int):
    """Show materials, syllabus, and resources for a training course."""
    conn = db.get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM training_courses WHERE id = %s", (course_id,))
    course = db._fetchone(c)
    conn.close()
    if not course:
        return "Course not found."
    await _send_ui("CourseMaterialsCard", {
        "courseTitle": course.get("title", ""),
        "syllabus": course.get("syllabus", ""),
        "materialsUrl": course.get("materials_url", ""),
        "materials": [],
    }, "main_card")
    return f"Showing materials for {course.get('title', 'course')}."



# ---- EXAMS ----

@function_tool()
async def list_available_exams(context: RunContext):
    """List available exams for the employee (training exams they can take)."""
    emp_id = get_current_employee_id_from_context()
    exams = db.get_exams()
    active = [e for e in exams if e.get("is_active")]
    await _send_ui("StatusBanner", {"message": f"{len(active)} exams available", "type": "info", "items": [{"label": f"{e['title']} ({e.get('question_count',0)} questions, pass: {e['passing_score']}%)", "value": f"ID: {e['id']}"} for e in active[:10]]}, "main_card")
    return f"{len(active)} exams available. " + ", ".join(f"#{e['id']} {e['title']}" for e in active[:5])


@function_tool()
async def start_exam(context: RunContext, exam_id: int):
    """Start taking an exam. Shows questions one by one with timer."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    emp_name = emp.get("name", emp_id) if emp else emp_id
    attempt = db.start_exam_attempt(exam_id, emp_id, "employee", emp_name)
    if "error" in attempt:
        await _send_ui("StatusBanner", {"message": attempt["error"], "type": "warning"}, "main_card")
        return attempt["error"]
    exam = db.get_exam_with_questions(exam_id, include_answers=False)
    if not exam:
        return "Exam not found."
    await _send_ui("ExamCard", {
        "examId": exam_id,
        "examTitle": exam["title"],
        "description": exam.get("description", ""),
        "passingScore": exam["passing_score"],
        "timeLimitMinutes": exam["time_limit_minutes"],
        "questions": exam["questions"],
        "attemptId": attempt["attempt_id"],
    }, "main_card")
    return f"Exam started: {exam['title']}. {len(exam['questions'])} questions, {exam['time_limit_minutes']} minutes. Good luck!"


@function_tool()
async def submit_exam_answers(context: RunContext, attempt_id: int, answers: str):
    """Submit exam answers and get results. Answers format: JSON string mapping question_id to answer."""
    import json
    try:
        answers_dict = json.loads(answers) if isinstance(answers, str) else answers
    except:
        return "Invalid answers format. Please provide JSON mapping question IDs to answers."
    result = db.submit_exam(attempt_id, answers_dict)
    if "error" in result:
        return result["error"]
    await _send_ui("ExamResultsCard", {
        "score": result["score"],
        "passed": result["passed"],
        "passingScore": result["passing_score"],
        "earnedPoints": result["earned_points"],
        "totalPoints": result["total_points"],
        "results": result["results"],
    }, "main_card")
    status = "Passed" if result["passed"] else "Not passed"
    return f"Exam completed! Score: {result['score']}%. {status}. {result['earned_points']}/{result['total_points']} points."


@function_tool()
async def show_my_exam_history(context: RunContext):
    """Show employee exam attempt history and scores."""
    emp_id = get_current_employee_id_from_context()
    attempts = db.get_exam_attempts(participant_id=emp_id)
    if not attempts:
        return "No exam attempts found."
    summary = []
    for a in attempts[:10]:
        status = "Passed" if a.get("passed") else "Failed"
        summary.append(f"{a.get('exam_title','Exam')}: {a.get('score',0)}% ({status})")
    await _send_ui("StatusBanner", {"message": f"{len(attempts)} exam attempts", "type": "info", "items": [{"label": s, "value": ""} for s in summary]}, "main_card")
    return f"{len(attempts)} exam attempts. " + "; ".join(summary[:5])


@function_tool()
async def show_course_content(context: RunContext, course_id: int):
    """Show course materials, documents, and resources."""
    materials = db.get_course_materials(course_id)
    conn = db.get_db()
    c = conn.cursor()
    c.execute("SELECT title, syllabus, materials_url FROM training_courses WHERE id = %s", (course_id,))
    course = db._fetchone(c)
    conn.close()
    if not course:
        return "Course not found."
    await _send_ui("CourseMaterialsCard", {
        "courseTitle": course.get("title", ""),
        "syllabus": course.get("syllabus", ""),
        "materialsUrl": course.get("materials_url", ""),
        "materials": [{"title": m["title"], "type": m["type"], "url": m.get("url", "")} for m in materials],
    }, "main_card")
    return f"Showing {len(materials)} materials for {course.get('title', 'course')}."

# ---- GRIEVANCE ----

@function_tool()
async def file_grievance(context: RunContext, category: str, subject: str, description: str, severity: str = "medium"):
    """File a grievance or complaint. Categories: harassment, discrimination, safety, policy, compensation, other. Severity: low, medium, high, critical."""
    emp_id = get_current_employee_id_from_context()
    g = db.submit_grievance(emp_id, category, subject, description, severity)
    await _send_ui("GrievanceListCard", {
        "grievances": [g], "mode": "submitted",
    }, "main_card")
    return f"Grievance {g['ref']} filed. Category: {category}, severity: {severity}. HR will review."


@function_tool()
async def show_my_grievances(context: RunContext):
    """Show my filed grievances and their status."""
    emp_id = get_current_employee_id_from_context()
    grievances = db.get_my_grievances(emp_id)
    await _send_ui("GrievanceListCard", {"grievances": grievances}, "main_card")
    pending = sum(1 for g in grievances if g["status"] not in ("resolved", "closed"))
    return f"{len(grievances)} grievance(s), {pending} pending."


# ---- NOTIFICATIONS ----

@function_tool()
async def show_notifications(context: RunContext):
    """Show unread notifications."""
    emp_id = get_current_employee_id_from_context()
    notifs = db.get_unread_notifications(emp_id)
    all_notifs = db.get_all_notifications(emp_id)
    await _send_ui("NotificationCard", {"notifications": all_notifs, "unreadCount": len(notifs)}, "main_card")
    return f"{len(notifs)} unread notification(s)."


@function_tool
async def acknowledge_announcement(context: RunContext, announcement_id: int = 0):
    """Acknowledge a company announcement. Say 'I acknowledge' or 'acknowledged' to confirm you've read it."""
    emp_id = get_current_employee_id_from_context()
    if announcement_id > 0:
        db.acknowledge_announcement(announcement_id, emp_id)
        return f"Announcement #{announcement_id} acknowledged. Thank you."
    # If no ID, acknowledge all unread
    unread = db.get_unread_login_announcements(emp_id)
    if not unread:
        return "No pending announcements to acknowledge."
    for ann in unread:
        db.acknowledge_announcement(ann["id"], emp_id)
    return f"All {len(unread)} announcements acknowledged. Thank you."

