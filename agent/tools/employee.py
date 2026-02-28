"""Employee self-service tools — read operations, CRUD, and requests view."""

import datetime
from datetime import date as dt
from livekit.agents import function_tool, RunContext
import database as db
from tools.core import get_current_employee_id_from_context, _send_ui


# ---- READ OPERATIONS ----

@function_tool()
async def check_leave_balance(context: RunContext):
    """Show leave balance overview."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    bal = emp["leave_balance"]
    await _send_ui(
        "LeaveBalanceCard",
        {
            "employeeName": emp["name"],
            "annual": bal["annual"],
            "sick": bal["sick"],
            "emergency": bal["emergency"],
            "study": bal.get("study"),
        },
        "main_card",
    )
    return f"{bal['annual']} annual, {bal['sick']} sick, {bal['emergency']} emergency days."


@function_tool()
async def show_my_leave_requests(context: RunContext):
    """Show all my leave requests."""
    reqs = db.get_leave_requests(get_current_employee_id_from_context())
    if not reqs:
        return "No leave requests."
    emp = db.get_employee(get_current_employee_id_from_context())
    lr = reqs[0]
    await _send_ui(
        "LeaveRequestForm",
        {
            "employeeName": emp["name"] if emp else "",
            "leaveType": lr["leave_type"],
            "startDate": lr["start_date"],
            "endDate": lr["end_date"],
            "days": lr["days"],
            "reason": lr["reason"] or "",
            "status": lr["status"],
            "reference": lr["ref"],
            "mode": "display",
        },
        "main_card",
    )
    summary = ", ".join(f"{r['ref']}({r['status']})" for r in reqs[:5])
    return f"{len(reqs)} request(s): {summary}"


@function_tool()
async def show_my_profile(context: RunContext):
    """Show employee profile (read-only view)."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    mgr = db.get_employee(emp.get("manager_id", ""))
    await _send_ui(
        "EmployeeProfileCard",
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
        },
        "main_card",
    )
    return f"{emp['name']}, {emp['position']}."


@function_tool()
async def show_pay_slip(context: RunContext, month: str = "February 2026"):
    """Show comprehensive salary breakdown with earnings, deductions, loan EMIs, GOSI, and YTD."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    sal = emp["salary"]
    gosi_policy = db.get_policy("gosi.employee_rate")
    gosi_rate = gosi_policy if gosi_policy else 9.75
    gosi_amount = round(sal["basic"] * gosi_rate / 100, 2)
    gross = sal["total"]

    loans = db.get_employee_loans(get_current_employee_id_from_context())
    loan_deductions = []
    total_loan_emi = 0
    for loan in loans:
        if loan.get("status") == "active" and loan.get("monthly_emi"):
            emi = loan["monthly_emi"]
            loan_deductions.append({
                "ref": loan.get("ref", ""),
                "type": loan.get("loan_type", "Loan"),
                "emi": emi,
                "remaining": loan.get("remaining_amount", 0),
            })
            total_loan_emi += emi

    total_deductions = gosi_amount + total_loan_emi
    net_pay = gross - total_deductions

    month_num = datetime.datetime.now().month
    ytd_gross = gross * month_num
    ytd_deductions = total_deductions * month_num
    ytd_net = net_pay * month_num

    await _send_ui(
        "SalaryBreakdownCard",
        {
            "employeeName": emp["name"],
            "employeeId": emp["id"],
            "position": emp["position"],
            "department": emp["department"],
            "grade": str(emp.get("grade", "")),
            "month": month,
            "basic": sal["basic"],
            "housing": sal["housing"],
            "transport": sal["transport"],
            "gosiRate": gosi_rate,
            "gosiAmount": gosi_amount,
            "loanDeductions": loan_deductions,
            "totalLoanDeduction": total_loan_emi,
            "grossPay": gross,
            "totalDeductions": total_deductions,
            "netPay": net_pay,
            "currency": "SAR",
            "ytdGross": ytd_gross,
            "ytdDeductions": ytd_deductions,
            "ytdNet": ytd_net,
        },
        "main_card",
    )
    return f"Salary breakdown for {month}: Gross {gross:,.0f} SAR, Deductions {total_deductions:,.0f} SAR (GOSI {gosi_amount:,.0f} + Loans {total_loan_emi:,.0f}), Net {net_pay:,.0f} SAR."


@function_tool()
async def check_loan_eligibility(context: RunContext):
    """Check loan eligibility."""
    result = db.check_loan_eligibility(get_current_employee_id_from_context())
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    await _send_ui(
        "LoanCard",
        {
            "employeeName": emp["name"],
            "loanType": "Eligibility",
            "amount": 0,
            "currency": "SAR",
            "eligible": result["eligible"],
            "maxAmount": result.get("max_amount"),
            "status": "eligible" if result["eligible"] else "ineligible",
        },
        "main_card",
    )
    if result["eligible"]:
        return f"Eligible! Max: {result['max_amount']:,} SAR."
    return f"Not eligible: {result['reason']}"


@function_tool()
async def show_loan_balance(context: RunContext):
    """Show active loans."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    loans = db.get_employee_loans(get_current_employee_id_from_context())
    if not loans:
        await _send_ui(
            "StatusBanner", {"message": "No active loans.", "type": "info"}, "main_card"
        )
        return "No active loans."
    loan = loans[0]
    await _send_ui(
        "LoanCard",
        {
            "employeeName": emp["name"],
            "loanType": loan["loan_type"],
            "amount": loan["amount"],
            "currency": "SAR",
            "remainingBalance": loan["remaining"],
            "monthlyInstallment": loan["monthly_installment"],
            "installmentsLeft": loan["installments_left"],
            "status": "active",
        },
        "main_card",
    )
    return f"{len(loans)} loan(s), {sum(l['remaining'] for l in loans):,} SAR remaining."


