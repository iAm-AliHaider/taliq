"""Manager tools — approvals, team analytics, grievance management, administration."""

from datetime import date as dt
from livekit.agents import function_tool, RunContext
import database as db
from tools.core import get_current_employee_id_from_context, _send_ui


# ---- Dashboard & Overview ----

@function_tool()
async def show_pending_approvals(context: RunContext):
    """Show pending approvals for me as manager."""
    approvals = db.get_pending_approvals(get_current_employee_id_from_context())
    items = [
        {
            "id": a["ref"],
            "employeeName": a["employee_name"],
            "type": a["leave_type"],
            "startDate": a["start_date"],
            "endDate": a["end_date"],
            "days": a["days"],
            "reason": a["reason"] or "",
            "status": a["status"],
        }
        for a in approvals
    ]
    await _send_ui("ApprovalQueue", {"items": items}, "main_card")
    return f"{len(items)} pending."


@function_tool()
async def approve_leave(
    context: RunContext, request_ref: str, decision: str = "approved"
):
    """Approve or reject a leave request."""
    result = db.approve_leave_request(request_ref, decision)
    if not result:
        return f"Request {request_ref} not found."
    await _send_ui(
        "StatusBanner",
        {
            "message": f"{request_ref} for {result.get('employee_name', '?')}: {decision}",
            "type": "success" if decision == "approved" else "warning",
        },
        "main_card",
    )
    return f"Leave {request_ref} {decision}."


@function_tool()
async def show_team_overview(context: RunContext):
    """Show overview of all direct reports with their current status."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You are not a manager."
    emp = db.get_employee(emp_id)
    reports = db.get_direct_reports(emp_id)
    if not reports:
        return "You have no direct reports."
    att = db.get_team_attendance(emp_id)
    att_map = {a["name"].split()[0]: a["status"] for a in att}
    team = []
    for r in reports:
        first_name = r["name"].split()[0]
        status = att_map.get(first_name, "unknown")
        team.append({
            "id": r["id"],
            "name": r["name"],
            "position": r["position"],
            "department": r["department"],
            "status": status,
        })
    await _send_ui("TeamOverviewCard", {
        "managerName": emp["name"] if emp else "",
        "team": team,
    }, "main_card")
    return f"You have {len(team)} direct reports."


@function_tool()
async def show_department_stats(context: RunContext):
    """Show department statistics including headcount, leave, pending approvals, and attendance."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You are not a manager."
    emp = db.get_employee(emp_id)
    stats = db.get_department_stats(emp_id)
    await _send_ui("ManagerDashboard", {
        "activeTab": "overview",
        "managerName": emp["name"] if emp else "",
        "department": emp["department"] if emp else "",
        "stats": stats,
    }, "main_card")
    return f"Department: {stats['headcount']} employees, {stats['on_leave']} on leave, {stats['pending_approvals']} pending, {stats['avg_attendance']}% attendance."


