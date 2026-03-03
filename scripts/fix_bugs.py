"""Fix 3 API crashes + 1 security issue"""
import pathlib

# ─── Fix admin API ────────────────────────────────────────────────────────────
f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\api\admin\route.ts")
src = f.read_text("utf-8")

# Bug 1: announcements - a.applied_at → a.created_at
src = src.replace("ORDER BY a.applied_at DESC", "ORDER BY a.created_at DESC")
print("Fix 1: announcements ORDER BY a.created_at")

# Bug 2: recruitment - a.created_at → a.applied_at
src = src.replace("ORDER BY a.created_at DESC", "ORDER BY a.applied_at DESC")
print("Fix 2: recruitment ORDER BY a.applied_at")

# Bug 3: dashboard - payroll_runs.period → period_label
src = src.replace(
    "SELECT ref, period, total_gross, total_deductions, total_net, status FROM payroll_runs",
    "SELECT ref, period_label as period, total_gross, total_deductions, total_net, status FROM payroll_runs"
)
print("Fix 3: dashboard payroll_runs period_label AS period")

f.write_text(src, "utf-8")

# ─── Fix candidate API security ──────────────────────────────────────────────
f2 = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\api\candidate\route.ts")
src2 = f2.read_text("utf-8")

# Bug 4: my_status accessible without PIN — add PIN check
old = '''    if (section === "my_status") {
      const app_ref = searchParams.get("ref");
      if (!app_ref) return NextResponse.json({ error: "ref required" }, { status: 400 });'''

new = '''    if (section === "my_status") {
      const app_ref = searchParams.get("ref");
      const pin = searchParams.get("pin");
      if (!app_ref || !pin) return NextResponse.json({ error: "ref and pin required" }, { status: 400 });
      
      // Verify PIN
      const [auth] = await sql\`SELECT id FROM job_applications WHERE ref = \${app_ref} AND pin = \${pin}\`;
      if (!auth) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });'''

if old in src2:
    src2 = src2.replace(old, new)
    print("Fix 4: candidate my_status now requires PIN")
else:
    print("WARNING: candidate my_status anchor not found")

f2.write_text(src2, "utf-8")

# Also fix the candidate portal frontend to pass PIN
f3 = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\candidate\page.tsx")
src3 = f3.read_text("utf-8")

# Fix loadStatus to include pin
old_load = "async function loadStatus(r: string) {\n    const res = await fetch(`/api/candidate?section=my_status&ref=${r}`).then(r => r.json());"
new_load = "async function loadStatus(r: string) {\n    const saved = JSON.parse(localStorage.getItem('taliq_candidate') || '{}');\n    const res = await fetch(`/api/candidate?section=my_status&ref=${r}&pin=${saved.pin || ''}`).then(r => r.json());"

if old_load in src3:
    src3 = src3.replace(old_load, new_load)
    print("Fix 4b: candidate portal passes PIN to status API")
else:
    print("WARNING: candidate loadStatus anchor not found")

f3.write_text(src3, "utf-8")
print("All fixes applied")
