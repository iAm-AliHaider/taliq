"""Interactive form tools — leave, document, loan, travel, profile edit."""

from livekit.agents import function_tool, RunContext
import database as db
from tools.core import get_current_employee_id_from_context, _send_ui


@function_tool()
async def show_leave_form(context: RunContext):
    """Show interactive leave application form with dropdowns, date pickers, and submit button. Call when user wants to APPLY for leave."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    bal = emp["leave_balance"]
    await _send_ui(
        "LeaveRequestForm",
        {
            "employeeName": emp["name"],
            "balance": bal.get("annual", 0),
            "status": "preview",
            "mode": "form",
        },
        "main_card",
    )
    return "Leave form shown. User can fill in type, dates, and reason, then submit."


@function_tool()
async def show_document_form(context: RunContext):
    """Show interactive document request form. Call when user wants to request a document."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    await _send_ui(
        "DocumentRequestForm",
        {
            "employeeName": emp["name"],
        },
        "main_card",
    )
    return "Document request form shown. User can select type and submit."


@function_tool()
async def show_loan_form(context: RunContext):
    """Show interactive loan application form with amount slider. Call when user wants to apply for a loan."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    elig = db.check_loan_eligibility(get_current_employee_id_from_context())
    await _send_ui(
        "LoanApplicationForm",
        {
            "employeeName": emp["name"],
            "eligible": elig.get("eligible", False),
            "maxAmount": elig.get("max_amount", 0),
            "currency": "SAR",
            "basicSalary": emp["salary"]["basic"],
        },
        "main_card",
    )
    if elig.get("eligible"):
        return f"Loan form shown. Max eligible: {elig['max_amount']:,} SAR."
    return "Not eligible for a loan at this time."


@function_tool()
async def show_travel_form(context: RunContext):
    """Show interactive travel request form with destination picker. Call when user wants to request travel."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    per_diem = db.get_per_diem(emp.get("grade", "34"))
    await _send_ui(
        "TravelRequestForm",
        {
            "employeeName": emp["name"],
            "grade": emp.get("grade", ""),
            "perDiemRates": {"international": per_diem, "local": int(per_diem * 0.67)},
            "currency": "SAR",
        },
        "main_card",
    )
    return "Travel form shown. User can pick destination, dates, and submit."


@function_tool()
async def show_profile_edit(context: RunContext):
    """Show profile with editable fields (phone, email, emergency contact, IBAN). Call when user wants to edit profile."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    mgr = db.get_employee(emp.get("manager_id", ""))
    await _send_ui(
        "ProfileEditCard",
        {
            "name": emp["name"],
            "nameAr": emp["name_ar"],
            "position": emp["position"],
            "department": emp["department"],
            "email": emp["email"],
            "phone": emp["phone"],
            "joinDate": emp["join_date"],
            "employeeId": emp["id"],
            "grade": f"Grade {emp['grade']} / Level {emp['level']}",
            "manager": mgr["name"] if mgr else "N/A",
            "nationality": emp.get("nationality", ""),
            "maritalStatus": emp.get("marital_status", ""),
            "emergencyContact": emp.get("emergency_contact", ""),
            "emergencyPhone": emp.get("emergency_phone", ""),
            "bankIban": emp.get("bank_iban", ""),
        },
        "main_card",
    )
    return "Profile shown with edit mode. User can update phone, email, emergency contact, and IBAN."
