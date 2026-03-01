"""Recruitment pipeline voice tools — job postings, applications, candidate management."""

from livekit.agents import function_tool
from .core import _send_ui, get_current_employee_id_from_context
import database as db


@function_tool
async def list_job_postings(status: str = "") -> str:
    """List open job postings. Optional status filter: open, closed, on_hold.
    Call when someone asks about open positions, vacancies, or hiring."""
    jobs = db.get_job_postings(status or None)
    if not jobs:
        return "No job postings found."
    await _send_ui("JobListCard", {
        "jobs": [{
            "ref": j["ref"], "title": j["title"], "department": j["department"],
            "location": j.get("location", ""), "type": j.get("employment_type", ""),
            "salaryRange": j.get("salary_range", ""), "status": j["status"],
            "deadline": str(j.get("deadline", "") or ""),
            "applicants": len(db.get_applications(job_id=j["id"]))
        } for j in jobs]
    }, "recruitment")
    open_count = sum(1 for j in jobs if j["status"] == "open")
    return f"Found {len(jobs)} job postings ({open_count} open)."


@function_tool
async def view_job_details(job_ref: str) -> str:
    """View details of a specific job posting by reference (e.g. JOB-2026-001).
    Call when someone asks about a specific position or vacancy."""
    job = db.get_job_posting_by_ref(job_ref.upper())
    if not job:
        return f"Job posting {job_ref} not found."
    apps = db.get_applications(job_id=job["id"])
    await _send_ui("JobDetailCard", {
        "ref": job["ref"], "title": job["title"], "department": job["department"],
        "description": job.get("description", ""), "requirements": job.get("requirements", ""),
        "salaryRange": job.get("salary_range", ""), "location": job.get("location", ""),
        "type": job.get("employment_type", ""), "status": job["status"],
        "deadline": str(job.get("deadline", "") or ""),
        "postedBy": job.get("posted_by", ""),
        "created": str(job.get("created_at", ""))[:10],
        "applicants": len(apps),
        "stages": {
            "screening": sum(1 for a in apps if a["stage"] == "screening"),
            "interview": sum(1 for a in apps if a["stage"] == "interview"),
            "offer": sum(1 for a in apps if a["stage"] == "offer"),
            "hired": sum(1 for a in apps if a["stage"] == "hired"),
            "rejected": sum(1 for a in apps if a["stage"] == "rejected"),
        }
    }, "recruitment")
    return f"{job['title']} — {job['department']}. {len(apps)} applicants."


@function_tool
async def create_job_posting(title: str, department: str, description: str = "", requirements: str = "", salary_range: str = "", location: str = "Riyadh", employment_type: str = "full_time") -> str:
    """Create a new job posting. Call when a manager wants to open a new position.
    employment_type: full_time, part_time, contract, internship."""
    emp_id = get_current_employee_id_from_context()
    result = db.create_job_posting(title, department, description, requirements, salary_range, location, employment_type, posted_by=emp_id)
    await _send_ui("StatusBanner", {"status": "success", "message": f"Job posted: {result['ref']} — {title}"}, "recruitment")
    return f"Job posting created: {result['ref']}. {title} in {department}."


@function_tool
async def list_applications(job_ref: str = "", stage: str = "") -> str:
    """List job applications. Optional filters: job_ref (e.g. JOB-2026-001), stage (screening, interview, offer, hired, rejected).
    Call when someone asks to review candidates or applications."""
    job_id = None
    if job_ref:
        job = db.get_job_posting_by_ref(job_ref.upper())
        if job:
            job_id = job["id"]
    apps = db.get_applications(job_id=job_id, stage=stage or None)
    if not apps:
        return "No applications found."
    await _send_ui("ApplicationListCard", {
        "applications": [{
            "ref": a["ref"], "candidateName": a["candidate_name"],
            "email": a.get("candidate_email", ""), "phone": a.get("candidate_phone", ""),
            "jobTitle": a.get("job_title", ""), "department": a.get("job_department", ""),
            "stage": a["stage"], "status": a["status"], "score": a.get("score", 0),
            "applied": str(a.get("created_at", ""))[:10]
        } for a in apps]
    }, "recruitment")
    return f"Found {len(apps)} applications."


@function_tool
async def advance_candidate(application_ref: str, new_stage: str, score: int = 0, notes: str = "") -> str:
    """Move a candidate to the next stage. Stages: screening → interview → offer → hired (or rejected at any point).
    Call when a manager wants to shortlist, schedule interview, make offer, hire, or reject a candidate."""
    emp_id = get_current_employee_id_from_context()
    apps = db.get_applications()
    app = next((a for a in apps if a["ref"] == application_ref.upper()), None)
    if not app:
        return f"Application {application_ref} not found."
    
    valid_stages = ["screening", "interview", "offer", "hired", "rejected"]
    stage = new_stage.lower()
    if stage not in valid_stages:
        return f"Invalid stage. Use: {', '.join(valid_stages)}"
    
    status_map = {"screening": "applied", "interview": "shortlisted", "offer": "offered", "hired": "hired", "rejected": "rejected"}
    updates = {"stage": stage, "status": status_map.get(stage, stage), "reviewed_by": emp_id}
    if score > 0:
        updates["score"] = score
    if notes:
        updates["notes"] = {"reviewer_notes": notes, "reviewed_by": emp_id}
    
    db.update_application(app["id"], updates)
    await _send_ui("StatusBanner", {
        "status": "success" if stage != "rejected" else "warning",
        "message": f"{app['candidate_name']} moved to {stage} stage"
    }, "recruitment")
    return f"Candidate {app['candidate_name']} advanced to {stage}."


@function_tool
async def show_recruitment_stats() -> str:
    """Show recruitment pipeline statistics. Call when someone asks about hiring progress or recruitment numbers."""
    stats = db.get_recruitment_stats()
    await _send_ui("RecruitmentDashboardCard", {
        "jobs": stats["jobs"],
        "applications": stats["applications"]
    }, "recruitment")
    return f"Recruitment overview: {stats['jobs']['open_jobs']} open positions, {stats['applications']['total_apps']} total applications."


@function_tool
async def close_job_posting(job_ref: str, reason: str = "filled") -> str:
    """Close a job posting. Reasons: filled, cancelled, on_hold.
    Call when a position has been filled or needs to be closed."""
    job = db.get_job_posting_by_ref(job_ref.upper())
    if not job:
        return f"Job {job_ref} not found."
    status = "on_hold" if reason == "on_hold" else "closed"
    db.update_job_posting(job["id"], {"status": status})
    await _send_ui("StatusBanner", {"status": "info", "message": f"Job {job_ref} — {job['title']} is now {status}"}, "recruitment")
    return f"Job posting {job_ref} closed ({reason})."
