"""Multi-level approval workflow voice tools."""

from livekit.agents import function_tool
from .core import _send_ui, get_current_employee_id_from_context
import database as db


@function_tool
async def view_pending_approvals() -> str:
    """Show all approval requests pending your action.
    Call when a manager asks 'what needs my approval?' or 'show pending approvals'."""
    emp_id = get_current_employee_id_from_context()
    pending = db.get_pending_approvals(emp_id)
    if not pending:
        return "No pending approvals require your action."
    
    items = []
    for req in pending:
        steps = req.get("workflow_steps", [])
        if isinstance(steps, str):
            import json
            steps = json.loads(steps)
        current = req.get("current_step", 0)
        current_label = steps[current]["label"] if current < len(steps) else "Unknown"
        items.append({
            "ref": req["ref"],
            "entityType": req["entity_type"],
            "entityRef": req.get("entity_ref", ""),
            "requesterId": req.get("requester_id", ""),
            "currentStep": current + 1,
            "totalSteps": len(steps),
            "currentLabel": current_label,
            "workflowName": req.get("workflow_name", ""),
            "created": str(req.get("created_at", ""))[:10]
        })
    
    await _send_ui("PendingApprovalsCard", {"approvals": items}, "approvals")
    return f"You have {len(pending)} pending approvals."


@function_tool
async def approve_request(approval_ref: str, comment: str = "") -> str:
    """Approve a pending request in the approval chain.
    Call when manager says 'approve APR-2026-001' or 'approve this request'."""
    emp_id = get_current_employee_id_from_context()
    result = db.approve_step(approval_ref.upper(), emp_id, action="approve", comment=comment)
    
    if "error" in result:
        await _send_ui("StatusBanner", {"status": "error", "message": result["error"]}, "approvals")
        return result["error"]
    
    chain = db.get_approval_chain(approval_ref.upper())
    if chain:
        await _send_ui("ApprovalChainCard", {
            "ref": chain["ref"],
            "entityType": chain["entity_type"],
            "entityRef": chain.get("entity_ref", ""),
            "overallStatus": chain["overall_status"],
            "chain": chain["chain"]
        }, "approvals")
    
    return result["message"]


@function_tool
async def reject_request(approval_ref: str, reason: str = "") -> str:
    """Reject a pending request. This stops the entire approval chain.
    Call when manager says 'reject APR-2026-001' or 'deny this request'."""
    emp_id = get_current_employee_id_from_context()
    result = db.approve_step(approval_ref.upper(), emp_id, action="reject", comment=reason)
    
    if "error" in result:
        await _send_ui("StatusBanner", {"status": "error", "message": result["error"]}, "approvals")
        return result["error"]
    
    await _send_ui("StatusBanner", {"status": "warning", "message": result["message"]}, "approvals")
    return result["message"]


@function_tool
async def view_approval_chain(approval_ref: str) -> str:
    """View the full approval chain for a request — who approved, who's next.
    Call when someone asks about the status of an approval or 'where is my request'."""
    chain = db.get_approval_chain(approval_ref.upper())
    if not chain:
        return f"Approval request {approval_ref} not found."
    
    await _send_ui("ApprovalChainCard", {
        "ref": chain["ref"],
        "entityType": chain["entity_type"],
        "entityRef": chain.get("entity_ref", ""),
        "overallStatus": chain["overall_status"],
        "requesterId": chain.get("requester_id", ""),
        "chain": chain["chain"]
    }, "approvals")
    
    step_summary = []
    for s in chain["chain"]:
        icon = "✓" if s["status"] == "approve" else "⏳" if s["status"] == "awaiting" else "○" if s["status"] == "upcoming" else "✗"
        step_summary.append(f"{icon} {s['label']}")
    
    return f"Approval chain for {approval_ref}: {' → '.join(step_summary)}. Overall: {chain['overall_status']}."


@function_tool
async def show_approval_workflows() -> str:
    """Show all configured approval workflows and their steps.
    Call when someone asks about approval processes or 'how does approval work'."""
    workflows = db.get_approval_workflows()
    if not workflows:
        return "No approval workflows configured."
    
    import json
    items = []
    for w in workflows:
        steps = w.get("steps", [])
        if isinstance(steps, str):
            steps = json.loads(steps)
        items.append({
            "name": w["name"],
            "entityType": w["entity_type"],
            "description": w.get("description", ""),
            "steps": [{
                "step": s.get("step", i+1),
                "role": s["role"],
                "label": s["label"],
                "action": s.get("action", "approve"),
                "condition": s.get("condition", "")
            } for i, s in enumerate(steps)]
        })
    
    await _send_ui("WorkflowListCard", {"workflows": items}, "approvals")
    return f"{len(workflows)} approval workflows configured: {', '.join(w['name'] for w in workflows)}."
