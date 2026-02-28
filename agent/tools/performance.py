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
