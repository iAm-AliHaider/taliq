"""New HR modules — letters, contracts, assets, shifts, reports, directory, iqama, exit."""

import json as _json
from livekit.agents import function_tool, RunContext
import database as db
from tools.core import get_current_employee_id_from_context, _send_ui


# ============================================================
# LETTER GENERATION
# ============================================================

@function_tool
async def generate_letter(letter_type: str, purpose: str = "", addressed_to: str = "") -> str:
    """Generate an HR letter. Types: employment_certificate, salary_certificate, experience_letter, noc_letter, promotion_letter, bank_letter.
    Call when employee asks for any official letter, certificate, or NOC."""
    emp_id = get_current_employee_id_from_context()
    valid_types = ["employment_certificate", "salary_certificate", "experience_letter", "noc_letter", "promotion_letter", "bank_letter"]
    lt = letter_type.lower().replace(" ", "_")
    if lt not in valid_types:
        lt = "employment_certificate"
    result = db.generate_letter(emp_id, lt, purpose or None, addressed_to or None)
    if not result:
        return "Could not generate letter. Please try again."
    await _send_ui("LetterCard", {
        "ref": result["ref"],
        "letterType": lt,
        "employeeName": result["employee_name"],
        "employeeId": emp_id,
        "position": result["position"],
        "department": result["department"],
        "joinDate": result["join_date"],
        "nationality": result.get("nationality", ""),
        "totalSalary": result["total_salary"],
        "basicSalary": result["basic_salary"],
        "housingAllowance": result["housing_allowance"],
        "transportAllowance": result["transport_allowance"],
        "grade": result.get("grade", ""),
        "letterDate": result["letter_date"],
        "purpose": result.get("purpose", ""),
        "addressedTo": result.get("addressed_to", "To Whom It May Concern"),
    }, "letter")
    return f"Generated {lt.replace('_', ' ').title()} - Ref: {result['ref']}. The letter is ready for download."


@function_tool
async def show_my_letters() -> str:
    """Show all letters generated for the current employee."""
    emp_id = get_current_employee_id_from_context()
    letters = db.get_employee_letters(emp_id)
    if not letters:
        return "No letters found. You can request employment certificates, salary certificates, experience letters, or NOC letters."
    await _send_ui("LetterListCard", {
        "letters": [{"ref": l["ref"], "type": l["letter_type"], "purpose": l.get("purpose", ""),
                      "addressedTo": l.get("addressed_to", ""), "status": l["status"],
                      "date": str(l.get("created_at", ""))} for l in letters]
    }, "letter")
    return f"You have {len(letters)} letter(s) on file."


# ============================================================
# CONTRACT MANAGEMENT
# ============================================================

@function_tool
async def show_my_contract() -> str:
    """Show the employee's current contract details including type, dates, probation, and salary."""
    emp_id = get_current_employee_id_from_context()
    contract = db.get_employee_contract(emp_id)
    emp = db.get_employee(emp_id) or {}
    if not contract:
        return "No active contract found."
    await _send_ui("ContractCard", {
        "employeeName": emp.get("name", ""),
        "employeeId": emp_id,
        "contractType": contract.get("contract_type", "unlimited"),
        "startDate": contract.get("start_date", ""),
        "endDate": contract.get("end_date"),
        "probationEnd": contract.get("probation_end"),
        "renewalDate": contract.get("renewal_date"),
        "salary": contract.get("salary", 0),
        "status": contract.get("status", "active"),
    }, "contract")
    ctype = contract.get("contract_type", "unlimited").title()
    return f"Your contract: {ctype}, started {contract.get('start_date', 'N/A')}. " + (f"Ends {contract['end_date']}." if contract.get("end_date") else "No end date (unlimited).")


@function_tool
async def show_expiring_contracts() -> str:
    """Show contracts expiring in the next 90 days. Manager only."""
    contracts = db.get_expiring_contracts(90)
    if not contracts:
        return "No contracts expiring in the next 90 days."
    await _send_ui("ContractListCard", {
        "title": "Expiring Contracts (90 Days)",
        "contracts": [{"employeeName": c.get("name", ""), "department": c.get("department", ""),
                        "contractType": c.get("contract_type", ""), "endDate": c.get("end_date", ""),
                        "employeeId": c.get("employee_id", "")} for c in contracts]
    }, "contract")
    return f"{len(contracts)} contract(s) expiring within 90 days."


# ============================================================
# ASSET TRACKING
# ============================================================

@function_tool
async def show_my_assets() -> str:
    """Show all company assets assigned to the employee (laptops, phones, cards, etc)."""
    emp_id = get_current_employee_id_from_context()
    assets = db.get_employee_assets(emp_id)
    if not assets:
        return "No company assets are currently assigned to you."
    await _send_ui("AssetListCard", {
        "assets": [{"ref": a["ref"], "type": a["asset_type"], "name": a["name"],
                     "serialNumber": a.get("serial_number", ""), "condition": a.get("condition", "good"),
                     "assignedDate": a.get("assigned_date", "")} for a in assets]
    }, "assets")
    return f"You have {len(assets)} company asset(s) assigned to you."


