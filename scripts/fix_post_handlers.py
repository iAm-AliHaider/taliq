"""Fix all broken POST handlers in admin route.ts"""
import pathlib

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\api\admin\route.ts")
src = f.read_text("utf-8")

fixes = 0

# ─── Fix 1: create_announcement ──────────────────────────────────────────────
OLD1 = '''    if (action === "create_announcement") {
      const { title, content, author, priority } = body;
      if (!title || !content)     await audit(body.actor_id || "system", "create", "announcement", String(''), `new announcement: ${body.title}`);
          await audit(body.actor_id || "system", "create", "announcement", String(''), `announcement: ${body.title}`);
      return NextResponse.json({ error: "Title and content required" }, { status: 400 });
      await sql`INSERT INTO announcements (title, content, author, priority) VALUES (${title}, ${content}, ${author || "Admin"}, ${priority || "normal"})`;
      return NextResponse.json({ ok: true });
    }'''
NEW1 = '''    if (action === "create_announcement") {
      const { title, content, author, priority } = body;
      if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });
      await sql`INSERT INTO announcements (title, content, author, priority) VALUES (${title}, ${content}, ${author || "Admin"}, ${priority || "normal"})`;
      await audit(body.actor_id || "system", "create", "announcement", "", `new announcement: ${title}`);
      return NextResponse.json({ ok: true });
    }'''
if OLD1 in src:
    src = src.replace(OLD1, NEW1); fixes += 1; print("Fix 1: create_announcement")

# ─── Fix 2: resolve_grievance ─────────────────────────────────────────────────
OLD2 = '''    if (action === "resolve_grievance") {
      const { ref, status, resolution, assignedTo } = body;
      if (!ref)     await audit(body.actor_id || "system", "resolve", "grievance", String(body.id), `resolve grievance: ${body.resolution}`);
          await audit(body.actor_id || "system", "resolve", "grievance", String(body.id), `grievance resolved`);
      return NextResponse.json({ error: "Grievance ref required" }, { status: 400 });
      if (status === "resolved" || status === "closed") {
        await sql`UPDATE grievances SET status = ${status}, resolution = ${resolution || ""}, resolved_at = NOW() WHERE ref = ${ref}`;
      } else if (assignedTo) {
        await sql`UPDATE grievances SET assigned_to = ${assignedTo}, status = 'investigating' WHERE ref = ${ref}`;
      } else {
        await sql`UPDATE grievances SET status = ${status || "investigating"} WHERE ref = ${ref}`;
      }
      return NextResponse.json({ ok: true });
    }'''
NEW2 = '''    if (action === "resolve_grievance") {
      const { ref, status, resolution, assignedTo } = body;
      if (!ref) return NextResponse.json({ error: "Grievance ref required" }, { status: 400 });
      if (status === "resolved" || status === "closed") {
        await sql`UPDATE grievances SET status = ${status}, resolution = ${resolution || ""}, resolved_at = NOW() WHERE ref = ${ref}`;
      } else if (assignedTo) {
        await sql`UPDATE grievances SET assigned_to = ${assignedTo}, status = 'investigating' WHERE ref = ${ref}`;
      } else {
        await sql`UPDATE grievances SET status = ${status || "investigating"} WHERE ref = ${ref}`;
      }
      await audit(body.actor_id || "system", "resolve", "grievance", ref, `grievance resolved: ${status}`);
      return NextResponse.json({ ok: true });
    }'''
if OLD2 in src:
    src = src.replace(OLD2, NEW2); fixes += 1; print("Fix 2: resolve_grievance")

# ─── Fix 3: delete_announcement ──────────────────────────────────────────────
OLD3 = '''    if (action === "delete_announcement") {
      const { id } = body;
      if (!id)     await audit(body.actor_id || "system", "delete", "announcement", String(body.id), `delete announcement ${body.id}`);
          await audit(body.actor_id || "system", "delete", "announcement", String(body.id), `announcement deleted`);
      return NextResponse.json({ error: "Announcement id required" }, { status: 400 });
      await sql`DELETE FROM announcements WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }'''