@function_tool()
async def show_leave_calendar(context: RunContext):
    """Show visual team leave calendar."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You are not a manager."
    emp = db.get_employee(emp_id)
    reports = db.get_direct_reports(emp_id)
    if not reports:
        return "You have no direct reports."
    conn = db.get_db()
    rows = conn.execute(
        """SELECT lr.employee_id, e.name, lr.start_date, lr.end_date, lr.leave_type, lr.status
           FROM leave_requests lr JOIN employees e ON lr.employee_id = e.id
           WHERE e.manager_id = ? AND lr.status = 'approved'""",
        (emp_id,),
    ).fetchall()
    conn.close()
    leaves = [dict(r) for r in rows]
    await _send_ui("ManagerDashboard", {
        "activeTab": "calendar",
        "managerName": emp["name"] if emp else "",
        "leaves": leaves,
    }, "main_card")
    return f"Showing {len(leaves)} approved leaves."


@function_tool()
async def show_dashboard(context: RunContext):
    """Show the employee's personal dashboard with stats, quick actions, and overview."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Employee not found."
    is_mgr = db.is_manager(emp_id)
    loans = db.get_employee_loans(emp_id)
    docs = db.get_document_requests(emp_id)
    pending_docs = [d for d in docs if d["status"] in ("requested", "processing")]
    today_att = db.get_today_attendance(emp_id)
    anns = db.get_announcements(3)

    props = {
        "employeeName": emp["name"],
        "employeeId": emp["id"],
        "position": emp["position"],
        "department": emp["department"],
        "isManager": is_mgr,
        "leaveBalance": emp["leave_balance"],
        "activeLoans": len(loans),
        "pendingRequests": len(pending_docs),
        "announcements": len(anns),
        "todayAttendance": dict(today_att) if today_att else None,
    }

    if is_mgr:
        approvals = db.get_pending_approvals(emp_id)
        reports = db.get_direct_reports(emp_id)
        props["pendingApprovals"] = len(approvals)
        props["teamSize"] = len(reports)

    await _send_ui("QuickDashboard", props, "main_card")
    parts = [f"Dashboard for {emp['name']}."]
    if today_att and today_att.get("clock_in"):
        parts.append(f"Clocked in at {today_att['clock_in']}.")
    else:
        parts.append("Not clocked in yet.")
    parts.append(f"{emp['leave_balance']['annual']} annual leave days.")
    if is_mgr:
        parts.append(f"{props.get('pendingApprovals', 0)} pending approvals.")
    return " ".join(parts)


@function_tool()
async def show_leave_history(context: RunContext):
    """Show all leave requests with history."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Not found."
    reqs = db.get_leave_requests(emp_id)
    await _send_ui("LeaveHistoryCard", {
        "employeeName": emp["name"],
        "requests": reqs,
    }, "main_card")
    return f"{len(reqs)} leave request(s)."


# ---- Approvals ----

@function_tool
async def approve_loan_request(
    context: RunContext, employee_name: str = "", decision: str = "approved",
):
    """Approve or reject a pending loan. Say the employee name."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    pending = db.get_pending_loan_requests(emp_id)
    if not pending:
        return "No pending loan requests."
    if employee_name:
        name_lower = employee_name.lower()
        matched = [p for p in pending if name_lower in p["employee_name"].lower()]
        if len(matched) == 1:
            result = db.approve_loan(matched[0]["ref"], decision)
            if result:
                await _send_ui("StatusBanner", {
                    "message": f"Loan {decision}: {result['employee_name']} - {result['amount']:,.0f} SAR",
                    "type": "success" if decision == "approved" else "warning",
                }, f"loan_approval_{matched[0]['ref']}")
                return f"{result['employee_name']}'s loan has been {decision}."
        elif len(matched) > 1:
            return "Multiple matches. " + ", ".join(f"{p['employee_name']} ({p['loan_type']} {p['amount']:,.0f} SAR)" for p in matched)
    items = [f"- {p['employee_name']}: {p['loan_type']} {p['amount']:,.0f} SAR ({p['installments_left']} months)" for p in pending]
    return f"{len(pending)} pending loans:\n" + "\n".join(items)