@function_tool()
async def show_my_documents(context: RunContext):
    """Show my document requests."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    docs = db.get_document_requests(get_current_employee_id_from_context())
    if not docs:
        return "No requests."
    doc = docs[0]
    await _send_ui(
        "DocumentRequestCard",
        {
            "employeeName": emp["name"],
            "documentType": doc["document_type"],
            "requestDate": str(doc["created_at"])[:10],
            "status": doc["status"],
            "referenceNumber": doc["ref"],
        },
        "main_card",
    )
    return f"{len(docs)} request(s). Latest: {doc['document_type']} - {doc['status']}."


@function_tool()
async def show_announcements(context: RunContext):
    """Show announcements."""
    anns = db.get_announcements()
    if not anns:
        return "None."
    a = anns[0]
    await _send_ui(
        "AnnouncementCard",
        {
            "title": a["title"],
            "content": a["content"],
            "author": a.get("author"),
            "date": str(a["created_at"])[:10],
            "priority": a.get("priority", "normal"),
            "acknowledgedCount": a.get("acknowledged_count"),
            "totalCount": a.get("total_count"),
        },
        "main_card",
    )
    return f"Latest: {a['title']}."


@function_tool()
async def show_team_attendance(context: RunContext):
    """Show team attendance."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    att = db.get_team_attendance(get_current_employee_id_from_context())
    if not att:
        return "No team."
    await _send_ui(
        "AttendanceDashboard",
        {
            "managerName": emp["name"],
            "date": str(dt.today()),
            "team": att,
        },
        "main_card",
    )
    p = sum(1 for a in att if a["status"] in ("present", "remote"))
    return f"{p}/{len(att)} present."


@function_tool()
async def show_status(context: RunContext, message: str, status_type: str = "info"):
    """Show notification."""
    await _send_ui(
        "StatusBanner", {"message": message, "type": status_type}, "main_card"
    )
    return message


# ---- CRUD ----

