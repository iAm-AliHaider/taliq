import { NextRequest, NextResponse } from "next/server";

// Bridge to real SQLite data via admin_api.py running on port 8082
const ADMIN_API = process.env.ADMIN_API_URL || "http://localhost:8082";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") || "overview";

  try {
    const res = await fetch(`${ADMIN_API}/api/admin?section=${section}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Fallback: return empty data structure
    const fallbacks: Record<string, unknown> = {
      overview: { totalEmployees: 0, departments: [], pendingLeaves: 0, activeLoans: 0, pendingDocuments: 0, announcements: 0, openGrievances: 0, pendingTravel: 0 },
      employees: [],
      leaves: [],
      loans: [],
      documents: [],
      announcements: [],
      grievances: [],
      training: { courses: [], enrollments: [] },
      performance: { reviews: [], goals: [] },
      policies: {},
    };
    return NextResponse.json(fallbacks[section] || []);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "approve";
    
    const res = await fetch(`${ADMIN_API}/api/admin/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Admin API unavailable" }, { status: 503 });
  }
}