NEW3 = '''    if (action === "delete_announcement") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "Announcement id required" }, { status: 400 });
      await sql`DELETE FROM announcements WHERE id = ${id}`;
      await audit(body.actor_id || "system", "delete", "announcement", String(id), `announcement deleted`);
      return NextResponse.json({ ok: true });
    }'''
if OLD3 in src:
    src = src.replace(OLD3, NEW3); fixes += 1; print("Fix 3: delete_announcement")

# ─── Fix 4: create_employee ───────────────────────────────────────────────────
OLD4 = '''      if (!id || !name)     await audit(body.actor_id || "system", "create", "employee", String(''), `new employee: ${body.name}`);
          await audit(body.actor_id || "system", "create", "employee", String(''), `employee: ${body.name}`);
      return NextResponse.json({ error: "ID and name required" }, { status: 400 });
      await sql`INSERT INTO employees'''
NEW4 = '''      if (!id || !name) return NextResponse.json({ error: "ID and name required" }, { status: 400 });
      await sql`INSERT INTO employees'''
if OLD4 in src:
    src = src.replace(OLD4, NEW4); fixes += 1; print("Fix 4: create_employee")
    # Also add audit after the INSERT (before return)
    src = src.replace(
        "      return NextResponse.json({ ok: true });\n    }\n\n    if (action === \"update_clearance\")",
        "      await audit(body.actor_id || \"system\", \"create\", \"employee\", id, `new employee: ${name}`);\n      return NextResponse.json({ ok: true });\n    }\n\n    if (action === \"update_clearance\")"
    )

# ─── Fix 5: update_clearance ──────────────────────────────────────────────────
OLD5 = '''      if (!ref || !item)     await audit(body.actor_id || "system", "update", "clearance", String(body.employee_id), `clearance: ${body.department} ${body.status}`);
          await audit(body.actor_id || "system", "update", "clearance", String(body.employee_id), `clearance: ${body.department}`);
      return NextResponse.json({ error: "Ref and item required" }, { status: 400 });'''
NEW5 = '''      if (!ref || !item) return NextResponse.json({ error: "Ref and item required" }, { status: 400 });'''
if OLD5 in src:
    src = src.replace(OLD5, NEW5); fixes += 1; print("Fix 5: update_clearance")

# ─── Fix 6: advance_application — wrong table + wrong field ──────────────────
OLD6 = '''      const { app_id, stage, status: appStatus } = body;
      await sql`UPDATE applications SET stage = ${stage}, status = ${appStatus || stage}, updated_at = NOW() WHERE id = ${app_id}`;'''
NEW6 = '''      const { id: app_id, stage, status: appStatus } = body;
      await sql`UPDATE job_applications SET stage = ${stage}, status = ${appStatus || "active"}, updated_at = NOW() WHERE id = ${app_id}`;'''
if OLD6 in src:
    src = src.replace(OLD6, NEW6); fixes += 1; print("Fix 6: advance_application table+field")

# ─── Fix 7: update_job_status — wrong field name ─────────────────────────────
OLD7 = '''      const { job_id, status } = body;
      await sql`UPDATE job_postings SET status = ${status}, updated_at = NOW() WHERE id = ${job_id}`;'''
NEW7 = '''      const { id: job_id, status } = body;
      await sql`UPDATE job_postings SET status = ${status}, updated_at = NOW() WHERE id = ${job_id}`;'''
if OLD7 in src:
    src = src.replace(OLD7, NEW7); fixes += 1; print("Fix 7: update_job_status field name")

# ─── Fix 8: Remove all duplicate audit() calls (double-audit pattern) ─────────
import re
# Pattern: two consecutive await audit() calls with same structure
before = len(src)
# Find and remove every second duplicate audit line
lines = src.split('\n')
cleaned = []
prev_audit = None
for line in lines:
    stripped = line.strip()
    if stripped.startswith('await audit('):
        if prev_audit == stripped:
            print(f"  Removing duplicate: {stripped[:60]}")
            continue  # skip duplicate
        prev_audit = stripped
    else:
        prev_audit = None
    cleaned.append(line)
src = '\n'.join(cleaned)
after_len = len(src)
print(f"Fix 8: Removed duplicate audit calls ({before - after_len} chars removed)")

f.write_text(src, "utf-8")
print(f"\nTotal fixes applied: {fixes}")
