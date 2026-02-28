"""Admin operations: audit log, bulk actions, notification delivery."""
from livekit.agents import function_tool
from tools.core import _send_ui, get_current_employee_id_from_context
import database as db


@function_tool()
async def view_audit_log(
    limit: int = 20,
    entity_type: str = "",
    actor_id: str = "",
):
    """View the audit trail. Optionally filter by entity type (leave, expense, policy, employee, exit) or actor ID."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp or emp.get("position", "").lower() not in ("chro", "hr manager", "admin"):
        return "Only HR admins can view the audit log."

    entries = db.get_audit_log(
        limit=limit,
        entity_type=entity_type or None,
        actor_id=actor_id or None,
    )
    if not entries:
        return "No audit entries found."

    await _send_ui("AuditLogCard", {
        "entries": [
            {
                "id": e["id"],
                "timestamp": str(e["timestamp"]),
                "actor": e["actor_id"],
                "action": e["action"],
                "entityType": e.get("entity_type", ""),
                "entityId": e.get("entity_id", ""),
                "details": e.get("details", {}),
            }
            for e in entries
        ],
        "total": len(entries),
    }, "admin")
    return f"Showing {len(entries)} audit log entries."


@function_tool()
async def bulk_approve_pending_leaves():
    """Approve ALL pending leave requests at once. Manager/HR only."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Employee not found."

    # Get all pending leaves for this manager's team
    conn = db.get_db()
    c = conn.cursor()
    c.execute("""SELECT id, ref FROM leave_requests WHERE status = 'pending'
        AND employee_id IN (SELECT id FROM employees WHERE manager_id = %s)""", (emp_id,))
    pending = db._fetchall(c)
    conn.close()

    if not pending:
        return "No pending leave requests to approve."

    ids = [p["id"] for p in pending]
    result = db.bulk_approve_leaves(emp_id, ids)

    await _send_ui("StatusBanner", {
        "message": f"Bulk approved {result['approved']} leave requests. {result['failed']} failed.",
        "type": "success" if result["failed"] == 0 else "warning",
    }, "admin")
    return f"Bulk approved {result['approved']} leaves. {result['failed']} failed."


@function_tool()
async def bulk_approve_pending_expenses():
    """Approve ALL pending expense claims at once. Manager/HR only."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Employee not found."

    conn = db.get_db()
    c = conn.cursor()
    c.execute("""SELECT id, ref FROM expenses WHERE status = 'pending'
        AND employee_id IN (SELECT id FROM employees WHERE manager_id = %s)""", (emp_id,))
    pending = db._fetchall(c)
    conn.close()

    if not pending:
        return "No pending expenses to approve."

    ids = [p["id"] for p in pending]
    result = db.bulk_approve_expenses(emp_id, ids)

    total_amount = sum(d["amount"] for d in result["details"]["approved"])
    await _send_ui("StatusBanner", {
        "message": f"Bulk approved {result['approved']} expenses totaling {total_amount:,.0f} SAR.",
        "type": "success",
    }, "admin")
    return f"Bulk approved {result['approved']} expenses ({total_amount:,.0f} SAR)."


@function_tool()
async def send_pending_notifications():
    """Check and list pending unread notifications that need delivery."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp or emp.get("position", "").lower() not in ("chro", "hr manager", "admin"):
        return "Only HR admins can manage notifications."

    pending = db.get_pending_notifications(limit=20)
    if not pending:
        return "No pending notifications to deliver."

    notif_list = []
    for n in pending:
        notif_list.append({
            "id": n["id"],
            "employee": n.get("employee_name", n["employee_id"]),
            "phone": n.get("phone", ""),
            "type": n.get("type", ""),
            "title": n.get("title", ""),
            "message": n.get("message", ""),
            "createdAt": str(n.get("created_at", "")),
        })

    await _send_ui("NotificationQueueCard", {
        "notifications": notif_list,
        "total": len(notif_list),
    }, "admin")
    return f"Found {len(notif_list)} pending notifications awaiting delivery."
