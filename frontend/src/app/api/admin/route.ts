import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);




async function audit(actor: string, action: string, entity_type: string, entity_id: string, details: string) {
  try {
    await sql`INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details) VALUES (${actor}, ${action}, ${entity_type}, ${entity_id}, ${details})`;
  } catch (e) { console.error("audit log error:", e); }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") || "overview";

  try {
    if (section === "overview") {
      const [emps] = await sql`SELECT COUNT(*) as count FROM employees`;
      const depts = await sql`SELECT department, COUNT(*) as count FROM employees GROUP BY department ORDER BY count DESC`;
      const [leaves] = await sql`SELECT COUNT(*) as count FROM leave_requests WHERE status='pending'`;
      const [loans] = await sql`SELECT COUNT(*) as count FROM loans WHERE status IN ('active','pending')`;
      const [docs] = await sql`SELECT COUNT(*) as count FROM document_requests WHERE status IN ('requested','processing')`;
      const [anns] = await sql`SELECT COUNT(*) as count FROM announcements`;
      const [grievs] = await sql`SELECT COUNT(*) as count FROM grievances WHERE status NOT IN ('resolved','closed')`;
      const [travel] = await sql`SELECT COUNT(*) as count FROM travel_requests WHERE status='pending'`;
      return NextResponse.json({
        totalEmployees: Number(emps.count),
        departments: depts.map((d: any) => ({ name: d.department, count: Number(d.count) })),
        pendingLeaves: Number(leaves.count),
        activeLoans: Number(loans.count),
        pendingDocuments: Number(docs.count),
        announcements: Number(anns.count),
        openGrievances: Number(grievs.count),
        pendingTravel: Number(travel.count),
      });
    }

    if (section === "employees") {
      const rows = await sql`SELECT * FROM employees ORDER BY id`;
      const result = [];
      for (const r of rows) {
        const mgr = r.manager_id ? (await sql`SELECT name FROM employees WHERE id = ${r.manager_id}`)[0] : null;
        const reports = await sql`SELECT id, name FROM employees WHERE manager_id = ${r.id}`;
        result.push({
          id: r.id, name: r.name, nameAr: r.name_ar, position: r.position, department: r.department,
          email: r.email, phone: r.phone, joinDate: r.join_date, grade: r.grade,
          managerId: r.manager_id, managerName: mgr?.name || null, nationality: r.nationality,
          annualLeave: r.annual_leave, sickLeave: r.sick_leave, emergencyLeave: r.emergency_leave, studyLeave: r.study_leave,
          salary: r.basic_salary, housing: r.housing_allowance, transport: r.transport_allowance,
          totalSalary: Number(r.basic_salary) + Number(r.housing_allowance) + Number(r.transport_allowance),
          directReports: reports.map((rr: any) => ({ id: rr.id, name: rr.name })),
          isManager: reports.length > 0,
        });
      }
      return NextResponse.json(result);
    }

    if (section === "leaves") {
      const rows = await sql`SELECT lr.*, e.name as employee_name, e.department, m.name as approver_name FROM leave_requests lr JOIN employees e ON lr.employee_id = e.id LEFT JOIN employees m ON lr.approver_id = m.id ORDER BY lr.created_at DESC`;
      return NextResponse.json(rows);
    }

    if (section === "loans") {
      const rows = await sql`SELECT l.*, e.name as employee_name, e.department FROM loans l JOIN employees e ON l.employee_id = e.id ORDER BY l.created_at DESC`;
      return NextResponse.json(rows);
    }

    if (section === "documents") {
      const rows = await sql`SELECT d.*, e.name as employee_name FROM document_requests d JOIN employees e ON d.employee_id = e.id ORDER BY d.created_at DESC`;
      return NextResponse.json(rows);
    }

    if (section === "announcements") {
      const rows = await sql`SELECT a.*, COALESCE(a.announce_on_login, FALSE) as announce_on_login, COALESCE(a.is_active, TRUE) as is_active FROM announcements a ORDER BY a.created_at DESC`;
      return NextResponse.json(rows);
    }

    if (section === "grievances") {
      const rows = await sql`SELECT g.*, e.name as employee_name, e.department FROM grievances g JOIN employees e ON g.employee_id = e.id ORDER BY g.submitted_at DESC`;
      return NextResponse.json(rows);
    }

    if (section === "policies") {
      const rows = await sql`SELECT * FROM policies ORDER BY category`;
      const result: Record<string, any> = {};
      for (const r of rows) {
        result[r.category] = { ...r.config, _id: r.id, _updated_at: r.updated_at, _updated_by: r.updated_by };
      }
      return NextResponse.json(result);
    }


    if (section === "letters") {
      const rows = await sql`SELECT l.*, e.name as employee_name, e.department FROM letters l JOIN employees e ON l.employee_id = e.id ORDER BY l.created_at DESC`;
      return NextResponse.json(rows);
    }

    if (section === "contracts") {
      const rows = await sql`SELECT c.*, e.name as employee_name, e.department, e.position FROM contracts c JOIN employees e ON c.employee_id = e.id ORDER BY c.start_date DESC`;
      return NextResponse.json(rows);
    }

    if (section === "assets") {
      const rows = await sql`SELECT a.*, e.name as assigned_name FROM assets a LEFT JOIN employees e ON a.assigned_to = e.id ORDER BY a.ref`;
      return NextResponse.json(rows);
    }

    if (section === "shifts") {
      const shifts = await sql`SELECT * FROM shifts WHERE status='active' ORDER BY start_time`;
      const assignments = await sql`SELECT es.*, e.name, e.department, s.name as shift_name FROM employee_shifts es JOIN employees e ON es.employee_id = e.id JOIN shifts s ON es.shift_id = s.id WHERE es.end_date IS NULL ORDER BY e.name`;
      return NextResponse.json({ shifts, assignments });
    }

    if (section === "iqama") {
      const rows = await sql`SELECT iv.*, e.name as employee_name, e.department FROM iqama_visa iv JOIN employees e ON iv.employee_id = e.id ORDER BY iv.expiry_date`;
      return NextResponse.json(rows);
    }

    if (section === "exits") {
      const rows = await sql`SELECT er.*, e.name as employee_name, e.department, e.position FROM exit_requests er JOIN employees e ON er.employee_id = e.id ORDER BY er.initiated_at DESC`;
      return NextResponse.json(rows);
    }

    if (section === "reports") {
      const [headcount] = await sql`SELECT COUNT(*) as count FROM employees`;
      const depts = await sql`SELECT department, COUNT(*) as count, SUM(basic_salary + housing_allowance + transport_allowance) as cost FROM employees GROUP BY department ORDER BY count DESC`;
      const nationalities = await sql`SELECT nationality, COUNT(*) as count FROM employees GROUP BY nationality ORDER BY count DESC`;
      const [leaveStats] = await sql`SELECT COALESCE(SUM(CASE WHEN status='approved' THEN days ELSE 0 END),0) as approved, COALESCE(SUM(CASE WHEN status='pending' THEN days ELSE 0 END),0) as pending, COUNT(*) as total FROM leave_requests`;
      const [payroll] = await sql`SELECT SUM(basic_salary + housing_allowance + transport_allowance) as total FROM employees`;
      const [exits] = await sql`SELECT COUNT(*) as count FROM exit_requests WHERE status IN ('initiated','in_progress')`;
      const [expiring] = await sql`SELECT COUNT(*) as count FROM iqama_visa WHERE expiry_date <= (CURRENT_DATE + INTERVAL '90 days')::TEXT AND status != 'expired'`;
      return NextResponse.json({
        totalEmployees: Number(headcount.count),
        departments: depts,
        nationalities,
        leaveStats: { approved: Number(leaveStats.approved), pending: Number(leaveStats.pending), total: Number(leaveStats.total) },
        totalPayroll: Number(payroll.total || 0),
        activeExits: Number(exits.count),
        expiringDocs: Number(expiring.count),
      });
    }

    if (section === "audit_log") {
      try {
        const rows = await sql`SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 100`;
        return NextResponse.json({ entries: rows });
      } catch {
        return NextResponse.json({ entries: [] });
      }
    }


    if (section === "recruitment") {
      const jobs = await sql`SELECT jp.*, (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as app_count FROM job_postings jp ORDER BY created_at DESC`;
      const apps = await sql`SELECT a.*, j.title as job_title, j.department as job_department FROM job_applications a LEFT JOIN job_postings j ON a.job_id = j.id ORDER BY a.applied_at DESC`;
      const stats = await sql`SELECT COUNT(*) as total, SUM(CASE WHEN status='open' THEN 1 ELSE 0 END) as open_count FROM job_postings`;
      return NextResponse.json({ jobs, applications: apps, stats: stats[0] });
    }


    if (section === "offer_letters") {
      const offers = await sql`SELECT ol.*, ja.candidate_email, ja.candidate_phone FROM offer_letters ol LEFT JOIN job_applications ja ON ol.application_id = ja.id ORDER BY ol.created_at DESC`;
      return NextResponse.json({ offers });
    }

    if (section === "onboarding") {
      const checklists = await sql`SELECT * FROM onboarding_checklists ORDER BY created_at DESC`;
      const tasks = await sql`SELECT * FROM onboarding_tasks ORDER BY checklist_id, sort_order`;
      return NextResponse.json({ checklists, tasks });
    }
    if (section === "geofences") {
      const fences = await sql`SELECT * FROM geofences ORDER BY name`;
      return NextResponse.json({ geofences: fences });
    }

    if (section === "interviews") {
      const interviews = await sql`SELECT * FROM interviews ORDER BY started_at DESC`;
      const templates = await sql`SELECT * FROM interview_templates ORDER BY created_at DESC`;
      return NextResponse.json({ interviews: interviews, templates: (templates as any[]).map((t: any) => ({ ...t, questions: typeof t.questions === 'string' ? JSON.parse(t.questions) : t.questions })) });
    }

    
    
    if (section === "exams") {
      const exams = await sql`SELECT ce.*, tc.title as course_title,
        (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = ce.id) as question_count,
        (SELECT COUNT(*) FROM exam_attempts ea WHERE ea.exam_id = ce.id) as attempt_count,
        (SELECT ROUND(AVG(ea.score)::NUMERIC, 1) FROM exam_attempts ea WHERE ea.exam_id = ce.id AND ea.score IS NOT NULL) as avg_score
        FROM course_exams ce LEFT JOIN training_courses tc ON ce.course_id = tc.id ORDER BY ce.id`;
      const questions = await sql`SELECT eq.*, ce.title as exam_title FROM exam_questions eq JOIN course_exams ce ON eq.exam_id = ce.id ORDER BY eq.exam_id, eq.sort_order`;
      const attempts = await sql`SELECT ea.*, ce.title as exam_title FROM exam_attempts ea JOIN course_exams ce ON ea.exam_id = ce.id ORDER BY ea.id DESC LIMIT 50`;
      return NextResponse.json({ exams, questions, attempts });
    }

    if (section === "training") {
      const courses = await sql`SELECT tc.*, 
        (SELECT COUNT(*) FROM employee_trainings et WHERE et.course_id = tc.id) as enrolled_count,
        (SELECT COUNT(*) FROM employee_trainings et WHERE et.course_id = tc.id AND et.status = 'completed') as completed_count
        FROM training_courses tc ORDER BY mandatory DESC, title`;
      const enrollments = await sql`SELECT et.*, e.name as employee_name, e.department, tc.title as course_title 
        FROM employee_trainings et 
        JOIN employees e ON et.employee_id = e.id 
        JOIN training_courses tc ON et.course_id = tc.id 
        ORDER BY et.enrollment_date DESC`;
      const materials = await sql`SELECT cm.*, tc.title as course_title FROM course_materials cm JOIN training_courses tc ON cm.course_id = tc.id ORDER BY cm.course_id, cm.sort_order`;
      const exams_brief = await sql`SELECT ce.id, ce.course_id, ce.title, ce.passing_score, ce.is_active, (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = ce.id) as question_count FROM course_exams ce ORDER BY ce.id`;
      return NextResponse.json({ courses, enrollments, materials, exams: exams_brief });
    }

    if (section === "workflows") {
      const workflows = await sql`SELECT * FROM approval_workflows ORDER BY name`;
      const requests = await sql`SELECT ar.*, aw.name as workflow_name, aw.description as workflow_desc FROM approval_requests ar JOIN approval_workflows aw ON ar.workflow_id = aw.id ORDER BY ar.created_at DESC LIMIT 50`;
      return NextResponse.json({ workflows, requests });
    }

    // Dashboard metrics
    if (section === "dashboard") {
      const metrics = await sql`SELECT metric, period, value FROM dashboard_metrics ORDER BY period`;
      const employees = await sql`SELECT department, nationality, COUNT(*) as cnt FROM employees GROUP BY department, nationality`;
      const leaveBalance = await sql`SELECT e.department, SUM(e.annual_leave) as total_annual, SUM(e.sick_leave) as total_sick FROM employees e GROUP BY e.department`;
      const recentHires = await sql`SELECT id, name, position, department, join_date FROM employees ORDER BY join_date DESC LIMIT 5`;
      const payrollSummary = await sql`SELECT ref, period_label as period, total_gross, total_deductions, total_net, status FROM payroll_runs ORDER BY id DESC LIMIT 6`;
      return NextResponse.json({ metrics, employees, leaveBalance, recentHires, payrollSummary });
    }

    // File uploads
    if (section === "uploads") {
      const empFilter = searchParams.get("employee_id");
      const uploads = empFilter
        ? await sql`SELECT u.*, e.name as employee_name FROM uploads u LEFT JOIN employees e ON u.employee_id = e.id WHERE u.employee_id = ${empFilter} ORDER BY u.created_at DESC`
        : await sql`SELECT u.*, e.name as employee_name FROM uploads u LEFT JOIN employees e ON u.employee_id = e.id ORDER BY u.created_at DESC LIMIT 50`;
      const stats = await sql`SELECT category, COUNT(*) as cnt, SUM(size_bytes) as total_size FROM uploads GROUP BY category`;
      return NextResponse.json({ uploads, stats });
    }

    return NextResponse.json([]);
  } catch (e: any) {
    console.error("Admin API error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "approve";

    if (action === "approve") {
      const { type, ref, decision } = body;
      if (type === "leave") {
        await sql`UPDATE leave_requests SET status = ${decision}, updated_at = NOW() WHERE ref = ${ref}`;
      } else if (type === "loan") {
        await sql`UPDATE loans SET status = ${decision} WHERE ref = ${ref}`;
      } else if (type === "document") {
        await sql`UPDATE document_requests SET status = ${decision} WHERE ref = ${ref}`;
      } else if (type === "travel") {
        await sql`UPDATE travel_requests SET status = ${decision} WHERE ref = ${ref}`;
      }
          await audit(body.actor_id || "system", "approve", "body.type", String(body.ref), `${body.type} ${body.decision}: ${body.ref}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "reassign") {
      const { employeeId, newManagerId } = body;
      await sql`UPDATE employees SET manager_id = ${newManagerId} WHERE id = ${employeeId}`;
          await audit(body.actor_id || "system", "reassign", "leave", String(body.ref), `reassign leave ${body.ref} to ${body.new_approver}`);
          await audit(body.actor_id || "system", "reassign", "leave", String(body.ref), `reassign leave ${body.ref}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "policy") {
      const { category, config } = body;
      await sql`UPDATE policies SET config = ${JSON.stringify(config)}::jsonb, updated_at = NOW(), updated_by = 'admin' WHERE category = ${category}`;
          await audit(body.actor_id || "system", "update_policy", "policy", String(body.category), `policy update: ${body.category}`);
          await audit(body.actor_id || "system", "update_policy", "policy", String(body.category), `policy: ${body.category}`);
      return NextResponse.json({ ok: true });
    }


    if (action === "acknowledge_announcement") {
      const { announcement_id, employee_id } = body;
      await sql`INSERT INTO announcement_reads (announcement_id, employee_id, read_at, acknowledged, acknowledged_at)
        VALUES (${announcement_id}, ${employee_id}, NOW(), TRUE, NOW())
        ON CONFLICT (announcement_id, employee_id) DO UPDATE SET acknowledged = TRUE, acknowledged_at = NOW()`;
      await sql`UPDATE announcements SET acknowledged_count = (
        SELECT COUNT(*) FROM announcement_reads WHERE announcement_id = ${announcement_id} AND acknowledged = TRUE
      ) WHERE id = ${announcement_id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_announce_login") {
      const { id, value } = body;
      await sql`UPDATE announcements SET announce_on_login = ${value} WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_announcement_active") {
      const { id, value } = body;
      await sql`UPDATE announcements SET is_active = ${value} WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "get_announcement_reads") {
      const { id } = body;
      const reads = await sql`SELECT ar.*, e.name as employee_name, e.department
        FROM announcement_reads ar JOIN employees e ON e.id = ar.employee_id
        WHERE ar.announcement_id = ${id} ORDER BY ar.read_at DESC`;
      const total = await sql`SELECT COUNT(*) as c FROM employees`;
      return NextResponse.json({
        reads: reads,
        total_employees: (total as any[])[0]?.c || 0,
        acknowledged: (reads as any[]).filter((r: any) => r.acknowledged).length,
      });
    }

    if (action === "create_announcement") {
      const { title, content, author, priority } = body;
      if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });
      await sql`INSERT INTO announcements (title, content, author, priority) VALUES (${title}, ${content}, ${author || "Admin"}, ${priority || "normal"})`;
      await audit(body.actor_id || "system", "create", "announcement", "", `new announcement: ${title}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "resolve_grievance") {
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
    }

    if (action === "delete_announcement") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "Announcement id required" }, { status: 400 });
      await sql`DELETE FROM announcements WHERE id = ${id}`;
      await audit(body.actor_id || "system", "delete", "announcement", String(id), `announcement deleted`);
      return NextResponse.json({ ok: true });
    }


    if (action === "create_employee") {
      const { id, name, nameAr, position, department, email, phone, joinDate, grade, nationality, managerId, basicSalary, housingAllowance, transportAllowance, pin } = body;
      if (!id || !name) return NextResponse.json({ error: "ID and name required" }, { status: 400 });
      await sql`INSERT INTO employees (id, name, name_ar, position, department, email, phone, join_date, grade, nationality, manager_id, basic_salary, housing_allowance, transport_allowance, pin) VALUES (${id}, ${name}, ${nameAr || ""}, ${position || ""}, ${department || ""}, ${email || ""}, ${phone || ""}, ${joinDate || new Date().toISOString().split("T")[0]}, ${grade || ""}, ${nationality || "Saudi"}, ${managerId || null}, ${Number(basicSalary) || 0}, ${Number(housingAllowance) || 0}, ${Number(transportAllowance) || 0}, ${pin || "1234"})`;
      await audit(body.actor_id || "system", "create", "employee", id, `new employee: ${name}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "update_clearance") {
      const { ref, item, status } = body;
      if (!ref || !item) return NextResponse.json({ error: "Ref and item required" }, { status: 400 });
      const [row] = await sql`SELECT clearance_status FROM exit_requests WHERE ref = ${ref}`;
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const clearance = typeof row.clearance_status === "string" ? JSON.parse(row.clearance_status) : row.clearance_status;
      clearance[item] = status;
      const allCleared = Object.values(clearance).every((v: any) => v === "cleared");
      await sql`UPDATE exit_requests SET clearance_status = ${JSON.stringify(clearance)}::jsonb, status = ${allCleared ? "cleared" : "in_progress"} WHERE ref = ${ref}`;
      return NextResponse.json({ ok: true });
    }


    if (action === "create_job") {
      const { title, department, description, requirements, salary_range, location, employment_type } = body;
      await sql`INSERT INTO job_postings (ref, title, department, description, requirements, salary_range, location, employment_type, status)
        VALUES ('JOB-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('job_postings_id_seq')::text, 3, '0'), ${title}, ${department}, ${description || ''}, ${requirements || ''}, ${salary_range || ''}, ${location || 'Riyadh'}, ${employment_type || 'full_time'}, 'open')`;
          await audit(body.actor_id || "system", "create", "job", String(''), `new job: ${body.title}`);
          await audit(body.actor_id || "system", "create", "job", String(''), `job: ${body.title}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "update_job_status") {
      const { id: job_id, status } = body;
      await sql`UPDATE job_postings SET status = ${status}, updated_at = NOW() WHERE id = ${job_id}`;
          await audit(body.actor_id || "system", "update", "job", String(body.id), `job status: ${body.status}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "advance_application") {
      const { id: app_id, stage, status: appStatus } = body;
      await sql`UPDATE job_applications SET stage = ${stage}, status = ${appStatus || "active"}, updated_at = NOW() WHERE id = ${app_id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "create_geofence") {
      const { name, latitude, longitude, radius_meters, address, description } = body;
      await sql`INSERT INTO geofences (name, description, latitude, longitude, radius_meters, address) VALUES (${name}, ${description || ''}, ${latitude}, ${longitude}, ${radius_meters || 200}, ${address || ''})`;
      return NextResponse.json({ ok: true });
    }

    if (action === "update_geofence") {
      const { id, name, latitude, longitude, radius_meters, address, is_active } = body;
      await sql`UPDATE geofences SET name = COALESCE(${name || null}, name), latitude = COALESCE(${latitude || null}, latitude), longitude = COALESCE(${longitude || null}, longitude), radius_meters = COALESCE(${radius_meters || null}, radius_meters), address = COALESCE(${address || null}, address), is_active = COALESCE(${is_active !== undefined ? is_active : null}, is_active) WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }




    if (action === "create_interview") {
      const { candidate_name, position, stage } = body;
      const count = await sql`SELECT COUNT(*) as c FROM interviews`;
      const ref = `INT-2026-${String(Number((count as any[])[0].c) + 1).padStart(3, '0')}`;
      await sql`INSERT INTO interviews (ref, candidate_name, position, interviewer_id, stage, total_questions, status)
        VALUES (${ref}, ${candidate_name}, ${position}, 'E005', ${stage || 'hr_screening'}, 5, 'in_progress')`;
          await audit(body.actor_id || "system", "create", "interview", String(''), `interview: ${body.candidate_name}`);
      return NextResponse.json({ ok: true, ref });
    }

    if (action === "save_interview_template") {
      const { name, stage, questions } = body;
      const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      await sql`CREATE TABLE IF NOT EXISTS interview_templates (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, stage TEXT NOT NULL,
        questions JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      )`;
      await sql`INSERT INTO interview_templates (id, name, stage, questions)
        VALUES (${id}, ${name}, ${stage}, ${JSON.stringify(questions)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET name = ${name}, stage = ${stage}, questions = ${JSON.stringify(questions)}::jsonb, updated_at = NOW()`;
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_interview_template") {
      const { id } = body;
      await sql`DELETE FROM interview_templates WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "create_asset") {
      const { name, asset_type, serial_number, assigned_to, condition } = body;
      const ref = `AST-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
      await sql`INSERT INTO assets (ref, name, asset_type, serial_number, assigned_to, condition, status, assigned_date)
        VALUES (${ref}, ${name}, ${asset_type}, ${serial_number || ''}, ${assigned_to || null}, ${condition || 'good'}, ${assigned_to ? 'assigned' : 'available'}, ${assigned_to ? new Date().toISOString().slice(0,10) : null})`;
          await audit(body.actor_id || "system", "create", "asset", String(''), `asset: ${body.asset_name}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "return_asset") {
      const { ref } = body;
      await sql`UPDATE assets SET status = 'available', assigned_to = NULL, assigned_date = NULL WHERE ref = ${ref}`;
          await audit(body.actor_id || "system", "return", "asset", String(body.id), `asset returned`);
      return NextResponse.json({ ok: true });
    }

    if (action === "create_shift") {
      const { name, start_time, end_time, break_minutes, is_night_shift, differential_pct } = body;
      await sql`INSERT INTO shifts (name, start_time, end_time, break_minutes, is_night_shift, differential_pct)
        VALUES (${name}, ${start_time}, ${end_time}, ${break_minutes || 60}, ${is_night_shift || false}, ${differential_pct || 0})`;
          await audit(body.actor_id || "system", "create", "shift", String(''), `shift: ${body.name}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "assign_shift") {
      const { employee_id, shift_id, effective_from } = body;
      await sql`INSERT INTO employee_shifts (employee_id, shift_id, effective_from) VALUES (${employee_id}, ${shift_id}, ${effective_from || new Date().toISOString().slice(0,10)})
        ON CONFLICT (employee_id) DO UPDATE SET shift_id = ${shift_id}, effective_from = ${effective_from || new Date().toISOString().slice(0,10)}`;
          await audit(body.actor_id || "system", "assign", "shift", String(body.shift_id), `assign shift to ${body.employee_id}`);
          await audit(body.actor_id || "system", "assign", "shift", String(body.shift_id), `shift assigned`);
      return NextResponse.json({ ok: true });
    }

    if (action === "create_contract") {
      const { employee_id, contract_type, start_date, end_date, salary, probation_end } = body;
      await sql`INSERT INTO contracts (employee_id, contract_type, start_date, end_date, salary, probation_end, status)
        VALUES (${employee_id}, ${contract_type || 'unlimited'}, ${start_date}, ${end_date || null}, ${salary || 0}, ${probation_end || null}, 'active')`;
          await audit(body.actor_id || "system", "create", "contract", String(''), `contract for ${body.employee_id}`);
          await audit(body.actor_id || "system", "create", "contract", String(''), `contract: ${body.employee_id}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "renew_contract") {
      const { id, new_end_date, new_salary } = body;
      await sql`UPDATE contracts SET end_date = ${new_end_date}, salary = COALESCE(${new_salary}::numeric, salary), status = 'active' WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "approve_exit") {
      const { ref, decision } = body;
      const status = decision === 'approved' ? 'approved' : 'rejected';
      await sql`UPDATE exit_requests SET status = ${status} WHERE ref = ${ref}`;
          await audit(body.actor_id || "system", "approve", "exit", String(body.id), `exit approved`);
      return NextResponse.json({ ok: true });
    }

    if (action === "renew_iqama") {
      const { id, new_expiry, new_number } = body;
      await sql`UPDATE iqama_visa SET expiry_date = ${new_expiry}, document_number = COALESCE(${new_number}, document_number), status = 'active' WHERE id = ${id}`;
          await audit(body.actor_id || "system", "renew", "iqama", String(body.employee_id), `iqama renewed`);
      return NextResponse.json({ ok: true });
    }

    if (action === "create_workflow") {
      const { name, entity_type, description, steps } = body;
      await sql`INSERT INTO approval_workflows (name, entity_type, description, steps)
        VALUES (${name}, ${entity_type}, ${description || ''}, ${JSON.stringify(steps)}::jsonb)`;
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_workflow") {
      const { id, is_active } = body;
      await sql`UPDATE approval_workflows SET is_active = ${is_active} WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_workflow") {
      const { id } = body;
      await sql`DELETE FROM approval_workflows WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    
    
    if (action === "create_exam") {
      const { course_id, title, description, passing_score, time_limit_minutes, max_attempts, exam_type } = body;
      const [row] = await sql`INSERT INTO course_exams (course_id, title, description, passing_score, time_limit_minutes, max_attempts, exam_type)
        VALUES (\${course_id || null}, \${title}, \${description || ''}, \${passing_score || 70}, \${time_limit_minutes || 30}, \${max_attempts || 3}, \${exam_type || 'training'}) RETURNING id`;
          await audit(body.actor_id || "system", "create", "exam", String(''), `exam: ${body.title}`);
      return NextResponse.json({ ok: true, id: row.id });
    }

    if (action === "delete_exam") {
      const { id } = body;
      await sql`DELETE FROM exam_attempts WHERE exam_id = \${id}`;
      await sql`DELETE FROM exam_questions WHERE exam_id = \${id}`;
      await sql`DELETE FROM course_exams WHERE id = \${id}`;
          await audit(body.actor_id || "system", "delete", "exam", String(body.id), `exam deleted`);
      return NextResponse.json({ ok: true });
    }

    if (action === "add_exam_question") {
      const { exam_id, question, options, correct_answer, explanation, question_type } = body;
      await sql`INSERT INTO exam_questions (exam_id, question, question_type, options, correct_answer, explanation) 
        VALUES (\${exam_id}, \${question}, \${question_type || 'mcq'}, \${JSON.stringify(options || [])}::JSONB, \${correct_answer}, \${explanation || ''})`;
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_exam_question") {
      const { id } = body;
      await sql`DELETE FROM exam_questions WHERE id = \${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_exam") {
      const { id } = body;
      await sql`UPDATE course_exams SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = \${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "add_course_material") {
      const { course_id, title, type, url, content } = body;
      await sql`INSERT INTO course_materials (course_id, title, type, url, content) VALUES (\${course_id}, \${title}, \${type || 'link'}, \${url || null}, \${content || null})`;
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_course_material") {
      const { id } = body;
      await sql`DELETE FROM course_materials WHERE id = \${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "create_course") {
      const { title, description, provider, duration_hours, category, mandatory, start_date, end_date, schedule, location, max_seats, materials_url, syllabus } = body;
      await sql`INSERT INTO training_courses (title, description, provider, duration_hours, category, mandatory, status, start_date, end_date, schedule, location, max_seats, materials_url, syllabus) 
        VALUES (${title}, ${description || ''}, ${provider || 'Internal'}, ${duration_hours || 4}, ${category || 'general'}, ${mandatory ? 1 : 0}, 'available', ${start_date || null}, ${end_date || null}, ${schedule || null}, ${location || null}, ${max_seats || 0}, ${materials_url || null}, ${syllabus || null})`;
          await audit(body.actor_id || "system", "create", "course", String(''), `course: ${body.name}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "update_course") {
      const { id, title, description, provider, duration_hours, category, mandatory, status, start_date, end_date, schedule, location, max_seats, materials_url, syllabus } = body;
      await sql`UPDATE training_courses SET title=${title}, description=${description}, provider=${provider}, 
        duration_hours=${duration_hours}, category=${category}, mandatory=${mandatory ? 1 : 0}, status=${status},
        start_date=${start_date || null}, end_date=${end_date || null}, schedule=${schedule || null}, location=${location || null},
        max_seats=${max_seats || 0}, materials_url=${materials_url || null}, syllabus=${syllabus || null} WHERE id=${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_course") {
      const { id } = body;
      await sql`DELETE FROM employee_trainings WHERE course_id = ${id}`;
      await sql`DELETE FROM training_courses WHERE id = ${id}`;
          await audit(body.actor_id || "system", "delete", "course", String(body.id), `course deleted`);
      return NextResponse.json({ ok: true });
    }

    if (action === "enroll_employee") {
      const { employee_id, course_id } = body;
      const existing = await sql`SELECT id FROM employee_trainings WHERE employee_id=${employee_id} AND course_id=${course_id} AND status != 'dropped'`;
      if (existing.length > 0)     await audit(body.actor_id || "system", "enroll", "training", String(body.course_id), `enroll ${body.employee_id}`);
          await audit(body.actor_id || "system", "enroll", "training", String(body.course_id), `enroll: ${body.employee_id}`);
      return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
      await sql`INSERT INTO employee_trainings (employee_id, course_id) VALUES (${employee_id}, ${course_id})`;
      return NextResponse.json({ ok: true });
    }

    if (action === "complete_enrollment") {
      const { id, score } = body;
      const certRef = `CERT-${Date.now()}`;
      await sql`UPDATE employee_trainings SET status='completed', completion_date=CURRENT_DATE::TEXT, score=${score || null}, certificate_ref=${certRef} WHERE id=${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "drop_enrollment") {
      const { id } = body;
      await sql`UPDATE employee_trainings SET status='dropped' WHERE id=${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_geofence") {
      const { id } = body;
      await sql`DELETE FROM geofences WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }


    
    if (action === "apply_to_job") {
      const { job_id, candidate_name, candidate_email, candidate_phone, source } = body;
      const [{id}] = await sql`INSERT INTO job_applications (ref, job_id, candidate_name, candidate_email, candidate_phone, source) VALUES (${'`APP-`' + ' || LPAD(CAST((SELECT COALESCE(MAX(id),0)+1 FROM job_applications) AS TEXT), 3, `0`) '}, ${Number(job_id)}, ${candidate_name}, ${candidate_email}, ${candidate_phone}, ${source || 'direct'}) RETURNING id`;
      await audit(body.actor_id || "system", "create", "application", String(id), `application: ${candidate_name}`);
      return NextResponse.json({ ok: true, id });
    }

    if (action === "advance_application") {
      const { id, stage } = body;
      await sql`UPDATE job_applications SET stage = ${stage}, updated_at = NOW() WHERE id = ${Number(id)}`;
      await audit(body.actor_id || "system", "advance", "application", String(id), `stage: ${stage}`);
      return NextResponse.json({ ok: true });
    }

    if (action === "reject_application") {
      const { id, reason } = body;
      await sql`UPDATE job_applications SET stage = 'rejected', status = 'closed', notes = ${reason || 'Rejected'}, updated_at = NOW() WHERE id = ${Number(id)}`;
      await audit(body.actor_id || "system", "reject", "application", String(id), `rejected`);
      return NextResponse.json({ ok: true });
    }

    if (action === "create_offer") {
      const { application_id, position, department, offered_salary, housing_allowance, transport_allowance, start_date, contract_type } = body;
      const [app] = await sql`SELECT candidate_name FROM job_applications WHERE id = ${Number(application_id)}`;
      const ref = 'OFR-2026-' + String(Date.now()).slice(-3);
      await sql`INSERT INTO offer_letters (ref, application_id, candidate_name, position, department, offered_salary, housing_allowance, transport_allowance, start_date, contract_type, created_by)
        VALUES (${ref}, ${Number(application_id)}, ${app?.candidate_name || body.candidate_name}, ${position}, ${department}, ${Number(offered_salary)}, ${Number(housing_allowance || 0)}, ${Number(transport_allowance || 0)}, ${start_date}, ${contract_type || 'permanent'}, ${body.actor_id || 'system'})`;
      await sql`UPDATE job_applications SET stage = 'offer' WHERE id = ${Number(application_id)}`;
      await audit(body.actor_id || "system", "create", "offer_letter", ref, `offer for ${app?.candidate_name}`);
      return NextResponse.json({ ok: true, ref });
    }

    if (action === "send_offer") {
      const { id } = body;
      await sql`UPDATE offer_letters SET status = 'sent', sent_at = NOW() WHERE id = ${Number(id)}`;
      await audit(body.actor_id || "system", "send", "offer_letter", String(id), `offer sent`);
      return NextResponse.json({ ok: true });
    }

    if (action === "accept_offer") {
      const { id } = body;
      await sql`UPDATE offer_letters SET status = 'accepted', accepted_at = NOW() WHERE id = ${Number(id)}`;
      const [offer] = await sql`SELECT application_id, candidate_name, position, department, start_date FROM offer_letters WHERE id = ${Number(id)}`;
      await sql`UPDATE job_applications SET stage = 'hired', status = 'closed' WHERE id = ${Number(offer?.application_id)}`;
      await audit(body.actor_id || "system", "accept", "offer_letter", String(id), `offer accepted`);
      return NextResponse.json({ ok: true });
    }

    if (action === "reject_offer") {
      const { id, reason } = body;
      await sql`UPDATE offer_letters SET status = 'rejected', rejected_at = NOW(), rejection_reason = ${reason || ''} WHERE id = ${Number(id)}`;
      await audit(body.actor_id || "system", "reject", "offer_letter", String(id), `offer rejected`);
      return NextResponse.json({ ok: true });
    }

    if (action === "complete_onboarding_task") {
      const { task_id, completed_by } = body;
      await sql`UPDATE onboarding_tasks SET status = 'completed', completed_at = NOW(), completed_by = ${completed_by || 'system'} WHERE id = ${Number(task_id)}`;
      const [task] = await sql`SELECT checklist_id FROM onboarding_tasks WHERE id = ${Number(task_id)}`;
      if (task) {
        const [cnt] = await sql`SELECT COUNT(*) as c FROM onboarding_tasks WHERE checklist_id = ${task.checklist_id} AND status = 'completed'`;
        await sql`UPDATE onboarding_checklists SET completed_count = ${Number(cnt?.c || 0)} WHERE id = ${task.checklist_id}`;
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "create_onboarding") {
      const { application_id, candidate_name, position, department, start_date, hr_assignee } = body;
      return NextResponse.json({ ok: true, message: "Use the onboarding template system" });
    }


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

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
