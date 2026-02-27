import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const rows = await sql`SELECT id, name, position, department FROM employees ORDER BY id`;
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { employeeId, pin } = await request.json();

    if (!employeeId || !pin) {
      return NextResponse.json({ error: "Employee ID and PIN required" }, { status: 400 });
    }

    const rows = await sql`SELECT id, name, position, department, manager_id FROM employees WHERE id = ${employeeId} AND pin = ${pin}`;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const emp = rows[0];

    // Check if manager (has direct reports)
    const reports = await sql`SELECT COUNT(*) as count FROM employees WHERE manager_id = ${emp.id}`;
    const isManager = Number(reports[0].count) > 0;

    // Admin = E005 (CHRO) or could be extended via a role column
    const isAdmin = emp.id === "E005";

    return NextResponse.json({
      id: emp.id,
      name: emp.name,
      position: emp.position,
      department: emp.department,
      isManager,
      isAdmin,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
