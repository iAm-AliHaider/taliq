"""Gap #20-23: Wire payroll voice tools into __init__.py and agent.py"""
import pathlib, re

# ── 1. Add to __init__.py ────────────────────────────────────────────────────
init_f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\agent\tools\__init__.py")
init_src = init_f.read_text("utf-8")

payroll_import = """
from tools.payroll import (
    show_payroll_runs,
    show_my_payslip,
    show_journal_voucher,
    list_gl_accounts,
    show_salary_history,
    give_salary_raise,
    show_eos_balance,
    show_all_eos_provisions,
)
"""

if "from tools.payroll import" not in init_src:
    init_src += payroll_import
    init_f.write_text(init_src, "utf-8")
    print("Added payroll tools to __init__.py")
else:
    print("Already in __init__.py")

# ── 2. Add to ALL_TOOLS in agent.py ─────────────────────────────────────────
agent_f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\agent\agent.py")
agent_src = agent_f.read_text("utf-8")

# Find the ALL_TOOLS list and add payroll tools
new_tools = """    show_payroll_runs,
    show_my_payslip,
    show_journal_voucher,
    list_gl_accounts,
    show_salary_history,
    give_salary_raise,
    show_eos_balance,
    show_all_eos_provisions,"""

if "show_payroll_runs" not in agent_src:
    # Find the imports section to add the new imports
    if "from tools.payroll import" not in agent_src:
        agent_src = agent_src.replace(
            "from tools import (",
            "from tools.payroll import (\n    show_payroll_runs, show_my_payslip, show_journal_voucher,\n    list_gl_accounts, show_salary_history, give_salary_raise,\n    show_eos_balance, show_all_eos_provisions,\n)\nfrom tools import ("
        )
    
    # Find ALL_TOOLS list - look for it
    if "ALL_TOOLS" in agent_src:
        # Find last item before closing bracket
        idx = agent_src.rfind("    show_approval_workflows,")
        if idx >= 0:
            insert_at = idx + len("    show_approval_workflows,")
            agent_src = agent_src[:insert_at] + "\n" + new_tools + agent_src[insert_at:]
            print("Added payroll tools to ALL_TOOLS")
        else:
            # Try another approach - find the closing ] of ALL_TOOLS
            idx2 = agent_src.find("]", agent_src.find("ALL_TOOLS"))
            if idx2 >= 0:
                agent_src = agent_src[:idx2] + new_tools + "\n" + agent_src[idx2:]
                print("Added payroll tools to ALL_TOOLS (via bracket)")
    else:
        print("WARNING: ALL_TOOLS not found in agent.py")
    
    agent_f.write_text(agent_src, "utf-8")
    print("Updated agent.py")
else:
    print("Payroll tools already in agent.py")

print("\nGap #20-23 DONE - Voice payroll tools wired")
