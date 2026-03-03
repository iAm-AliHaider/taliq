"""Gap #20-23: Voice tools for payroll, GL/JV, salary history, EOS balance"""
import logging
from livekit.agents import function_tool, RunContext
from tools.core import get_current_employee_id_from_context, _send_ui
from database import get_db

logger = logging.getLogger(__name__)

# ── Gap #20: Payroll voice tools ─────────────────────────────────────────────

@function_tool
async def show_payroll_runs(context: RunContext) -> str:
    """List all payroll runs with their status, totals, and period."""
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT ref, period_label, status, total_gross, total_deductions, 
                       total_net, total_gosi_employee, total_gosi_employer, employee_count, created_at
                FROM payroll_runs ORDER BY id DESC LIMIT 10
            """)
            runs = cur.fetchall()
        
        if not runs:
            return "No payroll runs found yet."
        
        result = "Here are your payroll runs:\n"
        for r in runs:
            ref, period, status, gross, ded, net, gosi_ee, gosi_er, emp_count, created = r
            result += f"\n• {ref} ({period}) — Status: {status}\n"
            result += f"  Gross: SAR {float(gross or 0):,.0f} | Deductions: SAR {float(ded or 0):,.0f} | Net: SAR {float(net or 0):,.0f}\n"
            result += f"  GOSI Employee: SAR {float(gosi_ee or 0):,.0f} | GOSI Employer: SAR {float(gosi_er or 0):,.0f}\n"
            result += f"  Employees: {emp_count}\n"
        
        return result
    except Exception as e:
        logger.error(f"show_payroll_runs: {e}")
        return f"Could not retrieve payroll runs: {e}"


@function_tool
async def show_my_payslip(context: RunContext) -> str:
    """Show the current employee's latest payslip with earnings and deductions breakdown."""
    try:
        eid = get_current_employee_id_from_context(context)
        with get_db() as conn:
            cur = conn.cursor()
            # Get latest run
            cur.execute("SELECT id, ref, period_label FROM payroll_runs ORDER BY id DESC LIMIT 1")
            run = cur.fetchone()
            if not run:
                return "No payroll runs found."
            run_id, run_ref, period = run
            
            # Get lines for this employee
            cur.execute("""
                SELECT paycode_name, paycode_type, amount
                FROM payroll_lines WHERE run_id=%s AND employee_id=%s
                ORDER BY paycode_type, paycode_code
            """, (run_id, eid))
            lines = cur.fetchall()
        
        if not lines:
            return f"No payslip found for you in {period}."
        
        earnings = [(n, a) for n, t, a in lines if t == 'earning']
        deductions = [(n, a) for n, t, a in lines if t == 'deduction']
        employer = [(n, a) for n, t, a in lines if t == 'employer_contribution']
        
        total_earn = sum(a for _, a in earnings)
        total_ded = sum(a for _, a in deductions)
        net = total_earn - total_ded
        
        result = f"Your payslip for {period} ({run_ref}):\n\n"
        result += "EARNINGS:\n"
        for name, amt in earnings:
            result += f"  {name}: SAR {float(amt):,.2f}\n"
        result += f"  Total Earnings: SAR {float(total_earn):,.2f}\n\n"
        
        result += "DEDUCTIONS:\n"
        for name, amt in deductions:
            result += f"  {name}: SAR {float(amt):,.2f}\n"
        result += f"  Total Deductions: SAR {float(total_ded):,.2f}\n\n"
        
        result += f"NET PAY: SAR {float(net):,.2f}\n"
        
        if employer:
            result += "\nEMPLOYER CONTRIBUTIONS:\n"
            for name, amt in employer:
                result += f"  {name}: SAR {float(amt):,.2f}\n"
        
        await _send_ui(context, "PayslipCard", {
            "run_ref": run_ref, "period": period, "employee_id": eid,
            "total_earnings": float(total_earn), "total_deductions": float(total_ded), "net_pay": float(net),
            "earnings": [{"name": n, "amount": float(a)} for n, a in earnings],
            "deductions": [{"name": n, "amount": float(a)} for n, a in deductions],
        })
        
        return result
    except Exception as e:
        logger.error(f"show_my_payslip: {e}")
        return f"Could not retrieve payslip: {e}"


# ── Gap #21: GL/JV voice tools ───────────────────────────────────────────────

