import { NextRequest, NextResponse } from "next/server";

// Mock data mirroring the SQLite database for admin panel
// In production, this would query the real DB via an API bridge

const EMPLOYEES = [
  { id: "E001", name: "Ahmed Al-Rashidi", nameAr: "أحمد الرشيدي", position: "Senior Software Engineer", department: "Information Technology", email: "ahmed.rashidi@mrna.sa", phone: "+966501234567", joinDate: "2020-03-15", grade: "35", managerId: "E003", nationality: "Saudi", annualLeave: 22, sickLeave: 28 },
  { id: "E002", name: "Fatima Al-Zahrani", nameAr: "فاطمة الزهراني", position: "HR Manager", department: "Human Resources", email: "fatima.zahrani@mrna.sa", phone: "+966502345678", joinDate: "2018-01-10", grade: "37", managerId: "E005", nationality: "Saudi", annualLeave: 15, sickLeave: 30 },
  { id: "E003", name: "Mohammed Al-Otaibi", nameAr: "محمد العتيبي", position: "IT Manager", department: "Information Technology", email: "mohammed.otaibi@mrna.sa", phone: "+966503456789", joinDate: "2017-06-01", grade: "38", managerId: "E005", nationality: "Saudi", annualLeave: 10, sickLeave: 25 },
  { id: "E004", name: "Sara Al-Ghamdi", nameAr: "سارة الغامدي", position: "Financial Analyst", department: "Finance", email: "sara.ghamdi@mrna.sa", phone: "+966504567890", joinDate: "2021-09-01", grade: "34", managerId: "E003", nationality: "Saudi", annualLeave: 28, sickLeave: 30 },
  { id: "E005", name: "Khalid Al-Harbi", nameAr: "خالد الحربي", position: "CHRO", department: "Executive", email: "khalid.harbi@mrna.sa", phone: "+966505678901", joinDate: "2015-01-15", grade: "40", managerId: null, nationality: "Saudi", annualLeave: 5, sickLeave: 20 },
  { id: "E006", name: "Nour Al-Shammari", nameAr: "نور الشمري", position: "Recruitment Specialist", department: "Human Resources", email: "nour.shammari@mrna.sa", phone: "+966506789012", joinDate: "2022-03-20", grade: "33", managerId: "E002", nationality: "Saudi", annualLeave: 26, sickLeave: 30 },
  { id: "E007", name: "Rajesh Kumar", nameAr: "راجيش كومار", position: "DevOps Engineer", department: "Information Technology", email: "rajesh.kumar@mrna.sa", phone: "+966507890123", joinDate: "2019-11-01", grade: "35", managerId: "E003", nationality: "Indian", annualLeave: 18, sickLeave: 30 },
];

const LEAVE_REQUESTS = [
  { ref: "LR-2026-001", employeeId: "E001", employeeName: "Ahmed Al-Rashidi", leaveType: "annual", startDate: "2026-03-10", endDate: "2026-03-14", days: 5, reason: "Family vacation", status: "pending", approverId: "E003" },
  { ref: "LR-2026-002", employeeId: "E004", employeeName: "Sara Al-Ghamdi", leaveType: "sick", startDate: "2026-02-25", endDate: "2026-02-26", days: 2, reason: "Medical appointment", status: "pending", approverId: "E003" },
  { ref: "LR-2026-003", employeeId: "E006", employeeName: "Nour Al-Shammari", leaveType: "annual", startDate: "2026-03-20", endDate: "2026-03-25", days: 6, reason: "Wedding attendance", status: "pending", approverId: "E002" },
  { ref: "LR-2026-004", employeeId: "E007", employeeName: "Rajesh Kumar", leaveType: "annual", startDate: "2026-04-01", endDate: "2026-04-15", days: 15, reason: "Annual home visit", status: "pending", approverId: "E003" },
];

const LOANS = [
  { ref: "LN-2026-001", employeeId: "E001", employeeName: "Ahmed Al-Rashidi", loanType: "Interest-Free", amount: 24000, remaining: 16000, monthlyInstallment: 2000, installmentsLeft: 8, status: "active" },
  { ref: "LN-2026-002", employeeId: "E004", employeeName: "Sara Al-Ghamdi", loanType: "Advance Salary", amount: 10000, remaining: 5000, monthlyInstallment: 2500, installmentsLeft: 2, status: "active" },
];

const DOCUMENTS = [
  { ref: "DOC-2026-001", employeeId: "E001", employeeName: "Ahmed Al-Rashidi", documentType: "Salary Certificate", status: "ready", estimatedDate: "2026-02-22" },
  { ref: "DOC-2026-002", employeeId: "E004", employeeName: "Sara Al-Ghamdi", documentType: "Experience Certificate", status: "processing", estimatedDate: "2026-02-27" },
];

const ANNOUNCEMENTS = [
  { id: 1, title: "Ramadan Working Hours", content: "During Ramadan, working hours will be 10 AM to 3 PM.", author: "HR Department", priority: "important", date: "2026-02-20" },
  { id: 2, title: "Annual Performance Review", content: "2026 review cycle begins March 1st.", author: "Khalid Al-Harbi", priority: "urgent", date: "2026-02-18" },
  { id: 3, title: "New Parking Policy", content: "Register vehicles through portal by March 15.", author: "Operations", priority: "normal", date: "2026-02-15" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") || "overview";

  const departments = [...new Set(EMPLOYEES.map((e) => e.department))];
  const deptCounts = departments.map((d) => ({ name: d, count: EMPLOYEES.filter((e) => e.department === d).length }));

  if (section === "overview") {
    return NextResponse.json({
      totalEmployees: EMPLOYEES.length,
      departments: deptCounts,
      pendingLeaves: LEAVE_REQUESTS.filter((l) => l.status === "pending").length,
      activeLoans: LOANS.filter((l) => l.status === "active").length,
      pendingDocuments: DOCUMENTS.filter((d) => d.status !== "ready").length,
      announcements: ANNOUNCEMENTS.length,
    });
  }

  const data: Record<string, unknown> = {
    employees: EMPLOYEES,
    leaves: LEAVE_REQUESTS,
    loans: LOANS,
    documents: DOCUMENTS,
    announcements: ANNOUNCEMENTS,
  };

  return NextResponse.json(data[section] || []);
}
