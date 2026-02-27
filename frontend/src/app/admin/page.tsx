"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

async function adminFetch(params: string, options?: RequestInit): Promise<any> {
  try {
    const url = options?.method === "POST" ? `/api/admin${params}` : `/api/admin?${params}`;
    const res = await fetch(url, options);
    if (res.ok) return res.json();
  } catch { /* */ }
  return null;
}

interface Employee { id: string; name: string; nameAr: string; position: string; department: string; email: string; phone: string; joinDate: string; grade: string; managerId: string | null; managerName: string | null; nationality: string; annualLeave: number; sickLeave: number; emergencyLeave: number; studyLeave: number; salary: number; housing: number; transport: number; totalSalary: number; directReports: { id: string; name: string }[]; isManager: boolean; }
interface LeaveRequest { ref: string; employeeId: string; employeeName: string; department: string; leaveType: string; startDate: string; endDate: string; days: number; reason: string; status: string; approverId: string; approverName: string; }
interface Loan { ref: string; employeeId: string; employeeName: string; department: string; loanType: string; amount: number; remaining: number; monthlyInstallment: number; installmentsLeft: number; status: string; }
interface Document { ref: string; employeeId: string; employeeName: string; documentType: string; status: string; estimatedDate: string; }
interface Announcement { id: number; title: string; content: string; author: string; priority: string; date: string; }
interface Grievance { ref: string; employeeId: string; employeeName: string; department: string; category: string; subject: string; description: string; severity: string; status: string; assignedTo: string; resolution: string; submittedAt: string; }
interface Overview { totalEmployees: number; departments: { name: string; count: number }[]; pendingLeaves: number; activeLoans: number; pendingDocuments: number; announcements: number; openGrievances: number; pendingTravel: number; }

const TABS = ["Overview", "Employees", "Leave Requests", "Loans", "Documents", "Grievances", "Announcements", "Policies"];