@function_tool
async def show_journal_voucher(context: RunContext, run_ref: str = "") -> str:
    """Show the journal voucher for a payroll run. Optionally specify run_ref like PR-2026-04."""
    try:
        with get_db() as conn:
            cur = conn.cursor()
            if run_ref:
                cur.execute("SELECT id FROM payroll_runs WHERE ref=%s", (run_ref,))
            else:
                cur.execute("SELECT id FROM payroll_runs ORDER BY id DESC LIMIT 1")
            run = cur.fetchone()
            if not run:
                return f"Payroll run {run_ref or '(latest)'} not found."
            run_id = run[0]
            
            cur.execute("""
                SELECT jv_ref, jv_date, description, total_debit, total_credit, status
                FROM journal_vouchers WHERE run_id=%s
            """, (run_id,))
            jv = cur.fetchone()
            if not jv:
                return f"No journal voucher generated for this run yet. Go to Payroll JV in admin to generate it."
            
            jv_ref, jv_date, desc, debit, credit, status = jv
            
            # Get JV lines
            cur.execute("""
                SELECT line_no, account_number, account_name, debit, credit, narration
                FROM jv_lines WHERE run_id=%s ORDER BY line_no
            """, (run_id,))
            lines = cur.fetchall()
        
        result = f"Journal Voucher: {jv_ref}\n"
        result += f"Date: {str(jv_date)[:10]} | Status: {status}\n"
        result += f"Description: {desc}\n\n"
        result += f"{'Line':<4} {'Account':<8} {'Name':<30} {'Debit':>12} {'Credit':>12}\n"
        result += "-" * 70 + "\n"
        for line in lines:
            no, acct, name, dr, cr, narr = line
            result += f"{no:<4} {acct:<8} {name[:28]:<30} {float(dr or 0):>12,.2f} {float(cr or 0):>12,.2f}\n"
        result += "-" * 70 + "\n"
        result += f"{'TOTAL':<44} {float(debit):>12,.2f} {float(credit):>12,.2f}\n"
        result += f"\nBalanced: {'Yes' if abs(float(debit) - float(credit)) < 0.01 else 'NO — CHECK IMMEDIATELY'}"
        
        return result
    except Exception as e:
        logger.error(f"show_journal_voucher: {e}")
        return f"Could not retrieve journal voucher: {e}"


@function_tool
async def list_gl_accounts(context: RunContext) -> str:
    """List all GL accounts used in the chart of accounts for payroll."""
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT account_number, account_name, account_type, is_active FROM gl_accounts ORDER BY account_number")
            accounts = cur.fetchall()
        
        result = "Chart of Accounts (Payroll):\n\n"
        current_type = ""
        for acct_no, name, acct_type, active in accounts:
            if acct_type != current_type:
                current_type = acct_type
                result += f"\n{acct_type.upper()}:\n"
            status = "" if active else " [inactive]"
            result += f"  {acct_no} — {name}{status}\n"
        return result
    except Exception as e:
        logger.error(f"list_gl_accounts: {e}")
        return f"Could not retrieve GL accounts: {e}"


# ── Gap #22: Salary history voice tools ─────────────────────────────────────

@function_tool
async def show_salary_history(context: RunContext, employee_id: str = "") -> str:
    """Show salary history for an employee. Shows your own history if no employee specified."""
    try:
        eid = employee_id or get_current_employee_id_from_context(context)
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT name FROM employees WHERE id=%s", (eid,))
            emp = cur.fetchone()
            
            cur.execute("""
                SELECT effective_date, old_salary, new_salary, change_type, change_pct, reason, changed_by
                FROM salary_history WHERE employee_id=%s ORDER BY effective_date DESC LIMIT 10
            """, (eid,))
            history = cur.fetchall()
        
        emp_name = emp[0] if emp else eid
        if not history:
            return f"No salary history found for {emp_name}."
        
        result = f"Salary history for {emp_name}:\n\n"
        for row in history:
            eff_date, old_sal, new_sal, change_type, pct, reason, changed_by = row
            direction = "up" if float(new_sal or 0) > float(old_sal or 0) else "down"
            result += f"• {str(eff_date)[:10]}: SAR {float(old_sal or 0):,.0f} → SAR {float(new_sal or 0):,.0f} ({direction} {abs(float(pct or 0)):.1f}%)\n"
            if reason:
                result += f"  Reason: {reason}\n"
        return result
    except Exception as e:
        logger.error(f"show_salary_history: {e}")
        return f"Could not retrieve salary history: {e}"