@function_tool
async def approve_travel_request(
    context: RunContext, employee_name: str = "", decision: str = "approved",
):
    """Approve or reject a travel request. Say the employee name."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    pending = db.get_pending_travel_requests(emp_id)
    if not pending:
        return "No pending travel requests."
    if employee_name:
        name_lower = employee_name.lower()
        matched = [p for p in pending if name_lower in p["employee_name"].lower()]
        if len(matched) == 1:
            result = db.approve_travel(matched[0]["ref"], decision)
            if result:
                await _send_ui("StatusBanner", {
                    "message": f"Travel {decision}: {result['employee_name']} to {result['destination']}",
                    "type": "success" if decision == "approved" else "warning",
                }, f"travel_approval_{matched[0]['ref']}")
                return f"{result['employee_name']}'s travel request has been {decision}."
    items = [f"- {p['employee_name']} to {p['destination']} ({p['days']} days)" for p in pending]
    return f"{len(pending)} pending travel requests:\n" + "\n".join(items)


@function_tool
async def approve_overtime_request(
    context: RunContext, record_id: int = 0, decision: str = "approved",
):
    """Approve or reject an overtime request."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    if not record_id:
        pending = db.get_pending_overtime_requests(emp_id)
        if not pending:
            return "No pending overtime requests."
        items = []
        for p in pending:
            items.append(f"ID {p['id']}: {p['employee_name']} - {p['overtime_hours']}h on {p['date']} ({p.get('notes', 'No reason')})")
        return f"Pending overtime requests:\n" + "\n".join(items)
    result = db.approve_overtime(record_id, decision)
    if result:
        await _send_ui("StatusBanner", {
            "message": f"Overtime {decision}: {result['employee_name']} - {result['overtime_hours']}h on {result['date']}",
            "type": "success" if decision == "approved" else "warning",
        }, f"ot_approval_{record_id}")
        return f"Overtime request {decision}."
    return "Overtime request not found."


@function_tool
async def approve_document_request(
    context: RunContext, employee_name: str = "", decision: str = "ready",
):
    """Approve a document request. Decision: 'ready' or 'rejected'."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    pending = db.get_pending_document_requests(emp_id)
    if not pending:
        return "No pending document requests."
    if employee_name:
        name_lower = employee_name.lower()
        matched = [p for p in pending if name_lower in p["employee_name"].lower()]
        if len(matched) == 1:
            result = db.approve_document(matched[0]["ref"], decision)
            if result:
                await _send_ui("StatusBanner", {
                    "message": f"Document {decision}: {result['employee_name']} - {result['document_type']}",
                    "type": "success",
                }, f"doc_approval_{matched[0]['ref']}")
                return f"{result['employee_name']}'s document request marked as {decision}."
    items = [f"- {p['employee_name']}: {p['document_type']} ({p['status']})" for p in pending]
    return f"{len(pending)} pending documents:\n" + "\n".join(items)


# ---- Grievance Management ----

@function_tool
async def show_team_grievances(context: RunContext):
    """Show all grievances from team members. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    grievances = db.get_department_grievances(emp_id)
    if not grievances:
        return "No grievances from your team."
    await _send_ui("GrievanceListCard", {
        "grievances": [{
            "ref": g["ref"], "category": g["category"], "subject": g["subject"],
            "severity": g["severity"], "status": g["status"],
            "employeeName": g.get("employee_name", "Unknown"), "submittedAt": g["submitted_at"],
        } for g in grievances],
        "isManager": True,
    }, "team_grievances")
    return f"Found {len(grievances)} grievances from your team."


@function_tool
async def resolve_team_grievance(
    context: RunContext, reference: str = "", resolution: str = "",
):
    """Resolve a grievance with a resolution note. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    if not reference or not resolution:
        return "Please provide the grievance reference and resolution."
    result = db.resolve_grievance(reference, resolution)
    if result and "error" not in result:
        await _send_ui("StatusBanner", {
            "message": f"Grievance {reference} resolved",
            "type": "success",
        }, f"grievance_resolved_{reference}")
        return f"Grievance {reference} has been resolved."
    return f"Could not resolve grievance {reference}."


# ---- Team Analytics ----

@function_tool
async def show_team_performance(context: RunContext):
    """Show performance summary for all direct reports. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    summary = db.get_team_performance_summary(emp_id)
    if not summary:
        return "No direct reports found."
    await _send_ui("TeamPerformanceCard", {
        "employees": [{
            "employeeId": s["employee_id"], "name": s["name"], "position": s["position"],
            "rating": s["latest_rating"], "reviewPeriod": s["review_period"],
            "goalsTotal": s["goals_total"], "goalsCompleted": s["goals_completed"],
            "trainingsEnrolled": s["trainings_enrolled"], "trainingsCompleted": s["trainings_completed"],
            "attendanceDays": s["attendance_days"], "attendancePresent": s["attendance_present"],
        } for s in summary],
    }, "team_performance")
    return f"Performance summary for {len(summary)} team members."