function StatCard({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
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
    pending: { color: "amber", label: "Pending" }, approved: { color: "emerald", label: "Approved" },
    rejected: { color: "red", label: "Rejected" }, active: { color: "blue", label: "Active" },
    ready: { color: "emerald", label: "Ready" }, processing: { color: "amber", label: "Processing" },
    requested: { color: "blue", label: "Requested" }, submitted: { color: "amber", label: "Submitted" },
    investigating: { color: "orange", label: "Investigating" }, resolved: { color: "emerald", label: "Resolved" },
    closed: { color: "gray", label: "Closed" },
    important: { color: "amber", label: "Important" }, urgent: { color: "red", label: "Urgent" }, normal: { color: "gray", label: "Normal" },
  };
  const cfg = map[status] || { color: "gray", label: status };
  return <Badge text={cfg.label} color={cfg.color} />;
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = { low: "gray", medium: "amber", high: "orange", critical: "red" };
  return <Badge text={severity} color={map[severity] || "gray"} />;
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
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [policies, setPolicies] = useState<Record<string, any>>({});
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
  const [policyDraft, setPolicyDraft] = useState<Record<string, any>>({});
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [search, setSearch] = useState("");
  const [editingManager, setEditingManager] = useState<string | null>(null);
  const [selectedManager, setSelectedManager] = useState("");
  

  useEffect(() => {
    try {
      const stored = localStorage.getItem("taliq_employee");
      if (stored) { const emp = JSON.parse(stored); if (emp.isAdmin) { setAuthed(true); return; } }
    } catch { /* */ }
    setAuthed(false);
  }, []);

  const loadData = useCallback(async () => {
    if (!authed) return;
    const ov = await adminFetch("section=overview");
    if (ov) {
      setOverview(ov);
      adminFetch("section=employees").then(d => d && setEmployees(d));
      adminFetch("section=leaves").then(d => d && setLeaves(d));
      adminFetch("section=loans").then(d => d && setLoans(d));
      adminFetch("section=documents").then(d => d && setDocuments(d));
      adminFetch("section=announcements").then(d => d && setAnnouncements(d));
      adminFetch("section=grievances").then(d => d && setGrievances(d));
      adminFetch("section=policies").then(d => d && setPolicies(d));
    }
  }, [authed]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (type: string, ref: string, decision: string) => {
    await adminFetch(`/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ref, decision }),
    });
    loadData();
  };

  const handleReassign = async (empId: string, newMgrId: string) => {
    await adminFetch(`/reassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: empId, newManagerId: newMgrId }),
    });
    setEditingManager(null);
    loadData();
  };

  const handleSavePolicy = async (category: string) => {
    setSavingPolicy(true);
    const { _id, _updated_at, _updated_by, ...config } = policyDraft;
    await adminFetch("?action=policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, config }),
    });
    setEditingPolicy(null);
    setSavingPolicy(false);
    loadData();
  };

  if (!authed) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFBFC] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Admin Access Required</h1>
          <p className="text-sm text-gray-500 mt-2">Login as admin (E005 / PIN: 5678) first.</p>
          <button onClick={() => router.push("/")} className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:bg-emerald-600">Go to Login</button>
        </div>
      </div>
    );
  }

  const filteredEmployees = employees.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()) || e.department.toLowerCase().includes(search.toLowerCase()));
  const managers = employees.filter(e => e.isManager || e.id === "E005");

  return (
    <div className="min-h-[100dvh] bg-[#FAFBFC]">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <div><h1 className="text-base font-bold text-gray-900">Taliq Admin</h1></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-gray-400">Neon DB</span>
            <button onClick={loadData} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100">Refresh</button>
            <button onClick={() => router.push("/")} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100">Back to App</button>
          </div>
        </div>
      </header>

      

      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{t}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "Overview" && overview && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Employees" value={overview.totalEmployees} color="text-gray-900" />
              <StatCard label="Pending Leaves" value={overview.pendingLeaves} color="text-amber-600" />
              <StatCard label="Active Loans" value={overview.activeLoans} color="text-indigo-600" />
              <StatCard label="Pending Docs" value={overview.pendingDocuments} color="text-orange-600" />
              <StatCard label="Open Grievances" value={overview.openGrievances} color="text-red-600" />
              <StatCard label="Pending Travel" value={overview.pendingTravel} color="text-sky-600" />
              <StatCard label="Announcements" value={overview.announcements} color="text-purple-600" />
              <StatCard label="Departments" value={overview.departments.length} color="text-blue-600" />
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Department Breakdown</h3>
              <div className="space-y-2">
                {overview.departments.map(d => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-40">{d.name}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(d.count / overview.totalEmployees) * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-6 text-right">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EMPLOYEES with Manager Assignment */}
        {tab === "Employees" && (
          <div className="space-y-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="text-left px-4 py-2.5 text-[10px] text-gray-400 uppercase font-semibold">Employee</th>
                    <th className="text-left px-4 py-2.5 text-[10px] text-gray-400 uppercase font-semibold">Department</th>
                    <th className="text-left px-4 py-2.5 text-[10px] text-gray-400 uppercase font-semibold">Manager</th>
                    <th className="text-left px-4 py-2.5 text-[10px] text-gray-400 uppercase font-semibold">Reports</th>
                    <th className="text-left px-4 py-2.5 text-[10px] text-gray-400 uppercase font-semibold">Salary</th>
                    <th className="text-left px-4 py-2.5 text-[10px] text-gray-400 uppercase font-semibold">Leave</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEmployees.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">{e.name.split(" ").map(n => n[0]).join("")}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{e.name}</p>
                            <p className="text-[10px] text-gray-400">{e.id} - {e.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{e.department}</td>
                      <td className="px-4 py-3">
                        {editingManager === e.id ? (
                          <div className="flex items-center gap-1">
                            <select value={selectedManager} onChange={ev => setSelectedManager(ev.target.value)}
                              className="text-xs border rounded-lg px-2 py-1 bg-white">
                              <option value="">None</option>
                              {managers.filter(m => m.id !== e.id).map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                            <button onClick={() => handleReassign(e.id, selectedManager)}
                              className="px-2 py-1 rounded bg-emerald-500 text-white text-[10px]">Save</button>
                            <button onClick={() => setEditingManager(null)}
                              className="px-2 py-1 rounded bg-gray-200 text-gray-600 text-[10px]">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingManager(e.id); setSelectedManager(e.managerId || ""); }}
                            className="text-xs text-gray-600 hover:text-emerald-600 hover:underline">
                            {e.managerName || "None"}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {e.directReports.length > 0 ? (
                          <span className="text-emerald-600 font-medium">{e.directReports.length} reports</span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-900">{e.totalSalary?.toLocaleString()} SAR</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Badge text={`A:${e.annualLeave}`} color="blue" />
                          <Badge text={`S:${e.sickLeave}`} color="orange" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEAVE REQUESTS */}
        {tab === "Leave Requests" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">All Leave Requests</h3>
              <Badge text={`${leaves.filter(l => l.status === "pending").length} pending`} color="amber" />
            </div>
            <div className="divide-y divide-gray-50">
              {leaves.map(l => (
                <div key={l.ref} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{l.employeeName} <span className="text-gray-400 text-xs">({l.department})</span></p>
                    <p className="text-[10px] text-gray-400">{l.ref} - {l.leaveType} - {l.days}d ({l.startDate} to {l.endDate})</p>
                    {l.reason && <p className="text-[10px] text-gray-400 italic">{l.reason}</p>}
                    <p className="text-[10px] text-gray-300">Approver: {l.approverName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={l.status} />
                    {l.status === "pending" && (
                      <div className="flex gap-1">
                        <button onClick={() => handleApprove("leave", l.ref, "approved")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-emerald-600 hover:bg-emerald-100">Approve</button>
                        <button onClick={() => handleApprove("leave", l.ref, "rejected")}
                          className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-[10px] font-medium text-red-600 hover:bg-red-100">Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {leaves.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No leave requests</div>}
            </div>
          </div>
        )}

        {/* LOANS */}
        {tab === "Loans" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">All Loans</h3>
              <Badge text={`${loans.filter(l => l.status === "pending").length} pending`} color="amber" />
            </div>
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Employee</th>
                <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Type</th>
                <th className="text-right px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Amount</th>
                <th className="text-right px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Remaining</th>
                <th className="text-center px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Status</th>
                <th className="text-center px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {loans.map(l => (
                  <tr key={l.ref} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-sm text-gray-900">{l.employeeName}<br/><span className="text-[10px] text-gray-400">{l.ref}</span></td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{l.loanType}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium">{l.amount?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-sm text-right text-amber-600">{l.remaining?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-center"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-2.5 text-center">
                      {l.status === "pending" && (
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => handleApprove("loan", l.ref, "approved")}
                            className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-600 hover:bg-emerald-100">Approve</button>
                          <button onClick={() => handleApprove("loan", l.ref, "rejected")}
                            className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] text-red-600 hover:bg-red-100">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DOCUMENTS */}
        {tab === "Documents" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">Document Requests</h3></div>
            <div className="divide-y divide-gray-50">
              {documents.map(d => (
                <div key={d.ref} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{d.employeeName}</p>
                    <p className="text-[10px] text-gray-400">{d.ref} - {d.documentType}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    {d.status !== "ready" && d.status !== "rejected" && (
                      <div className="flex gap-1">
                        <button onClick={() => handleApprove("document", d.ref, "ready")}
                          className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-600">Ready</button>
                        <button onClick={() => handleApprove("document", d.ref, "rejected")}
                          className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] text-red-600">Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {documents.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No document requests</div>}
            </div>
          </div>
        )}

        {/* GRIEVANCES */}
        {tab === "Grievances" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Grievances</h3>
              <Badge text={`${grievances.filter(g => !["resolved","closed"].includes(g.status)).length} open`} color="red" />
            </div>
            <div className="divide-y divide-gray-50">
              {grievances.map(g => (
                <div key={g.ref} className="px-5 py-3 hover:bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{g.employeeName} <span className="text-gray-400 text-xs">({g.department})</span></p>
                      <p className="text-xs text-gray-700 mt-0.5">{g.subject}</p>
                      <p className="text-[10px] text-gray-400">{g.ref} - {g.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={g.severity} />
                      <StatusBadge status={g.status} />
                    </div>
                  </div>
                </div>
              ))}
              {grievances.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No grievances</div>}
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {tab === "Announcements" && (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{a.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{a.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1">By {a.author} - {a.date}</p>
                  </div>
                  <StatusBadge status={a.priority} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* POLICIES - Editable */}
        {tab === "Policies" && (
          <div className="space-y-4">
            {Object.entries(policies).map(([category, config]) => {
              const isEditing = editingPolicy === category;
              const draft = isEditing ? policyDraft : config;
              const { _id, _updated_at, _updated_by, ...fields } = draft;
              const LABELS: Record<string, string> = {
                leave: "Leave Policy", loan: "Loan Policy", attendance: "Attendance Policy",
                travel: "Travel & Per Diem", grievance: "Grievance & SLA",
              };
              const COLORS: Record<string, string> = {
                leave: "from-blue-50 to-indigo-50", loan: "from-emerald-50 to-teal-50",
                attendance: "from-amber-50 to-orange-50", travel: "from-sky-50 to-cyan-50",
                grievance: "from-red-50 to-pink-50",
              };
              return (
                <div key={category} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className={`px-5 py-3 bg-gradient-to-r ${COLORS[category] || "from-gray-50 to-gray-100"} border-b flex items-center justify-between`}>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">{LABELS[category] || category}</h3>
                      {config._updated_at && <p className="text-[10px] text-gray-400">Last updated: {new Date(config._updated_at).toLocaleDateString()}</p>}
                    </div>
                    {!isEditing ? (
                      <button onClick={() => { setEditingPolicy(category); setPolicyDraft({ ...config }); }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 shadow-sm">
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => handleSavePolicy(category)} disabled={savingPolicy}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 disabled:opacity-50">
                          {savingPolicy ? "Saving..." : "Save"}
                        </button>
                        <button onClick={() => setEditingPolicy(null)}
                          className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-300">Cancel</button>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(fields).map(([key, value]) => {
                        const label = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                        if (typeof value === "object" && !Array.isArray(value)) {
                          return (
                            <div key={key} className="col-span-2 md:col-span-3 lg:col-span-4">
                              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">{label}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {Object.entries(value as Record<string, any>).map(([sk, sv]) => (
                                  <div key={sk} className="bg-gray-50 rounded-lg p-2">
                                    <span className="text-[10px] text-gray-400 block capitalize">{sk.replace(/_/g, " ")}</span>
                                    {isEditing ? (
                                      <input type="number" value={sv} onChange={e => {
                                        const newDraft = { ...policyDraft };
                                        (newDraft[key] as any)[sk] = Number(e.target.value);
                                        setPolicyDraft(newDraft);
                                      }} className="w-full text-sm font-bold text-gray-900 bg-white border rounded px-2 py-1 mt-0.5" />
                                    ) : (
                                      <span className="text-sm font-bold text-gray-900">{sv}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        if (Array.isArray(value)) {
                          return (
                            <div key={key} className="col-span-2 md:col-span-3 lg:col-span-4">
                              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">{label}</p>
                              <div className="flex flex-wrap gap-1">
                                {(value as string[]).map((v, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700 border border-gray-200">{v}</span>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        if (typeof value === "boolean") {
                          return (
                            <div key={key} className="bg-gray-50 rounded-xl p-3">
                              <p className="text-[10px] text-gray-400">{label}</p>
                              {isEditing ? (
                                <button onClick={() => setPolicyDraft({ ...policyDraft, [key]: !policyDraft[key] })}
                                  className={`mt-1 px-3 py-1 rounded-lg text-xs font-bold ${policyDraft[key] ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                  {policyDraft[key] ? "Yes" : "No"}
                                </button>
                              ) : (
                                <p className={`text-lg font-bold ${value ? "text-emerald-600" : "text-red-600"}`}>{value ? "Yes" : "No"}</p>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div key={key} className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400">{label}</p>
                            {isEditing ? (
                              <input type={typeof value === "number" ? "number" : "text"} value={policyDraft[key]}
                                onChange={e => setPolicyDraft({ ...policyDraft, [key]: typeof value === "number" ? Number(e.target.value) : e.target.value })}
                                className="w-full text-lg font-bold text-gray-900 bg-white border rounded px-2 py-1 mt-0.5" />
                            ) : (
                              <p className="text-lg font-bold text-gray-900">{String(value)}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