@function_tool()
async def apply_for_leave(
    context: RunContext,
    leave_type: str,
    start_date: str,
    end_date: str,
    days: int,
    reason: str,
):
    """CREATE a leave request in the database."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Employee not found."
    bal = emp["leave_balance"].get(leave_type, 0)
    if days > bal:
        await _send_ui(
            "StatusBanner",
            {"message": f"Insufficient {leave_type} leave ({bal} left).", "type": "error"},
            "main_card",
        )
        return f"Only {bal} {leave_type} days remaining."
    lr = db.submit_leave_request(
        get_current_employee_id_from_context(), leave_type, start_date, end_date, days, reason
    )
    await _send_ui(
        "LeaveRequestForm",
        {
            "employeeName": emp["name"],
            "leaveType": leave_type,
            "startDate": start_date,
            "endDate": end_date,
            "days": days,
            "reason": reason,
            "balance": bal - days,
            "status": "submitted",
            "reference": lr["ref"],
            "mode": "display",
        },
        "main_card",
    )
    return f"Leave {lr['ref']} created! {days} {leave_type} days. Sent to manager."


@function_tool()
async def apply_for_loan(
    context: RunContext, loan_type: str, amount: float, months: int
):
    """CREATE a loan application."""
    elig = db.check_loan_eligibility(get_current_employee_id_from_context())
    if not elig["eligible"]:
        await _send_ui(
            "StatusBanner",
            {"message": f"Not eligible: {elig['reason']}", "type": "error"},
            "main_card",
        )
        return f"Cannot apply: {elig['reason']}"
    if amount > elig["max_amount"]:
        return f"Exceeds max ({elig['max_amount']:,} SAR)."
    loan = db.create_loan(get_current_employee_id_from_context(), loan_type, amount, months)
    emp = db.get_employee(get_current_employee_id_from_context())
    await _send_ui(
        "LoanCard",
        {
            "employeeName": emp["name"] if emp else "",
            "loanType": loan["loan_type"],
            "amount": loan["amount"],
            "currency": "SAR",
            "remainingBalance": loan["remaining"],
            "monthlyInstallment": loan["monthly_installment"],
            "installmentsLeft": loan["installments_left"],
            "status": "active",
        },
        "main_card",
    )
    return f"Loan {loan['ref']} created! {amount:,.0f} SAR over {months} months."


@function_tool()
async def request_document(context: RunContext, document_type: str):
    """CREATE a document request."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    doc = db.create_document_request(get_current_employee_id_from_context(), document_type)
    await _send_ui(
        "DocumentRequestCard",
        {
            "employeeName": emp["name"],
            "documentType": doc["document_type"],
            "requestDate": str(doc["created_at"])[:10],
            "status": "requested",
            "estimatedDate": doc["estimated_date"],
            "referenceNumber": doc["ref"],
        },
        "main_card",
    )
    return f"Request {doc['ref']} created! Ready in 2 days."


@function_tool()
async def create_travel_request(
    context: RunContext,
    destination: str,
    start_date: str,
    end_date: str,
    days: int,
    travel_type: str = "business",
):
    """CREATE a travel request."""
    emp = db.get_employee(get_current_employee_id_from_context())
    if not emp:
        return "Not found."
    tr = db.create_travel_request(
        get_current_employee_id_from_context(), destination, start_date, end_date, days, travel_type
    )
    await _send_ui(
        "TravelRequestCard",
        {
            "employeeName": emp["name"],
            "destination": tr["destination"],
            "travelType": tr["travel_type"],
            "startDate": tr["start_date"],
            "endDate": tr["end_date"],
            "days": tr["days"],
            "perDiem": tr["per_diem"],
            "totalAllowance": tr["total_allowance"],
            "currency": "SAR",
            "status": "pending",
        },
        "main_card",
    )
    return f"Travel {tr['ref']} created! {destination}, {days} days, {tr['total_allowance']:,} SAR."


@function_tool
async def show_my_requests(context: RunContext):
    """Show ALL of the employee's requests across all categories - leaves, loans, documents, travel, grievances."""
    emp_id = get_current_employee_id_from_context()
    emp = db.get_employee(emp_id)
    if not emp:
        return "Employee not found."

    leaves = db.get_leave_requests(emp_id)
    loans = db.get_employee_loans(emp_id)
    docs = db.get_document_requests(emp_id)
    travel = db.get_travel_requests(emp_id)
    grievances = db.get_my_grievances(emp_id)

    await _send_ui("MyRequestsCard", {
        "employeeName": emp["name"],
        "leaveRequests": [{
            "ref": r["ref"], "type": r["leave_type"], "days": r["days"],
            "startDate": r["start_date"], "status": r["status"],
        } for r in leaves],
        "loans": [{
            "ref": r["ref"], "type": r["loan_type"], "amount": r["amount"],
            "remaining": r["remaining"], "status": r["status"],
        } for r in loans],
        "documents": [{
            "ref": r["ref"], "type": r["document_type"], "status": r["status"],
        } for r in docs],
        "travel": [{
            "ref": r["ref"], "destination": r["destination"], "days": r["days"],
            "status": r["status"],
        } for r in travel],
        "grievances": [{
            "ref": r["ref"], "subject": r["subject"], "status": r["status"],
        } for r in grievances],
    }, "my_requests")

    parts = []
    if leaves: parts.append(f"{len(leaves)} leave requests")
    if loans: parts.append(f"{len(loans)} loans")
    if docs: parts.append(f"{len(docs)} documents")
    if travel: parts.append(f"{len(travel)} travel requests")
    if grievances: parts.append(f"{len(grievances)} grievances")

    if not parts:
        return "You have no active requests."
    return f"You have: {', '.join(parts)}."
