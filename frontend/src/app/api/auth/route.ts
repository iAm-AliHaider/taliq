import { NextRequest, NextResponse } from "next/server";

const EMPLOYEES = [
  { id: "E001", name: "Ahmed Al-Rashidi", position: "Senior Software Engineer", department: "Information Technology", pin: "1234" },
  { id: "E002", name: "Fatima Al-Zahrani", position: "HR Manager", department: "Human Resources", pin: "2345" },
  { id: "E003", name: "Mohammed Al-Otaibi", position: "IT Manager", department: "Information Technology", pin: "3456" },
  { id: "E004", name: "Sara Al-Ghamdi", position: "Financial Analyst", department: "Finance", pin: "4567" },
  { id: "E005", name: "Khalid Al-Harbi", position: "CHRO", department: "Executive", pin: "5678" },
  { id: "E006", name: "Nour Al-Shammari", position: "Recruitment Specialist", department: "Human Resources", pin: "6789" },
  { id: "E007", name: "Rajesh Kumar", position: "DevOps Engineer", department: "Information Technology", pin: "7890" },
];

const MANAGERS = ["E002", "E003", "E005"];

export async function GET() {
  const employees = EMPLOYEES.map((e) => ({
    id: e.id,
    name: e.name,
    position: e.position,
    department: e.department,
  }));
  return NextResponse.json(employees);
}

export async function POST(request: NextRequest) {
  try {
    const { employeeId, pin } = await request.json();

    if (!employeeId || !pin) {
      return NextResponse.json({ error: "Employee ID and PIN required" }, { status: 400 });
    }

    const employee = EMPLOYEES.find((e) => e.id === employeeId);

    if (!employee || employee.pin !== pin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isManager = MANAGERS.includes(employee.id);

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      position: employee.position,
      department: employee.department,
      isManager,
    });
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
