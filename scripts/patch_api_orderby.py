import sys
sys.stdout.reconfigure(encoding="utf-8")

path = r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\api\paycodes\route.ts"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

src = src.replace(
    "ORDER BY employee_id, sort_order",
    "ORDER BY employee_id, paycode_id"
)
with open(path, "w", encoding="utf-8") as f:
    f.write(src)
print("Fixed ORDER BY in payroll_lines query")
