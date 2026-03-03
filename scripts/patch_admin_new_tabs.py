import sys
sys.stdout.reconfigure(encoding="utf-8")

path = r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\page.tsx"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# 1. Add imports
new_imports = [
    ('import OrgChart from "./org-chart";', "OrgChart"),
    ('import SalaryHistory from "./salary-history";', "SalaryHistory"),
    ('import EOSProvisions from "./eos-provisions";', "EOSProvisions"),
    ('import ProbationAlerts from "./probation-alerts";', "ProbationAlerts"),
]
for imp, name in new_imports:
    if name not in src:
        # Insert after PayrollJV import
        src = src.replace('import PayrollJV from "./payroll-jv";', f'import PayrollJV from "./payroll-jv";\n{imp}')
        print(f"[OK] Import {name}")

# 2. Add tabs
old_tabs = '"Paycodes & GL", "Payroll JV"];'
new_tabs = '"Paycodes & GL", "Payroll JV", "Org Chart", "Salary History", "EOS Provisions", "Probation"];'
if '"Org Chart"' not in src:
    src = src.replace(old_tabs, new_tabs, 1)
    print("[OK] Added 4 new tabs")

# 3. Add tab panels (before Paycodes & GL)
old_panel = '        {tab === "Paycodes & GL" && ('
new_panels = '''        {tab === "Org Chart" && (
          <div className="p-1">
            <OrgChart />
          </div>
        )}
        {tab === "Salary History" && (
          <div className="p-1">
            <SalaryHistory />
          </div>
        )}
        {tab === "EOS Provisions" && (
          <div className="p-1">
            <EOSProvisions />
          </div>
        )}
        {tab === "Probation" && (
          <div className="p-1">
            <ProbationAlerts />
          </div>
        )}
        {tab === "Paycodes & GL" && ('''

if '"Org Chart"' not in src.split('{tab ===')[0] or 'OrgChart' not in src.split('return')[1]:
    src = src.replace(old_panel, new_panels, 1)
    print("[OK] Added 4 tab panels")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)
print("\nDone!")
