import sys
sys.stdout.reconfigure(encoding="utf-8")

path = r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\api\paycodes\route.ts"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

old = "SELECT id, name, department, basic_salary, housing_allowance, transport_allowance\n        FROM employees WHERE status = 'active' OR status IS NULL"
new = "SELECT id, name, department, basic_salary, housing_allowance, transport_allowance\n        FROM employees"

if old in src:
    src = src.replace(old, new, 1)
    print("[OK] Removed status filter from employees query")
else:
    print("[WARN] Pattern not found — searching for partial match...")
    # Try alternate
    old2 = "FROM employees WHERE status = 'active' OR status IS NULL"
    new2 = "FROM employees"
    if old2 in src:
        src = src.replace(old2, new2, 1)
        print("[OK] Fixed (alternate pattern)")
    else:
        print("[ERR] Could not find pattern")
        import re
        # Find the line
        for i, line in enumerate(src.split('\n')):
            if 'status' in line and 'employees' in line.lower():
                print(f"  Line {i}: {line}")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)
print("Done")