@function_tool
async def show_team_training_compliance(context: RunContext):
    """Show training compliance for all direct reports. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    compliance = db.get_team_training_compliance(emp_id)
    if not compliance:
        return "No direct reports found."
    await _send_ui("TeamTrainingCard", {
        "employees": [{
            "employeeId": c["employee_id"], "name": c["name"], "position": c["position"],
            "totalEnrolled": c["total_enrolled"], "completed": c["completed"],
            "mandatoryTotal": c["mandatory_total"], "mandatoryCompleted": c["mandatory_completed"],
            "compliance": c["compliance"],
        } for c in compliance],
    }, "team_training")
    return f"Training compliance for {len(compliance)} team members."


@function_tool
async def show_all_pending_approvals(context: RunContext):
    """Show ALL pending items across all categories. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    all_pending = db.get_all_pending_for_manager(emp_id)
    counts = {k: len(v) for k, v in all_pending.items()}
    total = sum(counts.values())
    await _send_ui("ManagerPendingCard", {
        "leaveRequests": [{"ref": r["ref"], "employeeName": r["employee_name"],
            "leaveType": r["leave_type"], "days": r["days"],
            "startDate": r["start_date"], "reason": r.get("reason", ""),
        } for r in all_pending["leave_requests"]],
        "loanRequests": [{"ref": r["ref"], "employeeName": r["employee_name"],
            "loanType": r["loan_type"], "amount": r["amount"],
            "installments": r["installments_left"],
        } for r in all_pending["loan_requests"]],
        "travelRequests": [{"ref": r["ref"], "employeeName": r["employee_name"],
            "destination": r["destination"], "days": r["days"],
            "allowance": r["total_allowance"],
        } for r in all_pending["travel_requests"]],
        "overtimeRequests": [{"id": r["id"], "employeeName": r["employee_name"],
            "hours": r["overtime_hours"], "date": r["date"],
            "reason": r.get("notes", ""),
        } for r in all_pending["overtime_requests"]],
        "documentRequests": [{"ref": r["ref"], "employeeName": r["employee_name"],
            "documentType": r["document_type"], "status": r["status"],
        } for r in all_pending["document_requests"]],
        "grievances": [{"ref": r["ref"], "employeeName": r.get("employee_name", ""),
            "category": r["category"], "severity": r["severity"],
            "subject": r["subject"],
        } for r in all_pending["grievances"]],
        "pendingReviews": [{"employeeId": r["id"], "name": r["name"],
            "position": r["position"],
        } for r in all_pending["pending_reviews"]],
        "counts": counts,
        "total": total,
    }, "all_pending")
    summary_parts = []
    if counts["leave_requests"]: summary_parts.append(f"{counts['leave_requests']} leave")
    if counts["loan_requests"]: summary_parts.append(f"{counts['loan_requests']} loan")
    if counts["travel_requests"]: summary_parts.append(f"{counts['travel_requests']} travel")
    if counts["overtime_requests"]: summary_parts.append(f"{counts['overtime_requests']} overtime")
    if counts["document_requests"]: summary_parts.append(f"{counts['document_requests']} document")
    if counts["grievances"]: summary_parts.append(f"{counts['grievances']} grievance")
    if counts["pending_reviews"]: summary_parts.append(f"{counts['pending_reviews']} review")
    if total == 0:
        return "All clear! No pending items."
    return f"You have {total} pending items: {', '.join(summary_parts)}."