@function_tool
async def show_all_assets() -> str:
    """Show all company assets with assignment status. Manager/admin only."""
    assets = db.get_all_assets()
    await _send_ui("AssetInventoryCard", {
        "assets": [{"ref": a["ref"], "type": a["asset_type"], "name": a["name"],
                     "serialNumber": a.get("serial_number", ""), "assignedTo": a.get("assigned_name", "Unassigned"),
                     "status": a["status"], "condition": a.get("condition", "")} for a in assets]
    }, "assets")
    return f"Total {len(assets)} assets in inventory."


# ============================================================
# SHIFT SCHEDULING
# ============================================================

@function_tool
async def show_my_shift() -> str:
    """Show the employee's current work shift schedule."""
    emp_id = get_current_employee_id_from_context()
    shift = db.get_employee_shift(emp_id)
    if not shift:
        return "No shift schedule assigned. Contact your manager."
    await _send_ui("ShiftCard", {
        "shiftName": shift.get("shift_name", ""),
        "startTime": shift.get("start_time", ""),
        "endTime": shift.get("end_time", ""),
        "breakMinutes": shift.get("break_minutes", 60),
        "isNightShift": bool(shift.get("is_night_shift", 0)),
        "differentialPct": shift.get("differential_pct", 0),
        "effectiveDate": shift.get("effective_date", ""),
    }, "shift")
    return f"Your shift: {shift['shift_name']} ({shift['start_time']} - {shift['end_time']})"


@function_tool
async def show_team_shifts() -> str:
    """Show shift assignments for all team members. Manager only."""
    emp_id = get_current_employee_id_from_context()
    shifts = db.get_team_shifts(emp_id)
    if not shifts:
        return "No team members found."
    await _send_ui("TeamShiftCard", {
        "members": [{"id": s["id"], "name": s["name"], "department": s.get("department", ""),
                      "shiftName": s.get("shift_name", "Unassigned"),
                      "startTime": s.get("start_time", ""), "endTime": s.get("end_time", ""),
                      "isNightShift": bool(s.get("is_night_shift", 0))} for s in shifts]
    }, "shift")
    return f"Team shift overview: {len(shifts)} members."


# ============================================================
# REPORTS & ANALYTICS
# ============================================================

@function_tool
async def show_hr_report() -> str:
    """Show comprehensive HR analytics and reports dashboard. Manager/admin only."""
    data = db.get_hr_analytics()
    await _send_ui("HRReportCard", {
        "totalEmployees": data["total_employees"],
        "byDepartment": data["by_department"],
        "byNationality": data["by_nationality"],
        "leaveStats": data.get("leave_stats"),
        "salaryByDept": data["salary_by_dept"],
        "totalMonthlyPayroll": data["total_monthly_payroll"],
        "activeExits": data["active_exits"],
        "assetStats": data["asset_stats"],
        "expiringDocs90d": data["expiring_docs_90d"],
    }, "reports")
    payroll = f"{data['total_monthly_payroll']:,.0f}" if data['total_monthly_payroll'] else "0"
    return f"HR Report: {data['total_employees']} employees, monthly payroll {payroll} SAR, {data['active_exits']} active exits, {data['expiring_docs_90d']} docs expiring in 90d."


@function_tool
async def show_payroll_summary() -> str:
    """Show monthly payroll summary for all employees. Manager/admin only."""
    data = db.get_monthly_payroll_summary()
    if not data:
        return "No payroll data available."
    total_gross = sum(r.get("gross", 0) or 0 for r in data)
    total_deductions = sum(r.get("loan_deduction", 0) or 0 for r in data)
    await _send_ui("PayrollSummaryCard", {
        "employees": [{"id": r["id"], "name": r["name"], "department": r["department"],
                        "basic": r["basic_salary"], "housing": r["housing_allowance"],
                        "transport": r["transport_allowance"], "gross": r["gross"],
                        "loanDeduction": r.get("loan_deduction", 0)} for r in data],
        "totalGross": total_gross,
        "totalDeductions": total_deductions,
        "totalNet": total_gross - total_deductions,
    }, "reports")
    return f"Payroll summary: {len(data)} employees, total gross {total_gross:,.0f} SAR."


# ============================================================
# EMPLOYEE DIRECTORY
# ============================================================

@function_tool
async def search_directory(query: str = "", department: str = "") -> str:
    """Search the company employee directory by name, position, department, or ID."""
    results = db.get_employee_directory(query or None, department or None)
    if not results:
        return f"No employees found matching '{query}'."
    await _send_ui("DirectoryCard", {
        "employees": [{"id": r["id"], "name": r["name"], "nameAr": r.get("name_ar", ""),
                        "position": r["position"], "department": r["department"],
                        "email": r.get("email", ""), "phone": r.get("phone", ""),
                        "grade": r.get("grade", "")} for r in results],
        "query": query,
    }, "directory")
    return f"Found {len(results)} employee(s)." + (f" Searched for: {query}" if query else "")


