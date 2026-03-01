import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

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
      const rows = await sql`SELECT * FROM announcements ORDER BY created_at DESC`;
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
      return NextResponse.json({ ok: true });
    }

    if (action === "reassign") {
      const { employeeId, newManagerId } = body;
      await sql`UPDATE employees SET manager_id = ${newManagerId} WHERE id = ${employeeId}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "policy") {
      const { category, config } = body;
      await sql`UPDATE policies SET config = ${JSON.stringify(config)}::jsonb, updated_at = NOW(), updated_by = 'admin' WHERE category = ${category}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "create_announcement") {
      const { title, content, author, priority } = body;
      if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });
      await sql`INSERT INTO announcements (title, content, author, priority) VALUES (${title}, ${content}, ${author || "Admin"}, ${priority || "normal"})`;
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
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_announcement") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "Announcement id required" }, { status: 400 });
      await sql`DELETE FROM announcements WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }


    if (action === "create_employee") {
      const { id, name, nameAr, position, department, email, phone, joinDate, grade, nationality, managerId, basicSalary, housingAllowance, transportAllowance, pin } = body;
      if (!id || !name) return NextResponse.json({ error: "ID and name required" }, { status: 400 });
      await sql`INSERT INTO employees (id, name, name_ar, position, department, email, phone, join_date, grade, nationality, manager_id, basic_salary, housing_allowance, transport_allowance, pin) VALUES (${id}, ${name}, ${nameAr || ""}, ${position || ""}, ${department || ""}, ${email || ""}, ${phone || ""}, ${joinDate || new Date().toISOString().split("T")[0]}, ${grade || ""}, ${nationality || "Saudi"}, ${managerId || null}, ${Number(basicSalary) || 0}, ${Number(housingAllowance) || 0}, ${Number(transportAllowance) || 0}, ${pin || "1234"})`;
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

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
