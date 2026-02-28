"""Attendance tools — clock in/out, attendance history, overtime requests."""

from livekit.agents import function_tool, RunContext
import database as db
from tools.core import get_current_employee_id_from_context, _send_ui


@function_tool()
async def clock_me_in(context: RunContext, location: str = "office"):
    """Clock in the employee for today. Call when user says 'clock me in' or 'I'm at work'."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Employee not found."
    result = db.clock_in(emp_id, location)
    if "error" in result:
        await _send_ui("StatusBanner", {"message": result["error"], "type": "warning"}, "main_card")
        return result["error"]
    status = "on time" if result["status"] == "present" else "late"
    await _send_ui("ClockInCard", {
        "employeeName": emp["name"],
        "date": result["date"],
        "clockIn": result["clock_in"],
        "status": result["status"],
        "location": location,
        "mode": "clocked_in",
    }, "main_card")
    return f"Clocked in at {result['clock_in']}, {status}. Location: {location}."


@function_tool()
async def clock_me_out(context: RunContext):
    """Clock out the employee for today. Call when user says 'clock me out' or 'I'm leaving'."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Employee not found."
    result = db.clock_out(emp_id)
    if "error" in result:
        await _send_ui("StatusBanner", {"message": result["error"], "type": "warning"}, "main_card")
        return result["error"]
    await _send_ui("ClockInCard", {
        "employeeName": emp["name"],
        "date": result["date"],
        "clockIn": result["clock_in"],
        "clockOut": result["clock_out"],
        "hoursWorked": result["hours_worked"],
        "overtimeHours": result["overtime_hours"],
        "status": result["status"],
        "mode": "clocked_out",
    }, "main_card")
    return f"Clocked out at {result['clock_out']}. Worked {result['hours_worked']} hours."


@function_tool()
async def show_my_attendance(context: RunContext, days: int = 7):
    """Show my attendance for the last N days. Call when user asks about attendance history."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Employee not found."
    records = db.get_my_attendance(emp_id, days)
    today = db.get_today_attendance(emp_id)
    await _send_ui("MyAttendanceCard", {
        "employeeName": emp["name"],
        "records": records,
        "today": today,
        "days": days,
    }, "main_card")
    present = sum(1 for r in records if r["status"] in ("present", "late", "remote"))
    return f"{present}/{len(records)} days present in last {days} days."


@function_tool()
async def request_overtime_approval(context: RunContext, hours: float, reason: str):
    """Request overtime approval. Call when user wants to log overtime hours."""
    emp_id = get_current_employee_id_from_context()
    result = db.request_overtime(emp_id, hours, reason)
    if "error" in result:
        return result["error"]
    await _send_ui("StatusBanner", {
        "message": f"Overtime request: {hours}h - {reason}. Sent to manager.",
        "type": "success",
    }, "main_card")
    return f"Overtime of {hours} hours requested. Pending manager approval."