@function_tool
async def show_leave_analytics(context: RunContext):
    """Show leave analytics for your team. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    analytics = db.get_leave_analytics(emp_id)
    await _send_ui("LeaveAnalyticsCard", {
        "totalRequests": analytics["total_requests"],
        "byType": analytics["by_type"],
        "byStatus": analytics["by_status"],
    }, "leave_analytics")
    return f"Leave analytics: {analytics['total_requests']} total requests."


@function_tool
async def show_headcount_report(context: RunContext):
    """Show headcount breakdown by department. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    breakdown = db.get_headcount_by_department()
    total = sum(d["count"] for d in breakdown)
    await _send_ui("HeadcountCard", {
        "departments": [{"department": d["department"], "count": d["count"],
            "percentage": round(d["count"] / total * 100) if total > 0 else 0,
        } for d in breakdown],
        "total": total,
    }, "headcount")
    return f"Total headcount: {total} across {len(breakdown)} departments."


@function_tool
async def reassign_team_member(
    context: RunContext, employee_id: str = "", new_manager_id: str = "",
):
    """Reassign an employee to a different manager. Manager only."""
    emp_id = get_current_employee_id_from_context()
    if not db.is_manager(emp_id):
        return "You don't have manager access."
    if not employee_id or not new_manager_id:
        reports = db.get_direct_reports(emp_id)
        all_mgrs = [e for e in db.get_all_employees_summary() if db.is_manager(e["id"])]
        report_list = ", ".join(f"{r['id']} ({r['name']})" for r in reports)
        mgr_list = ", ".join(f"{m['id']} ({m['name']})" for m in all_mgrs)
        return f"Your reports: {report_list}. Available managers: {mgr_list}. Specify employee_id and new_manager_id."
    result = db.reassign_employee(employee_id, new_manager_id)
    if "error" not in result:
        new_mgr = db.get_employee(new_manager_id)
        await _send_ui("StatusBanner", {
            "message": f"{result['name']} reassigned to {new_mgr['name'] if new_mgr else new_manager_id}",
            "type": "success",
        }, "reassignment")
        return f"{result['name']} has been reassigned to {new_mgr['name'] if new_mgr else new_manager_id}."
    return result.get("error", "Failed to reassign.")


@function_tool
async def show_employee_details(
    context: RunContext, employee_id: str = "",
):
    """View full details of a team member. Manager only."""
    mgr_id = get_current_employee_id_from_context()
    if not db.is_manager(mgr_id):
        return "You don't have manager access."
    if not employee_id:
        reports = db.get_direct_reports(mgr_id)
        return "Your team: " + ", ".join(f"{r['id']} ({r['name']})" for r in reports) + ". Which employee?"
    emp = db.get_employee(employee_id)
    if not emp:
        return f"Employee {employee_id} not found."
    leaves = db.get_leave_requests(employee_id)
    loans = db.get_employee_loans(employee_id)
    reviews = db.get_employee_reviews(employee_id)
    goals = db.get_goals(employee_id)
    trainings = db.get_my_trainings(employee_id)
    grievances = db.get_my_grievances(employee_id)
    training_stats = db.get_training_stats(employee_id)
    await _send_ui("EmployeeDetailCard", {
        "employee": {
            "id": emp["id"], "name": emp["name"], "nameAr": emp.get("name_ar"),
            "position": emp["position"], "department": emp["department"],
            "email": emp.get("email"), "phone": emp.get("phone"),
            "joinDate": emp["join_date"], "grade": emp.get("grade"),
            "nationality": emp.get("nationality"),
            "salary": emp["salary"], "leaveBalance": emp["leave_balance"],
        },
        "leaveRequests": len(leaves),
        "pendingLeaves": len([l for l in leaves if l["status"] == "pending"]),
        "activeLoans": len(loans),
        "loanBalance": sum(l.get("remaining", 0) for l in loans),
        "reviews": [{"period": r["period"], "rating": r["rating"]} for r in reviews[:3]],
        "goalsTotal": len(goals),
        "goalsCompleted": len([g for g in goals if g["status"] == "completed"]),
        "trainingCompliance": training_stats["compliance"],
        "trainingsCompleted": training_stats["completed"],
        "grievanceCount": len(grievances),
        "openGrievances": len([g for g in grievances if g["status"] not in ("resolved", "closed")]),
    }, f"employee_detail_{employee_id}")
    return f"Showing full details for {emp['name']}."
