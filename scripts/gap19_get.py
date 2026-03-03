import pathlib
f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\api\admin\route.ts")
src = f.read_text("utf-8")

# The tricky part: JS template literal with ${empFilter} inside sql`...`
# In Python we need to escape correctly
NEW = (
    '    // Dashboard metrics\n'
    '    if (section === "dashboard") {\n'
    '      const metrics = await sql`SELECT metric, period, value FROM dashboard_metrics ORDER BY period`;\n'
    '      const employees = await sql`SELECT department, nationality, COUNT(*) as cnt FROM employees GROUP BY department, nationality`;\n'
    '      const leaveBalance = await sql`SELECT e.department, SUM(e.annual_leave) as total_annual, SUM(e.sick_leave) as total_sick FROM employees e GROUP BY e.department`;\n'
    '      const recentHires = await sql`SELECT id, name, position, department, join_date FROM employees ORDER BY join_date DESC LIMIT 5`;\n'
    '      const payrollSummary = await sql`SELECT ref, period, total_gross, total_deductions, total_net, status FROM payroll_runs ORDER BY id DESC LIMIT 6`;\n'
    '      return NextResponse.json({ metrics, employees, leaveBalance, recentHires, payrollSummary });\n'
    '    }\n'
    '\n'
    '    // File uploads\n'
    '    if (section === "uploads") {\n'
    '      const empFilter = searchParams.get("employee_id");\n'
    '      const uploads = empFilter\n'
    '        ? await sql`SELECT u.*, e.name as employee_name FROM uploads u LEFT JOIN employees e ON u.employee_id = e.id WHERE u.employee_id = ${empFilter} ORDER BY u.created_at DESC`\n'
    '        : await sql`SELECT u.*, e.name as employee_name FROM uploads u LEFT JOIN employees e ON u.employee_id = e.id ORDER BY u.created_at DESC LIMIT 50`;\n'
    '      const stats = await sql`SELECT category, COUNT(*) as cnt, SUM(size_bytes) as total_size FROM uploads GROUP BY category`;\n'
    '      return NextResponse.json({ uploads, stats });\n'
    '    }\n'
    '\n'
    '    return NextResponse.json([]);'
)

if 'section === "dashboard"' not in src:
    src = src.replace('    return NextResponse.json([]);', NEW)
    f.write_text(src, "utf-8")
    print("Added dashboard + uploads GET sections")
else:
    print("Already patched")
