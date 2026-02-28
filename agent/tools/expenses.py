"""Expense, claims, and payment tools."""

from livekit.agents import function_tool, RunContext
import database as db
from tools.core import get_current_employee_id_from_context, _send_ui


# ---- Expenses ----

@function_tool
async def submit_expense(ctx: RunContext, category: str, description: str, amount: float, expense_date: str) -> str:
    """Submit a new expense claim. Categories: travel, meals, office_supplies, training, communication, other."""
    emp_id = get_current_employee_id_from_context()
    result = db.create_expense(emp_id, category, description, amount, expense_date)
    await _send_ui("ExpenseListCard", {
        "expenses": db.get_employee_expenses(emp_id),
        "summary": db.get_expense_summary(emp_id),
    }, f"expenses_{emp_id}")
    return f"Expense {result['ref']} submitted for {amount} SAR. Category: {category}. Pending manager approval."


@function_tool
async def show_my_expenses(ctx: RunContext) -> str:
    """Show the employee's expense history and summary."""
    emp_id = get_current_employee_id_from_context()
    expenses = db.get_employee_expenses(emp_id)
    summary = db.get_expense_summary(emp_id)
    await _send_ui("ExpenseListCard", {
        "expenses": expenses,
        "summary": summary,
    }, f"expenses_{emp_id}")
    if not expenses:
        return "You have no expenses on record."
    return f"You have {len(expenses)} expenses. {summary.get('pending', 0)} pending, {summary.get('approved', 0)} approved."


@function_tool
async def show_expense_form(ctx: RunContext) -> str:
    """Show the interactive expense submission form."""
    await _send_ui("ExpenseForm", {
        "categories": ["travel", "meals", "office_supplies", "training", "communication", "other"],
    }, "expense_form")
    return "Here's the expense form. Fill in the details and submit."


@function_tool
async def approve_expense_request(ctx: RunContext, ref: str, decision: str) -> str:
    """Approve or reject an expense request. Decision: approved/rejected."""
    result = db.approve_expense(ref, decision)
    if not result:
        return f"Expense {ref} not found or already processed."
    return f"Expense {ref} has been {result['status']}."


@function_tool
async def show_pending_expenses(ctx: RunContext) -> str:
    """Show all pending expense requests for manager approval."""
    emp_id = get_current_employee_id_from_context()
    pending = db.get_pending_expenses(emp_id)
    if not pending:
        return "No pending expense requests."
    await _send_ui("ExpenseApprovalCard", {
        "expenses": pending,
    }, "pending_expenses")
    return f"You have {len(pending)} pending expense requests to review."


# ---- Claims ----

@function_tool
async def submit_claim(ctx: RunContext, claim_type: str, description: str, amount: float) -> str:
    """Submit an insurance/reimbursement claim. Types: medical, dental, vision, education, relocation, other."""
    emp_id = get_current_employee_id_from_context()
    result = db.submit_claim(emp_id, claim_type, description, amount)
    await _send_ui("ClaimListCard", {
        "claims": db.get_employee_claims(emp_id),
    }, f"claims_{emp_id}")
    return f"Claim {result['ref']} submitted for {amount} SAR. Type: {claim_type}. Pending review."


@function_tool
async def show_my_claims(ctx: RunContext) -> str:
    """Show the employee's claims history."""
    emp_id = get_current_employee_id_from_context()
    claims = db.get_employee_claims(emp_id)
    await _send_ui("ClaimListCard", {
        "claims": claims,
    }, f"claims_{emp_id}")
    if not claims:
        return "You have no claims on record."
    pending = len([c for c in claims if c.get("status") == "pending"])
    return f"You have {len(claims)} claims. {pending} pending."


@function_tool
async def show_claim_form(ctx: RunContext) -> str:
    """Show the interactive claim submission form."""
    await _send_ui("ClaimForm", {
        "types": ["medical", "dental", "vision", "education", "relocation", "other"],
    }, "claim_form")
    return "Here's the claim form. Fill in the details and submit."


@function_tool
async def approve_claim_request(ctx: RunContext, ref: str, decision: str) -> str:
    """Approve or reject a claim. Decision: approved/rejected."""
    result = db.approve_claim(ref, decision)
    if not result:
        return f"Claim {ref} not found or already processed."
    return f"Claim {ref} has been {result['status']}."


@function_tool
async def show_pending_claims(ctx: RunContext) -> str:
    """Show all pending claims for manager review."""
    emp_id = get_current_employee_id_from_context()
    pending = db.get_pending_claims(emp_id)
    if not pending:
        return "No pending claims."
    await _send_ui("ClaimApprovalCard", {
        "claims": pending,
    }, "pending_claims")
    return f"You have {len(pending)} pending claims to review."


# ---- Payments ----

@function_tool
async def show_my_payments(ctx: RunContext) -> str:
    """Show the employee's payment history (salary, reimbursements, bonuses)."""
    emp_id = get_current_employee_id_from_context()
    payments = db.get_employee_payments(emp_id)
    summary = db.get_payment_summary(emp_id)
    await _send_ui("PaymentListCard", {
        "payments": payments,
        "summary": summary,
    }, f"payments_{emp_id}")
    if not payments:
        return "No payment records found."
    return f"You have {len(payments)} payment records. Total received: {summary.get('total_received', 0)} SAR."


@function_tool
async def show_all_payments_admin(ctx: RunContext) -> str:
    """Show all payments across the organization (manager/admin only)."""
    payments = db.get_all_payments()
    await _send_ui("PaymentListCard", {
        "payments": payments,
        "isAdmin": True,
    }, "all_payments")
    return f"Showing {len(payments)} payment records across all employees."
