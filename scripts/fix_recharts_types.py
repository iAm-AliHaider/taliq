import pathlib
f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\dashboard-charts.tsx")
src = f.read_text("utf-8")

# Fix all Tooltip formatter type errors — v: number -> v: number | undefined
src = src.replace(
    '(v: number) => [`SAR ${Number(v).toLocaleString()}`, "Payroll Cost"]',
    '(v: number | undefined) => [`SAR ${Number(v||0).toLocaleString()}`, "Payroll Cost"]'
)
src = src.replace(
    'formatter={(v: number) => `SAR ${Number(v).toLocaleString()}`}',
    'formatter={(v: number | undefined) => `SAR ${Number(v||0).toLocaleString()}`}'
)
f.write_text(src, "utf-8")
print("Fixed Recharts Tooltip types")
