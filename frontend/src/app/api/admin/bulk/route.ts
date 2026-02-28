import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === "bulk_approve_leaves") {
      const { ids, approver_id } = data;
      let approved = 0;
      for (const id of ids) {
        const result = await sql`UPDATE leave_requests SET status = 'approved', approved_by = ${approver_id || 'admin'} WHERE id = ${id} AND status = 'pending'`;
        if (result) approved++;
      }
      return NextResponse.json({ approved, total: ids.length });
    }

    if (action === "bulk_approve_expenses") {
      const { ids, approver_id } = data;
      let approved = 0;
      for (const id of ids) {
        await sql`UPDATE expenses SET status = 'approved', approver_id = ${approver_id || 'admin'} WHERE id = ${id} AND status = 'pending'`;
        approved++;
      }
      return NextResponse.json({ approved, total: ids.length });
    }

    if (action === "bulk_import_employees") {
      const { employees } = data;
      let imported = 0;
      const failed: any[] = [];
      for (const emp of employees) {
        try {
          const salary = JSON.stringify({
            basic: parseFloat(emp.basic_salary || "0"),
            housing: parseFloat(emp.housing_allowance || "0"),
            transport: parseFloat(emp.transport_allowance || "0"),
          });
          const leave = JSON.stringify({ annual: 21, sick: 30, personal: 5 });
          await sql`INSERT INTO employees (id, name, email, phone, position, department, join_date, salary, leave_balance, nationality, manager_id, status, pin)
            VALUES (${emp.id}, ${emp.name}, ${emp.email || ''}, ${emp.phone || ''}, ${emp.position || 'Staff'}, ${emp.department || 'General'}, ${emp.join_date || new Date().toISOString().slice(0,10)}, ${salary}::jsonb, ${leave}::jsonb, ${emp.nationality || 'Saudi'}, ${emp.manager_id || null}, 'active', ${emp.pin || '1234'})
            ON CONFLICT (id) DO NOTHING`;
          imported++;
        } catch (e: any) {
          failed.push({ id: emp.id, error: e.message });
        }
      }
      return NextResponse.json({ imported, failed: failed.length, errors: failed });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
