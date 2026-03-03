"""Patch admin API to add uploads + dashboard sections"""
import pathlib

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\api\admin\route.ts")
src = f.read_text("utf-8")

# ─── Add dashboard section to GET ────────────────────────────────────────────
DASHBOARD_SECTION = '''
    // Dashboard metrics
    if (section === "dashboard") {
      const metrics = await sql`SELECT metric, period, value FROM dashboard_metrics ORDER BY period`;
      const employees = await sql`SELECT department, nationality, COUNT(*) as cnt FROM employees GROUP BY department, nationality`;
      const leaveBalance = await sql`SELECT e.department, SUM(e.annual_leave) as total_annual, SUM(e.sick_leave) as total_sick FROM employees e GROUP BY e.department`;
      const recentHires = await sql`SELECT id, name, position, department, join_date FROM employees ORDER BY join_date DESC LIMIT 5`;
      const payrollSummary = await sql`SELECT ref, period, total_gross, total_deductions, total_net, status FROM payroll_runs ORDER BY id DESC LIMIT 6`;
      return NextResponse.json({ metrics, employees, leaveBalance, recentHires, payrollSummary });
    }
'''

# ─── Add uploads section to GET ──────────────────────────────────────────────
UPLOADS_SECTION = '''
    // File uploads
    if (section === "uploads") {
      const empFilter = searchParams.get("employee_id");
      const uploads = empFilter
        ? await sql`SELECT u.*, e.name as employee_name FROM uploads u LEFT JOIN employees e ON u.employee_id = e.id WHERE u.employee_id = ${empFilter} ORDER BY u.created_at DESC`
        : await sql`SELECT u.*, e.name as employee_name FROM uploads u LEFT JOIN employees e ON u.employee_id = e.id ORDER BY u.created_at DESC LIMIT 50`;
      const stats = await sql`SELECT category, COUNT(*) as cnt, SUM(size_bytes) as total_size FROM uploads GROUP BY category`;
      return NextResponse.json({ uploads, stats });
    }
'''

# Insert before the final catch block in GET
# Find a good anchor — the last return in GET before catch
anchor = '    return NextResponse.json({ error: "Unknown section" }'
if anchor in src and 'section === "dashboard"' not in src:
    src = src.replace(anchor, DASHBOARD_SECTION + UPLOADS_SECTION + '\n' + anchor)
    print("Added dashboard + uploads GET sections")
else:
    print("Anchor not found or already patched")

# ─── Add upload POST action ─────────────────────────────────────────────────
UPLOAD_ACTION = '''
    // Upload file (base64 in body — Blob fallback)
    if (action === "upload_file") {
      const { employee_id, filename, mime_type, size_bytes, category, description, data_b64, uploaded_by } = body;
      if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });
      const [row] = await sql`INSERT INTO uploads (employee_id, filename, mime_type, size_bytes, category, description, data_b64, uploaded_by)
        VALUES (${employee_id||null}, ${filename}, ${mime_type||"application/octet-stream"}, ${size_bytes||0}, ${category||"general"}, ${description||""}, ${data_b64||null}, ${uploaded_by||"admin"})
        RETURNING id, filename, category`;
      return NextResponse.json({ ok: true, id: row.id, filename: row.filename });
    }

    // Delete upload
    if (action === "delete_upload") {
      const { id } = body;
      await sql`DELETE FROM uploads WHERE id = ${Number(id)}`;
      return NextResponse.json({ ok: true });
    }
'''

# Find anchor in POST
post_anchor = '    return NextResponse.json({ error: "Unknown action" }'
if post_anchor in src and 'upload_file' not in src:
    src = src.replace(post_anchor, UPLOAD_ACTION + '\n' + post_anchor)
    print("Added upload POST actions")
else:
    print("POST anchor not found or already patched")

f.write_text(src, "utf-8")
print("API patched")