@function_tool
async def show_org_chart() -> str:
    """Show the company organizational chart / hierarchy."""
    data = db.get_org_chart()
    if not data:
        return "No organizational data found."
    await _send_ui("OrgChartCard", {
        "employees": [{"id": e["id"], "name": e["name"], "position": e["position"],
                        "department": e["department"], "managerId": e.get("manager_id"),
                        "grade": e.get("grade", "")} for e in data]
    }, "org")
    return f"Org chart showing {len(data)} employees across departments."


# ============================================================
# IQAMA / VISA TRACKING
# ============================================================

@function_tool
async def show_my_iqama_visa() -> str:
    """Show employee's Iqama, visa, passport, and medical insurance documents with expiry dates."""
    emp_id = get_current_employee_id_from_context()
    docs = db.get_employee_documents_visa(emp_id)
    if not docs:
        return "No Iqama/visa documents on file."
    await _send_ui("IqamaVisaCard", {
        "documents": [{"id": d["id"], "type": d["document_type"], "number": d.get("document_number", ""),
                        "issueDate": d.get("issue_date", ""), "expiryDate": d.get("expiry_date", ""),
                        "status": d["status"], "cost": d.get("cost", 0)} for d in docs]
    }, "visa")
    expiring = [d for d in docs if d.get("status") == "expiring_soon"]
    msg = f"You have {len(docs)} document(s) on file."
    if expiring:
        msg += f" WARNING: {len(expiring)} document(s) expiring soon!"
    return msg


@function_tool
async def show_expiring_documents() -> str:
    """Show all Iqama/visa/passport documents expiring in 90 days across company. Manager/admin only."""
    docs = db.get_expiring_iqama_visa(90)
    if not docs:
        return "No documents expiring in the next 90 days."
    await _send_ui("ExpiringDocsCard", {
        "documents": [{"employeeName": d.get("name", ""), "department": d.get("department", ""),
                        "type": d["document_type"], "number": d.get("document_number", ""),
                        "expiryDate": d.get("expiry_date", ""), "status": d["status"],
                        "employeeId": d["employee_id"]} for d in docs]
    }, "visa")
    return f"{len(docs)} document(s) expiring within 90 days. Action required."


# ============================================================
# EXIT / OFFBOARDING
# ============================================================

@function_tool
async def initiate_exit_request(exit_type: str = "resignation", reason: str = "") -> str:
    """Initiate an exit/resignation/termination request. Calculates final settlement including EOS, leave encashment, and pending salary."""
    emp_id = get_current_employee_id_from_context()
    result = db.initiate_exit(emp_id, exit_type, reason or None)
    if not result:
        return "Could not initiate exit request."
    await _send_ui("ExitCard", {
        "ref": result["ref"],
        "exitType": exit_type,
        "lastWorkingDay": result["last_working_day"],
        "clearance": result["clearance"],
        "settlement": result["settlement"],
    }, "exit")
    total = result["settlement"]["total_settlement"]
    return f"Exit request {result['ref']} initiated. Last working day: {result['last_working_day']}. Estimated final settlement: {total:,.2f} SAR."


@function_tool
async def show_exit_status() -> str:
    """Show the current exit/offboarding request status and clearance progress."""
    emp_id = get_current_employee_id_from_context()
    ex = db.get_exit_request(emp_id)
    if not ex:
        return "No active exit request found."
    clearance = ex.get("clearance_status", {})
    if isinstance(clearance, str):
        clearance = _json.loads(clearance)
    settlement = ex.get("final_settlement", {})
    if isinstance(settlement, str):
        settlement = _json.loads(settlement)
    await _send_ui("ExitCard", {
        "ref": ex["ref"],
        "exitType": ex.get("exit_type", "resignation"),
        "lastWorkingDay": ex.get("last_working_day", ""),
        "clearance": clearance,
        "settlement": settlement,
        "status": ex.get("status", "initiated"),
    }, "exit")
    cleared = sum(1 for v in clearance.values() if v == "cleared")
    total = len(clearance)
    return f"Exit {ex['ref']}: {cleared}/{total} clearance items complete. Status: {ex.get('status', 'initiated')}."


@function_tool
async def show_all_exits() -> str:
    """Show all exit/offboarding requests across the company. Manager/admin only."""
    exits = db.get_all_exit_requests()
    if not exits:
        return "No exit requests found."
    items = []
    for ex in exits:
        clearance = ex.get("clearance_status", {})
        if isinstance(clearance, str):
            clearance = _json.loads(clearance)
        cleared = sum(1 for v in clearance.values() if v == "cleared")
        items.append({
            "ref": ex["ref"], "employeeName": ex.get("name", ""), "department": ex.get("department", ""),
            "exitType": ex.get("exit_type", ""), "lastWorkingDay": ex.get("last_working_day", ""),
            "status": ex.get("status", ""), "clearanceProgress": f"{cleared}/{len(clearance)}",
        })
    await _send_ui("ExitListCard", {"exits": items}, "exit")
    return f"{len(exits)} exit request(s) found."
