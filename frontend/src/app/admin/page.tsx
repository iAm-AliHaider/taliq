"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Employee { id: string; name: string; nameAr: string; position: string; department: string; email: string; phone: string; joinDate: string; grade: string; managerId: string | null; nationality: string; annualLeave: number; sickLeave: number; }
interface LeaveRequest { ref: string; employeeId: string; employeeName: string; leaveType: string; startDate: string; endDate: string; days: number; reason: string; status: string; approverId: string; }
interface Loan { ref: string; employeeId: string; employeeName: string; loanType: string; amount: number; remaining: number; monthlyInstallment: number; installmentsLeft: number; status: string; }
interface Document { ref: string; employeeId: string; employeeName: string; documentType: string; status: string; estimatedDate: string; }
interface Announcement { id: number; title: string; content: string; author: string; priority: string; date: string; }
interface Overview { totalEmployees: number; departments: { name: string; count: number }[]; pendingLeaves: number; activeLoans: number; pendingDocuments: number; announcements: number; }

const TABS = ["Overview", "Employees", "Leave Requests", "Loans", "Documents", "Announcements"];

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[color] || colors.gray}`}>{text}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    pending: { color: "amber", label: "Pending" },
    approved: { color: "emerald", label: "Approved" },
    rejected: { color: "red", label: "Rejected" },
    active: { color: "blue", label: "Active" },
    ready: { color: "emerald", label: "Ready" },
    processing: { color: "amber", label: "Processing" },
    requested: { color: "blue", label: "Requested" },
    important: { color: "amber", label: "Important" },
    urgent: { color: "red", label: "Urgent" },
    normal: { color: "gray", label: "Normal" },
  };
  const cfg = map[status] || { color: "gray", label: status };
  return <Badge text={cfg.label} color={cfg.color} />;
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState("Overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [authed, setAuthed] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("taliq_employee");
      if (stored) {
        const emp = JSON.parse(stored);
        if (emp.isAdmin) { setAuthed(true); return; }
      }
    } catch { /* */ }
    setAuthed(false);
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetch("/api/admin?section=overview").then(r => r.json()).then(setOverview);
    fetch("/api/admin?section=employees").then(r => r.json()).then(setEmployees);
    fetch("/api/admin?section=leaves").then(r => r.json()).then(setLeaves);
    fetch("/api/admin?section=loans").then(r => r.json()).then(setLoans);
    fetch("/api/admin?section=documents").then(r => r.json()).then(setDocuments);
    fetch("/api/admin?section=announcements").then(r => r.json()).then(setAnnouncements);
  }, [authed]);

  if (!authed) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFBFC] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Admin Access Required</h1>
          <p className="text-sm text-gray-500 mt-2">Login as admin (E005 / PIN: 5678) from the main page first.</p>
          <button onClick={() => router.push("/")} className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:bg-emerald-600 transition-colors">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const filteredEmployees = employees.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()) || e.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] bg-[#FAFBFC]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-base font-bold">ت</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Taliq Admin</h1>
              <p className="text-[10px] text-gray-400">HR Management Console</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors">
              Back to App
            </button>
            <Badge text="Admin" color="violet" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "Overview" && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Employees" value={overview.totalEmployees} color="text-gray-900" />
              <StatCard label="Departments" value={overview.departments.length} color="text-blue-600" />
              <StatCard label="Pending Leaves" value={overview.pendingLeaves} color="text-amber-600" />
              <StatCard label="Active Loans" value={overview.activeLoans} color="text-indigo-600" />
              <StatCard label="Pending Docs" value={overview.pendingDocuments} color="text-orange-600" />
              <StatCard label="Announcements" value={overview.announcements} color="text-purple-600" />
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Department Breakdown</h3>
              <div className="space-y-3">
                {overview.departments.map(d => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-40">{d.name}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${(d.count / overview.totalEmployees) * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Employees */}
        {tab === "Employees" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, or department..." className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
              <span className="text-xs text-gray-400">{filteredEmployees.length} employees</span>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="text-left px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Employee</th>
                      <th className="text-left px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Department</th>
                      <th className="text-left px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Grade</th>
                      <th className="text-left px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Join Date</th>
                      <th className="text-left px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Leave</th>
                      <th className="text-left px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Nationality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredEmployees.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{e.name.split(" ").map(n => n[0]).join("")}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{e.name}</p>
                              <p className="text-[10px] text-gray-400">{e.id} - {e.position}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{e.department}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">G{e.grade}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{e.joinDate}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-1">
                            <Badge text={`${e.annualLeave}d`} color="blue" />
                            <Badge text={`${e.sickLeave}s`} color="orange" />
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{e.nationality}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Leave Requests */}
        {tab === "Leave Requests" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">All Leave Requests</h3>
              <Badge text={`${leaves.filter(l => l.status === "pending").length} pending`} color="amber" />
            </div>
            <div className="divide-y divide-gray-50">
              {leaves.map(l => (
                <div key={l.ref} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{l.employeeName}</p>
                      <p className="text-[10px] text-gray-400">{l.ref} - {l.leaveType} leave - {l.days} days</p>
                      <p className="text-[10px] text-gray-400">{l.startDate} to {l.endDate}</p>
                      {l.reason && <p className="text-[10px] text-gray-400 italic mt-0.5">{l.reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={l.status} />
                    {l.status === "pending" && (
                      <div className="flex gap-1">
                        <button className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-emerald-600 hover:bg-emerald-100 transition-colors">Approve</button>
                        <button className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-[10px] font-medium text-red-600 hover:bg-red-100 transition-colors">Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loans */}
        {tab === "Loans" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Active Loans</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="text-left px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Ref</th>
                    <th className="text-left px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Employee</th>
                    <th className="text-left px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Type</th>
                    <th className="text-right px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Amount</th>
                    <th className="text-right px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Remaining</th>
                    <th className="text-right px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">EMI</th>
                    <th className="text-center px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Left</th>
                    <th className="text-center px-5 py-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loans.map(l => (
                    <tr key={l.ref} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-xs font-mono text-gray-500">{l.ref}</td>
                      <td className="px-5 py-3 text-sm text-gray-900">{l.employeeName}</td>
                      <td className="px-5 py-3 text-xs text-gray-600">{l.loanType}</td>
                      <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">{l.amount.toLocaleString()} SAR</td>
                      <td className="px-5 py-3 text-sm text-right font-medium text-amber-600">{l.remaining.toLocaleString()} SAR</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-600">{l.monthlyInstallment.toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm text-center text-gray-600">{l.installmentsLeft}</td>
                      <td className="px-5 py-3 text-center"><StatusBadge status={l.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Documents */}
        {tab === "Documents" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Document Requests</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {documents.map(d => (
                <div key={d.ref} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{d.employeeName}</p>
                    <p className="text-[10px] text-gray-400">{d.ref} - {d.documentType}</p>
                    <p className="text-[10px] text-gray-400">Est. ready: {d.estimatedDate}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Announcements */}
        {tab === "Announcements" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:bg-emerald-600 transition-colors">
                New Announcement
              </button>
            </div>
            {announcements.map(a => (
              <div key={a.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{a.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{a.content}</p>
                    <p className="text-[10px] text-gray-400 mt-2">By {a.author} - {a.date}</p>
                  </div>
                  <StatusBadge status={a.priority} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