@function_tool
async def give_salary_raise(context: RunContext, employee_id: str, percentage: float, reason: str = "") -> str:
    """Give an employee a salary raise by a percentage. Example: give Ahmed a 10% raise."""
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT name, basic_salary, housing_allowance FROM employees WHERE id=%s", (employee_id,))
            emp = cur.fetchone()
            if not emp:
                return f"Employee {employee_id} not found."
            
            name, basic, housing = emp
            new_basic = round(float(basic or 0) * (1 + percentage / 100), 2)
            old_total = float(basic or 0) + float(housing or 0)
            new_total = new_basic + float(housing or 0)
            
            # Update salary
            cur.execute("UPDATE employees SET basic_salary=%s WHERE id=%s", (new_basic, employee_id))
            
            # Record in salary history
            cur.execute("""
                INSERT INTO salary_history (employee_id, effective_date, old_salary, new_salary, change_type, change_pct, reason, changed_by)
                VALUES (%s, CURRENT_DATE, %s, %s, 'merit_increase', %s, %s, 'voice_agent')
            """, (employee_id, old_total, new_total, percentage, reason or f"{percentage}% merit increase"))
            conn.commit()
        
        return f"Done! {name}'s basic salary raised by {percentage}%: SAR {float(basic or 0):,.0f} → SAR {new_basic:,.0f}. Change recorded in salary history."
    except Exception as e:
        logger.error(f"give_salary_raise: {e}")
        return f"Could not process salary raise: {e}"


# ── Gap #23: EOS voice tools ─────────────────────────────────────────────────

@function_tool
async def show_eos_balance(context: RunContext, employee_id: str = "") -> str:
    """Show End of Service (EOS) gratuity balance for an employee. Shows your own if no ID given."""
    try:
        eid = employee_id or get_current_employee_id_from_context(context)
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT name, join_date, basic_salary, housing_allowance, nationality FROM employees WHERE id=%s", (eid,))
            emp = cur.fetchone()
            if not emp:
                return f"Employee {eid} not found."
            
            name, join_date, basic, housing, nationality = emp
            
            # Calculate live EOS
            from datetime import date
            today = date.today()
            jd = join_date if hasattr(join_date, 'year') else date.fromisoformat(str(join_date)[:10])
            years = (today - jd).days / 365.25
            monthly = float(basic or 0) + float(housing or 0)
            
            if years <= 5:
                eos = years * 0.5 * monthly
            else:
                eos = (5 * 0.5 * monthly) + ((years - 5) * 1.0 * monthly)
            
            # Also get from provisions table if exists
            cur.execute("SELECT cumulative_provision FROM eos_provisions WHERE employee_id=%s ORDER BY id DESC LIMIT 1", (eid,))
            stored = cur.fetchone()
        
        result = f"End of Service calculation for {name} ({eid}):\n\n"
        result += f"Join Date: {str(join_date)[:10]}\n"
        result += f"Years of Service: {years:.1f} years\n"
        result += f"Monthly Salary (Basic + Housing): SAR {monthly:,.2f}\n\n"
        
        if years < 2:
            result += "Note: Less than 2 years service — no EOS entitlement under Saudi Labor Law.\n"
        elif years <= 5:
            result += f"EOS Rate: 0.5 month per year (first 5 years)\n"
        else:
            result += f"EOS Rate: 0.5 month/yr for first 5 years + 1 month/yr thereafter\n"
        
        result += f"\nCalculated EOS Provision: SAR {eos:,.2f}"
        if stored:
            result += f"\nLast Stored Provision: SAR {float(stored[0]):,.2f}"
        
        return result
    except Exception as e:
        logger.error(f"show_eos_balance: {e}")
        return f"Could not calculate EOS: {e}"


@function_tool
async def show_all_eos_provisions(context: RunContext) -> str:
    """Show EOS provision summary for all employees (manager/admin only)."""
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT ep.employee_id, e.name, ep.years_of_service, ep.monthly_basic, ep.cumulative_provision
                FROM eos_provisions ep JOIN employees e ON ep.employee_id = e.id
                ORDER BY ep.cumulative_provision DESC
            """)
            rows = cur.fetchall()
        
        if not rows:
            return "No EOS provisions on record. Run the EOS calculation from the admin panel."
        
        total = sum(float(r[4] or 0) for r in rows)
        result = f"EOS Provisions Summary ({len(rows)} employees):\n\n"
        for eid, name, years, monthly, prov in rows:
            result += f"• {name} ({eid}): {float(years):.1f}y | Monthly: SAR {float(monthly or 0):,.0f} | EOS: SAR {float(prov or 0):,.0f}\n"
        result += f"\nTotal EOS Liability: SAR {total:,.2f}"
        return result
    except Exception as e:
        logger.error(f"show_all_eos_provisions: {e}")
        return f"Could not retrieve EOS provisions: {e}"
