"""GOSI & End of Service calculation tools."""

from livekit.agents import function_tool, RunContext
import database as db
from tools.core import get_current_employee_id_from_context, _send_ui


@function_tool
async def show_gosi_breakdown(ctx: RunContext) -> str:
    """Show GOSI social insurance breakdown with full Saudi compliance details."""
    emp_id = get_current_employee_id_from_context()
    gosi = db.calculate_gosi(emp_id)
    if not gosi:
        return "Employee not found."
    await _send_ui("GOSICard", {
        "name": gosi["name"],
        "employeeId": emp_id,
        "nationality": gosi["nationality"],
        "isSaudi": gosi["is_saudi"],
        "isGcc": gosi.get("is_gcc", False),
        "newSystem": gosi.get("new_system", False),
        "system": gosi.get("system", ""),
        "basicSalary": gosi["basic_salary"],
        "housingAllowance": gosi["housing_allowance"],
        "insurableSalary": gosi["insurable_salary"],
        "minInsurable": gosi.get("min_insurable", 1500),
        "maxInsurable": gosi.get("max_insurable", 45000),
        "employeeContribution": gosi["employee_contribution"],
        "employerContribution": gosi["employer_contribution"],
        "totalContribution": gosi["total_contribution"],
        "employeeRate": gosi["employee_rate"],
        "employerRate": gosi["employer_rate"],
        "totalRate": gosi.get("total_rate", 0),
        "breakdown": gosi["breakdown"],
        "annualEmployee": gosi["annual_employee"],
        "annualEmployer": gosi["annual_employer"],
        "annualTotal": gosi["annual_total"],
        "compliance": gosi.get("compliance", {}),
        "benefits": gosi.get("benefits", {}),
        "rateSchedule": gosi.get("rate_schedule", {}),
    }, "gosi_card")
    system = gosi.get("system", "")
    return f"GOSI ({system}): You pay {gosi['employee_contribution']:,.0f} SAR/month ({gosi['employee_rate']}%). Employer pays {gosi['employer_contribution']:,.0f} SAR/month. Total: {gosi['total_contribution']:,.0f} SAR."


@function_tool
async def show_end_of_service(ctx: RunContext, reason: str = "termination") -> str:
    """Calculate end of service gratuity. Reason: termination, resignation."""
    emp_id = get_current_employee_id_from_context()
    eos = db.calculate_end_of_service(emp_id, reason)
    if not eos:
        return "Employee not found."
    await _send_ui("EndOfServiceCard", {
        "name": eos["name"],
        "employeeId": emp_id,
        "position": eos["position"],
        "department": eos["department"],
        "joinDate": eos["join_date"],
        "yearsOfService": eos["years_of_service"],
        "monthsOfService": eos["months_of_service"],
        "baseWage": eos["base_wage"],
        "dailyWage": eos["daily_wage"],
        "reason": eos["reason"],
        "eligible": eos["eligible"],
        "gratuityAmount": eos["gratuity_amount"],
        "first5Years": eos["first_5_years"],
        "after5Years": eos["after_5_years"],
        "multiplier": eos["multiplier"],
        "note": eos["note"],
        "currency": eos["currency"],
    }, "eos_card")
    if eos["eligible"]:
        return f"End of service gratuity: {eos['gratuity_amount']:,.0f} SAR based on {eos['years_of_service']:.1f} years ({reason}). {eos['note']}"
    return eos["note"]
