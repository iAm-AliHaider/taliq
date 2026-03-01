"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import SettingsPanel from "./settings";
import TemplatesPanel from "./templates";
import WorkflowBuilder from "./workflow-builder";
import dynamic from "next/dynamic";
const RechartsBarChart = dynamic(() => import("recharts").then(m => {
  const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } = m;
  return function ChartPanel({ departments, nationalities, leaveStats }: any) {
    const COLORS = ["#10B981","#3B82F6","#F59E0B","#EF4444","#8B5CF6","#EC4899","#14B8A6","#F97316"];
    const deptData = (departments || []).map((d: any) => ({ name: d.department, headcount: Number(d.count), cost: Math.round(Number(d.cost)/1000) }));
    const natData = (nationalities || []).map((n: any, i: number) => ({ name: n.nationality, value: Number(n.count), color: COLORS[i % COLORS.length] }));
    const leaveData = leaveStats ? [
      { name: "Approved", value: Number(leaveStats.approved), color: "#10B981" },
      { name: "Pending", value: Number(leaveStats.pending), color: "#F59E0B" },
      { name: "Rejected", value: Math.max(0, Number(leaveStats.total) - Number(leaveStats.approved) - Number(leaveStats.pending)), color: "#EF4444" },
    ].filter(d => d.value > 0) : [];
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Headcount by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
              <Bar dataKey="headcount" radius={[6,6,0,0]}>
                {deptData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Monthly Payroll by Dept (K SAR)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} formatter={(v: any) => `${v}K SAR`} />
              <Bar dataKey="cost" radius={[6,6,0,0]} fill="#10B981">
                {deptData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.7} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">By Nationality</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={natData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }: any) => `${name} (${value})`} labelLine={false}>
                {natData.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Leave Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={leaveData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }: any) => `${name}: ${value}d`} labelLine={false}>
                {leaveData.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };
}), { ssr: false, loading: () => <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Loading charts...</div> });

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

const TABS = ["Overview", "Employees", "Leave Requests", "Loans", "Documents", "Grievances", "Announcements", "Settings", "Letters", "Contracts", "Assets", "Shifts", "Iqama/Visa", "Exits", "Reports", "Recruitment", "Geofencing", "Workflows", "Templates", "Audit Log"];

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
  // Announcement form
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPriority, setAnnPriority] = useState("normal");
  const [annSaving, setAnnSaving] = useState(false);
  // Grievance actions
  const [grievanceAction, setGrievanceAction] = useState<string | null>(null);
  const [grievanceResolution, setGrievanceResolution] = useState("");
  // New tabs data
  const [letters, setLetters] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any>({ shifts: [], assignments: [] });
  const [iqama, setIqama] = useState<any[]>([]);
  const [exits, setExits] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);

  const [recruitmentData, setRecruitmentData] = useState<any>(null);
  const [geofenceData, setGeofenceData] = useState<any>(null);
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showCreateFence, setShowCreateFence] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [showCreateAsset, setShowCreateAsset] = useState(false);
  const [showCreateShift, setShowCreateShift] = useState(false);
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [renewingIqama, setRenewingIqama] = useState<string|null>(null);
  const [newJob, setNewJob] = useState({ title: "", department: "", description: "", requirements: "", salary_range: "", location: "Riyadh", employment_type: "full_time" });
  const [newFence, setNewFence] = useState({ name: "", latitude: "", longitude: "", radius_meters: "200", address: "", description: "" });
  // Create employee
  const [showCreateEmp, setShowCreateEmp] = useState(false);
  const [newEmp, setNewEmp] = useState<Record<string, string>>({ id: "", name: "", nameAr: "", position: "", department: "", email: "", phone: "", nationality: "Saudi", grade: "", managerId: "", basicSalary: "0", housingAllowance: "0", transportAllowance: "0", pin: "1234" });
  const [creatingEmp, setCreatingEmp] = useState(false);
  

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
      adminFetch("section=letters").then(d => d && setLetters(d));
      adminFetch("section=contracts").then(d => d && setContracts(d));
      adminFetch("section=assets").then(d => d && setAssets(d));
      adminFetch("section=shifts").then(d => d && setShifts(d));
      adminFetch("section=iqama").then(d => d && setIqama(d));
      adminFetch("section=exits").then(d => d && setExits(d));
      adminFetch("section=reports").then(d => d && setReports(d));
      adminFetch("section=audit_log").then(d => d && d.entries && setAuditLog(d.entries));
      adminFetch("section=recruitment").then(d => d && setRecruitmentData(d));
      adminFetch("section=geofences").then(d => d && setGeofenceData(d));
      adminFetch("section=workflows").then(d => d && setWorkflowData(d));
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

  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim() || !annContent.trim()) return;
    setAnnSaving(true);
    await adminFetch("?action=create_announcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: annTitle, content: annContent, author: "Admin", priority: annPriority }),
    });
    setAnnTitle(""); setAnnContent(""); setAnnPriority("normal"); setShowAnnForm(false); setAnnSaving(false);
    loadData();
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    await adminFetch("?action=delete_announcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  };

  const handleCreateEmployee = async () => {
    if (!newEmp.id || !newEmp.name) return;
    setCreatingEmp(true);
    await adminFetch("?action=create_employee", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEmp),
    });
    setShowCreateEmp(false); setCreatingEmp(false);
    setNewEmp({ id: "", name: "", nameAr: "", position: "", department: "", email: "", phone: "", nationality: "Saudi", grade: "", managerId: "", basicSalary: "0", housingAllowance: "0", transportAllowance: "0", pin: "1234" });
    loadData();
  };

  const handleClearanceUpdate = async (ref: string, item: string, status: string) => {
    await adminFetch("?action=update_clearance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, item, status }),
    });
    loadData();
  };

  const handleGrievanceAction = async (ref: string, action: string, resolution?: string, assignedTo?: string) => {
    await adminFetch("?action=resolve_grievance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, status: action, resolution, assignedTo }),
    });
    setGrievanceAction(null); setGrievanceResolution("");
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
            <div className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            <button onClick={() => setShowCreateEmp(!showCreateEmp)} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 whitespace-nowrap">+ New Employee</button>
            </div>
            {showCreateEmp && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Create Employee</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(newEmp).map(([k, v]) => (
                    <div key={k}>
                      <label className="text-[10px] text-gray-400 uppercase block mb-1">{k.replace(/([A-Z])/g, " $1").trim()}</label>
                      <input value={v} onChange={e => setNewEmp({...newEmp, [k]: e.target.value})} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleCreateEmployee} disabled={creatingEmp} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50">{creatingEmp ? "Creating..." : "Create"}</button>
                  <button onClick={() => setShowCreateEmp(false)} className="px-4 py-2 rounded-xl bg-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            )}
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
                      {g.status !== "resolved" && g.status !== "closed" && (
                        <div className="flex gap-1">
                          {g.status === "submitted" && <button onClick={() => handleGrievanceAction(g.ref, "investigating", undefined, "HR")} className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-600 hover:bg-amber-100">Investigate</button>}
                          <button onClick={() => { const r = prompt("Resolution notes:"); if (r) handleGrievanceAction(g.ref, "resolved", r); }} className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-600 hover:bg-emerald-100">Resolve</button>
                          <button onClick={() => handleGrievanceAction(g.ref, "closed")} className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-[10px] text-gray-500 hover:bg-gray-100">Close</button>
                        </div>
                      )}
                    </div>
                  </div>
                  {g.resolution && <p className="text-[10px] text-emerald-600 mt-1 ml-0">Resolution: {g.resolution}</p>}
                </div>
              ))}
              {grievances.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No grievances</div>}
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {tab === "Announcements" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-800">Company Announcements</h2>
              <button onClick={() => setShowAnnForm(!showAnnForm)} className="px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-semibold hover:bg-purple-600 shadow-sm shadow-purple-200">{showAnnForm ? "Cancel" : "+ New Announcement"}</button>
            </div>
            {showAnnForm && (
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Announcement Title *" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-200" />
                <textarea value={annContent} onChange={e => setAnnContent(e.target.value)} placeholder="Content *" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs h-20 resize-none focus:outline-none focus:ring-2 focus:ring-purple-200" />
                <div className="flex gap-2 items-center">
                  <select value={annPriority} onChange={e => setAnnPriority(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-xs">
                    <option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option>
                  </select>
                  <button onClick={handleCreateAnnouncement} disabled={annSaving} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50">{annSaving ? "Posting..." : "Post"}</button>
                </div>
              </div>
            )}
            {announcements.map(a => (
              <div key={a.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{a.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{a.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1">By {a.author} - {a.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.priority} />
                    <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-[10px] text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS - Comprehensive HR Configuration */}
        {tab === "Settings" && (
          <SettingsPanel
            policies={policies}
            onSave={async (category, config) => {
              const res = await adminFetch("?action=policy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category, config }),
              });
              if (res?.ok) {
                const updated = await adminFetch("section=policies");
                if (updated) setPolicies(updated);
              }
            }}
          />
        )}

        {/* LETTERS */}
        {tab === "Letters" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Generated Letters</h3>
              <Badge text={`${letters.length} total`} color="blue" />
            </div>
            <div className="divide-y divide-gray-50">
              {letters.map((l: any) => (
                <div key={l.ref} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{l.employee_name}</p>
                    <p className="text-[10px] text-gray-400">{l.ref} - {l.letter_type?.replace(/_/g, " ")} - {l.department}</p>
                    {l.purpose && <p className="text-[10px] text-gray-400 italic">Purpose: {l.purpose}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={l.status} />
                    {l.status === "pending" && <button onClick={() => handleApprove("document", l.ref, "ready")} className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-600 hover:bg-emerald-100">Mark Ready</button>}
                  </div>
                </div>
              ))}
              {letters.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No letters generated yet. Employees can request letters via voice.</div>}
            </div>
          </div>
        )}

        {/* CONTRACTS */}
        {tab === "Contracts" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Employee Contracts</h3>
              <button onClick={() => setShowCreateContract(!showCreateContract)} className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-[10px] font-semibold hover:bg-blue-600">{showCreateContract ? "Cancel" : "+ New Contract"}</button>
            </div>
            {showCreateContract && (
              <div className="mx-5 my-3 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <select id="ct_emp" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs">
                    <option value="">Select Employee *</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                  <select id="ct_type" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs">
                    <option value="unlimited">Unlimited</option><option value="fixed">Fixed Term</option><option value="probation">Probation</option>
                  </select>
                  <input id="ct_start" type="date" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs" />
                  <input id="ct_end" type="date" placeholder="End date (optional)" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs" />
                  <input id="ct_salary" type="number" placeholder="Salary (SAR)" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs" />
                </div>
                <button onClick={async () => {
                  const emp = (document.getElementById('ct_emp') as HTMLSelectElement).value;
                  if (!emp) return;
                  await fetch("/api/admin?action=create_contract", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({
                    employee_id: emp,
                    contract_type: (document.getElementById('ct_type') as HTMLSelectElement).value,
                    start_date: (document.getElementById('ct_start') as HTMLInputElement).value || new Date().toISOString().slice(0,10),
                    end_date: (document.getElementById('ct_end') as HTMLInputElement).value || null,
                    salary: parseFloat((document.getElementById('ct_salary') as HTMLInputElement).value) || 0,
                  })});
                  setShowCreateContract(false); loadData();
                }} className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold">Create Contract</button>
              </div>
            )}
            <table className="w-full"><thead><tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Employee</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Type</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Start</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">End</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Salary</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Status</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Actions</th>
            </tr></thead><tbody className="divide-y divide-gray-50">
              {contracts.map((c: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2"><p className="text-xs font-medium text-gray-900">{c.employee_name}</p><p className="text-[10px] text-gray-400">{c.department}</p></td>
                  <td className="px-4 py-2"><Badge text={c.contract_type} color={c.contract_type === "fixed" ? "amber" : "blue"} /></td>
                  <td className="px-4 py-2 text-xs text-gray-600">{c.start_date}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">{c.end_date || "Unlimited"}</td>
                  <td className="px-4 py-2 text-xs font-medium text-gray-900">{c.salary?.toLocaleString()} SAR</td>
                  <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-2">
                    {c.contract_type === "fixed" && c.status === "active" && <button onClick={() => { const dt = prompt("New end date (YYYY-MM-DD):"); if (dt) fetch("/api/admin?action=renew_contract", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: c.id, new_end_date: dt }) }).then(() => loadData()); }} className="text-[10px] text-blue-600 hover:underline">Renew</button>}
                  </td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}

        {/* ASSETS */}
        {tab === "Assets" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Asset Inventory</h3>
              <div className="flex gap-2 items-center">
                <Badge text={`${assets.filter((a:any) => a.status === "assigned").length} assigned`} color="blue" />
                <Badge text={`${assets.filter((a:any) => a.status === "available").length} available`} color="emerald" />
                <button onClick={() => setShowCreateAsset(!showCreateAsset)} className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[10px] font-semibold hover:bg-emerald-600">{showCreateAsset ? "Cancel" : "+ Add Asset"}</button>
              </div>
            </div>
            {showCreateAsset && (
              <div className="mx-5 mb-3 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input id="ast_name" placeholder="Asset Name *" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs" />
                  <select id="ast_type" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs">
                    <option value="laptop">Laptop</option><option value="phone">Phone</option><option value="monitor">Monitor</option><option value="desk">Desk</option><option value="chair">Chair</option><option value="vehicle">Vehicle</option><option value="other">Other</option>
                  </select>
                  <input id="ast_serial" placeholder="Serial Number" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs" />
                  <select id="ast_assign" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs">
                    <option value="">Unassigned</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <button onClick={async () => {
                  const n = (document.getElementById('ast_name') as HTMLInputElement).value;
                  if (!n) return;
                  await fetch("/api/admin?action=create_asset", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({
                    name: n,
                    asset_type: (document.getElementById('ast_type') as HTMLSelectElement).value,
                    serial_number: (document.getElementById('ast_serial') as HTMLInputElement).value,
                    assigned_to: (document.getElementById('ast_assign') as HTMLSelectElement).value || null,
                  })});
                  setShowCreateAsset(false); loadData();
                }} className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold">Add Asset</button>
              </div>
            )}
            <table className="w-full"><thead><tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Asset</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Type</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Assigned To</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Condition</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Status</th>
            </tr></thead><tbody className="divide-y divide-gray-50">
              {assets.map((a: any) => (
                <tr key={a.ref} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2"><p className="text-xs font-medium text-gray-900">{a.name}</p><p className="text-[10px] text-gray-400">{a.ref} - {a.serial_number}</p></td>
                  <td className="px-4 py-2 text-xs text-gray-600 capitalize">{a.asset_type?.replace("_"," ")}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">{a.assigned_name || "Unassigned"}</td>
                  <td className="px-4 py-2"><Badge text={a.condition || "good"} color={a.condition === "good" ? "emerald" : "amber"} /></td>
                  <td className="px-4 py-2 flex items-center gap-1">
                    <StatusBadge status={a.status} />
                    {a.status === "assigned" && <button onClick={async () => { await fetch("/api/admin?action=return_asset", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ ref: a.ref }) }); loadData(); }} className="text-[10px] text-amber-600 hover:underline">Return</button>}
                  </td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}

        {/* SHIFTS */}
        {tab === "Shifts" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Shift Definitions</h3>
                <button onClick={() => setShowCreateShift(!showCreateShift)} className="px-3 py-1.5 rounded-xl bg-indigo-500 text-white text-[10px] font-semibold hover:bg-indigo-600">{showCreateShift ? "Cancel" : "+ New Shift"}</button>
              </div>
              {showCreateShift && (
                <div className="mb-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200 space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <input id="sh_name" placeholder="Shift Name *" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs" />
                    <input id="sh_start" placeholder="Start (08:00)" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs" />
                    <input id="sh_end" placeholder="End (17:00)" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs" />
                    <input id="sh_break" placeholder="Break min" type="number" defaultValue="60" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs" />
                    <input id="sh_diff" placeholder="Differential %" type="number" defaultValue="0" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs" />
                  </div>
                  <button onClick={async () => {
                    const n = (document.getElementById('sh_name') as HTMLInputElement).value;
                    if (!n) return;
                    await fetch("/api/admin?action=create_shift", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({
                      name: n,
                      start_time: (document.getElementById('sh_start') as HTMLInputElement).value || '08:00',
                      end_time: (document.getElementById('sh_end') as HTMLInputElement).value || '17:00',
                      break_minutes: parseInt((document.getElementById('sh_break') as HTMLInputElement).value) || 60,
                      differential_pct: parseInt((document.getElementById('sh_diff') as HTMLInputElement).value) || 0,
                    })});
                    setShowCreateShift(false); loadData();
                  }} className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold">Create Shift</button>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(shifts.shifts || []).map((s: any) => (
                  <div key={s.id} className={`rounded-xl p-3 border ${s.is_night_shift ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-200"}`}>
                    <p className="text-sm font-bold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.start_time} - {s.end_time}</p>
                    <p className="text-[10px] text-gray-400">{s.break_minutes}min break{s.differential_pct > 0 ? ` +${s.differential_pct}%` : ""}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b"><h3 className="text-sm font-semibold text-gray-800">Current Assignments</h3></div>
              <div className="divide-y divide-gray-50">
                {(shifts.assignments || []).map((a: any, i: number) => (
                  <div key={i} className="px-5 py-2 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-gray-900">{a.name}</p><p className="text-[10px] text-gray-400">{a.department}</p></div>
                    <Badge text={a.shift_name} color="blue" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* IQAMA/VISA */}
        {tab === "Iqama/Visa" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Iqama & Visa Documents</h3>
            </div>
            <table className="w-full"><thead><tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Employee</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Type</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Number</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Expiry</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Status</th>
            </tr></thead><tbody className="divide-y divide-gray-50">
              {iqama.map((d: any, i: number) => {
                const days = Math.ceil((new Date(d.expiry_date).getTime() - Date.now()) / 86400000);
                return (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2"><p className="text-xs font-medium text-gray-900">{d.employee_name}</p><p className="text-[10px] text-gray-400">{d.department}</p></td>
                    <td className="px-4 py-2 text-xs text-gray-600 capitalize">{d.document_type?.replace("_"," ")}</td>
                    <td className="px-4 py-2 text-xs text-gray-600">{d.document_number}</td>
                    <td className="px-4 py-2"><span className={`text-xs font-medium ${days <= 30 ? "text-red-600" : days <= 90 ? "text-amber-600" : "text-gray-600"}`}>{d.expiry_date} {days <= 90 ? `(${days}d)` : ""}</span></td>
                    <td className="px-4 py-2 flex items-center gap-1">
                      <StatusBadge status={d.status} />
                      {days <= 90 && <button onClick={() => { const dt = prompt("New expiry date (YYYY-MM-DD):"); if (dt) fetch("/api/admin?action=renew_iqama", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: d.id, new_expiry: dt }) }).then(() => loadData()); }} className="text-[10px] text-blue-600 hover:underline">Renew</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody></table>
          </div>
        )}

        {/* EXITS */}
        {tab === "Exits" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Exit / Offboarding Requests</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {exits.map((ex: any) => {
                const cl = typeof ex.clearance_status === "string" ? JSON.parse(ex.clearance_status) : (ex.clearance_status || {});
                const cleared = Object.values(cl).filter((v: any) => v === "cleared").length;
                const total = Object.keys(cl).length;
                const settlement = typeof ex.final_settlement === "string" ? JSON.parse(ex.final_settlement) : (ex.final_settlement || {});
                return (
                  <div key={ex.ref} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ex.employee_name} <span className="text-gray-400 text-xs">({ex.department})</span></p>
                        <p className="text-[10px] text-gray-400">{ex.ref} - {ex.exit_type} - Last day: {ex.last_working_day}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={ex.status} />
                        {(ex.status === "pending" || ex.status === "initiated") && (
                          <div className="flex gap-1">
                            <button onClick={async () => { await fetch("/api/admin?action=approve_exit", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ ref: ex.ref, decision: "approved" }) }); loadData(); }} className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-600 hover:bg-emerald-100">Approve</button>
                            <button onClick={async () => { await fetch("/api/admin?action=approve_exit", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ ref: ex.ref, decision: "rejected" }) }); loadData(); }} className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] text-red-600 hover:bg-red-100">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{width:`${total>0?(cleared/total)*100:0}%`}} />
                      </div>
                      <span className="text-xs text-gray-600">{cleared}/{total} cleared</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(cl).map(([k, v]: [string, any]) => (
                        <button key={k} onClick={() => handleClearanceUpdate(ex.ref, k, v === "cleared" ? "pending" : "cleared")}
                          className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${v === "cleared" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-emerald-50"}`}>
                          {k.replace(/_/g," ")}
                        </button>
                      ))}
                    </div>
                    {settlement.total_settlement && <p className="text-[10px] text-gray-400 mt-1">Settlement: {Number(settlement.total_settlement).toLocaleString()} SAR</p>}
                  </div>
                );
              })}
              {exits.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No exit requests</div>}
            </div>
          </div>
        )}

        {/* REPORTS */}
        {tab === "Recruitment" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recruitment Pipeline</h2>
              <button onClick={() => setShowCreateJob(!showCreateJob)} className="px-4 py-2 rounded-xl bg-violet-500 text-white text-xs font-semibold hover:bg-violet-600 shadow-sm shadow-violet-200">{showCreateJob ? "Cancel" : "+ New Job"}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatCard label="Open Positions" value={recruitmentData?.stats?.open_count || 0} color="text-violet-700" />
              <StatCard label="Total Applications" value={recruitmentData?.applications?.length || 0} color="text-blue-700" />
              <StatCard label="Total Postings" value={recruitmentData?.stats?.total || 0} color="text-gray-700" />
            </div>
            {showCreateJob && (
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Create Job Posting</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Job Title *" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-200" />
                  <input placeholder="Department *" value={newJob.department} onChange={e => setNewJob({...newJob, department: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-200" />
                  <input placeholder="Salary Range (e.g. 10,000-15,000 SAR)" value={newJob.salary_range} onChange={e => setNewJob({...newJob, salary_range: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-200" />
                  <input placeholder="Location" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-200" />
                  <select value={newJob.employment_type} onChange={e => setNewJob({...newJob, employment_type: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-200">
                    <option value="full_time">Full Time</option><option value="part_time">Part Time</option><option value="contract">Contract</option><option value="internship">Internship</option>
                  </select>
                </div>
                <textarea placeholder="Description" value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs h-16 resize-none focus:outline-none focus:ring-2 focus:ring-violet-200" />
                <textarea placeholder="Requirements" value={newJob.requirements} onChange={e => setNewJob({...newJob, requirements: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs h-14 resize-none focus:outline-none focus:ring-2 focus:ring-violet-200" />
                <button onClick={async () => { if (!newJob.title || !newJob.department) return; await fetch("/api/admin?action=create_job", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(newJob) }); setShowCreateJob(false); setNewJob({title:"",department:"",description:"",requirements:"",salary_range:"",location:"Riyadh",employment_type:"full_time"}); adminFetch("section=recruitment").then(d => d && setRecruitmentData(d)); }} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 shadow-sm shadow-emerald-200">Create Posting</button>
              </div>
            )}
            {/* Job Postings Table */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-900">Job Postings</h3></div>
              <div className="max-h-[350px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0"><tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Ref</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Title</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Dept</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Location</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Salary</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Apps</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Status</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {(recruitmentData?.jobs || []).map((j: any) => (
                      <tr key={j.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-gray-400">{j.ref}</td>
                        <td className="px-4 py-2 font-semibold text-gray-900">{j.title}</td>
                        <td className="px-4 py-2 text-gray-600">{j.department}</td>
                        <td className="px-4 py-2 text-gray-600">{j.location}</td>
                        <td className="px-4 py-2 text-emerald-600 font-medium">{j.salary_range}</td>
                        <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-semibold">{j.app_count}</span></td>
                        <td className="px-4 py-2"><Badge text={j.status} color={j.status === "open" ? "emerald" : "gray"} /></td>
                        <td className="px-4 py-2">
                          {j.status === "open" && <button onClick={async () => { await fetch("/api/admin?action=update_job_status", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ job_id: j.id, status: "closed" }) }); adminFetch("section=recruitment").then(d => d && setRecruitmentData(d)); }} className="text-[10px] text-red-500 hover:underline">Close</button>}
                          {j.status !== "open" && <button onClick={async () => { await fetch("/api/admin?action=update_job_status", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ job_id: j.id, status: "open" }) }); adminFetch("section=recruitment").then(d => d && setRecruitmentData(d)); }} className="text-[10px] text-emerald-500 hover:underline">Reopen</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Applications Table */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-900">Applications ({(recruitmentData?.applications || []).length})</h3></div>
              <div className="max-h-[350px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0"><tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Ref</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Candidate</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Position</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Stage</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Score</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-500">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {(recruitmentData?.applications || []).map((a: any) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-gray-400">{a.ref}</td>
                        <td className="px-4 py-2"><div className="font-semibold text-gray-900">{a.candidate_name}</div><div className="text-[10px] text-gray-400">{a.candidate_email}</div></td>
                        <td className="px-4 py-2 text-gray-600">{a.job_title}</td>
                        <td className="px-4 py-2"><Badge text={a.stage} color={a.stage === "hired" ? "emerald" : a.stage === "rejected" ? "red" : a.stage === "offer" ? "violet" : a.stage === "interview" ? "amber" : "blue"} /></td>
                        <td className="px-4 py-2">{a.score > 0 ? <span className="font-bold">{a.score}%</span> : <span className="text-gray-300">--</span>}</td>
                        <td className="px-4 py-2 space-x-2">
                          {a.stage === "screening" && <button onClick={async () => { await fetch("/api/admin?action=advance_application", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ app_id: a.id, stage: "interview", status: "shortlisted" }) }); adminFetch("section=recruitment").then(d => d && setRecruitmentData(d)); }} className="text-[10px] text-amber-600 hover:underline font-semibold">Shortlist</button>}
                          {a.stage === "interview" && <button onClick={async () => { await fetch("/api/admin?action=advance_application", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ app_id: a.id, stage: "offer", status: "offered" }) }); adminFetch("section=recruitment").then(d => d && setRecruitmentData(d)); }} className="text-[10px] text-violet-600 hover:underline font-semibold">Make Offer</button>}
                          {a.stage === "offer" && <button onClick={async () => { await fetch("/api/admin?action=advance_application", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ app_id: a.id, stage: "hired", status: "hired" }) }); adminFetch("section=recruitment").then(d => d && setRecruitmentData(d)); }} className="text-[10px] text-emerald-600 hover:underline font-semibold">Hire</button>}
                          {a.stage !== "rejected" && a.stage !== "hired" && <button onClick={async () => { await fetch("/api/admin?action=advance_application", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ app_id: a.id, stage: "rejected", status: "rejected" }) }); adminFetch("section=recruitment").then(d => d && setRecruitmentData(d)); }} className="text-[10px] text-red-400 hover:underline">Reject</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {tab === "Geofencing" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Geofencing & GPS</h2>
                <p className="text-xs text-gray-500 mt-1">Manage office locations and attendance boundaries. Employees must clock in from within these zones.</p>
              </div>
              <button onClick={() => setShowCreateFence(!showCreateFence)} className="px-4 py-2 rounded-xl bg-teal-500 text-white text-xs font-semibold hover:bg-teal-600 transition-colors shadow-sm shadow-teal-200">
                {showCreateFence ? "Cancel" : "+ Add Location"}
              </button>
            </div>
            {showCreateFence && (
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Register New Office Location</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Location Name" value={newFence.name} onChange={e => setNewFence({...newFence, name: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-200" />
                  <input placeholder="Address" value={newFence.address} onChange={e => setNewFence({...newFence, address: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-200" />
                  <input placeholder="Latitude" type="number" step="any" value={newFence.latitude} onChange={e => setNewFence({...newFence, latitude: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-200" />
                  <input placeholder="Longitude" type="number" step="any" value={newFence.longitude} onChange={e => setNewFence({...newFence, longitude: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-200" />
                  <input placeholder="Radius (meters)" type="number" value={newFence.radius_meters} onChange={e => setNewFence({...newFence, radius_meters: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-200" />
                  <input placeholder="Description" value={newFence.description} onChange={e => setNewFence({...newFence, description: e.target.value})} className="px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-200" />
                </div>
                <button onClick={async () => { if (!newFence.name || !newFence.latitude || !newFence.longitude) return; await fetch("/api/admin?action=create_geofence", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({...newFence, latitude: parseFloat(newFence.latitude), longitude: parseFloat(newFence.longitude), radius_meters: parseInt(newFence.radius_meters)}) }); setShowCreateFence(false); setNewFence({ name:"", latitude:"", longitude:"", radius_meters:"200", address:"", description:"" }); adminFetch("section=geofences").then(d => d && setGeofenceData(d)); }} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 shadow-sm shadow-emerald-200">
                  Add Location
                </button>
              </div>
            )}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Office Locations ({(geofenceData?.geofences || []).length})</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {(geofenceData?.geofences || []).map((f: any) => (
                  <div key={f.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{f.name}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">{f.address}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{f.latitude?.toFixed(4)}, {f.longitude?.toFixed(4)} &middot; {f.radius_meters}m radius</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${f.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>{f.is_active ? "Active" : "Inactive"}</span>
                        <button onClick={async () => { await fetch("/api/admin?action=delete_geofence", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: f.id }) }); adminFetch("section=geofences").then(d => d && setGeofenceData(d)); }} className="text-[10px] text-red-400 hover:text-red-600">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                {(geofenceData?.geofences || []).length === 0 && <div className="px-5 py-8 text-center text-xs text-gray-400">No office locations registered yet.</div>}
              </div>
            </div>
          </div>
        )}
        {tab === "Workflows" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Approval Workflows</h2>
                <p className="text-xs text-gray-500 mt-1">Multi-level approval chains for leaves, expenses, loans, and exit requests.</p>
              </div>
              <button onClick={() => setShowWorkflowBuilder(!showWorkflowBuilder)} className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 shadow-sm shadow-indigo-200">
                {showWorkflowBuilder ? "Cancel" : "+ New Workflow"}
              </button>
            </div>
            {showWorkflowBuilder && (
              <WorkflowBuilder
                onCancel={() => setShowWorkflowBuilder(false)}
                onSave={async (wf) => {
                  await fetch("/api/admin?action=create_workflow", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(wf) });
                  setShowWorkflowBuilder(false);
                  adminFetch("section=workflows").then(d => d && setWorkflowData(d));
                }}
              />
            )}
            {/* Workflow Definitions */}
            <div className="space-y-3">
              {(workflowData?.workflows || []).map((w: any) => {
                const steps = typeof w.steps === "string" ? JSON.parse(w.steps) : (w.steps || []);
                return (
                  <div key={w.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{w.description || w.name}</h3>
                        <p className="text-[10px] text-gray-400">Entity: {w.entity_type?.replace("_", " ")} &middot; {steps.length} steps</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${w.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>{w.is_active ? "Active" : "Disabled"}</span>
                      <button onClick={async () => { await fetch("/api/admin?action=toggle_workflow", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: w.id, is_active: !w.is_active }) }); adminFetch("section=workflows").then(d => d && setWorkflowData(d)); }} className="text-[10px] text-indigo-500 hover:underline">{w.is_active ? "Disable" : "Enable"}</button>
                      <button onClick={async () => { if (!confirm("Delete this workflow?")) return; await fetch("/api/admin?action=delete_workflow", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: w.id }) }); adminFetch("section=workflows").then(d => d && setWorkflowData(d)); }} className="text-[10px] text-red-400 hover:underline">Delete</button>
                    </div>
                    <div className="px-5 py-3 flex items-center gap-1 overflow-x-auto">
                      {steps.map((s: any, i: number) => (
                        <div key={i} className="flex items-center shrink-0">
                          <div className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
                            <p className="text-[10px] font-bold text-indigo-700">Step {i+1}</p>
                            <p className="text-[10px] text-gray-700">{s.label}</p>
                            <p className="text-[9px] text-gray-400">{s.role}</p>
                            {s.condition && <p className="text-[8px] text-amber-600 mt-0.5">if {s.condition}</p>}
                          </div>
                          {i < steps.length - 1 && <svg className="w-4 h-4 text-gray-300 mx-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Recent Approval Requests */}
            {(workflowData?.requests || []).length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Recent Approval Requests</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0"><tr>
                      <th className="text-left px-4 py-2 font-semibold text-gray-500">Ref</th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-500">Workflow</th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-500">Entity</th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-500">Step</th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-500">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {(workflowData?.requests || []).map((r: any) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono text-gray-400">{r.ref}</td>
                          <td className="px-4 py-2 text-gray-700">{r.workflow_name}</td>
                          <td className="px-4 py-2 text-gray-600">{r.entity_type?.replace("_", " ")} ({r.entity_ref})</td>
                          <td className="px-4 py-2">{r.current_step + 1}</td>
                          <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${r.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : r.status === "rejected" ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        {tab === "Templates" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Letter Templates</h2>
            <p className="text-xs text-gray-500">Customize the content, header, and footer of HR letters. Changes apply to all new letters generated.</p>
            <TemplatesPanel />
          </div>
        )}
        {tab === "Audit Log" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Audit Trail</h3>
                <p className="text-xs text-gray-500 mt-0.5">{auditLog.length} entries</p>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">Time</th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">Actor</th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">Action</th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">Entity</th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {auditLog.map((e: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{String(e.timestamp || "").slice(0,16).replace("T"," ")}</td>
                        <td className="px-4 py-2 font-medium text-gray-800">{e.actor_id || e.actor}</td>
                        <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">{(e.action || "").replace(/_/g," ").toUpperCase()}</span></td>
                        <td className="px-4 py-2 text-gray-600">{e.entity_type} <span className="font-mono text-gray-400">{e.entity_id}</span></td>
                        <td className="px-4 py-2 text-gray-400 max-w-[200px] truncate">{JSON.stringify(e.details || {})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {auditLog.length === 0 && <div className="px-5 py-8 text-center text-sm text-gray-400">No audit entries yet</div>}
              </div>
            </div>
          </div>
        )}
        {tab === "Reports" && reports && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Headcount" value={reports.totalEmployees} color="text-gray-900" />
              <StatCard label="Monthly Payroll" value={`${(reports.totalPayroll/1000).toFixed(0)}K SAR`} color="text-emerald-600" />
              <StatCard label="Active Exits" value={reports.activeExits} color="text-red-600" />
              <StatCard label="Expiring Docs (90d)" value={reports.expiringDocs} color="text-amber-600" />
              <StatCard label="Leave Requests" value={reports.leaveStats?.total || 0} color="text-blue-600" />
              <StatCard label="Approved Leave Days" value={reports.leaveStats?.approved || 0} color="text-emerald-600" />
              <StatCard label="Pending Leave Days" value={reports.leaveStats?.pending || 0} color="text-amber-600" />
            </div>
            <RechartsBarChart departments={reports.departments} nationalities={reports.nationalities} leaveStats={reports.leaveStats} />
            <button onClick={() => {
              const csv = ["Department,Headcount,Monthly Cost"];
              (reports.departments || []).forEach((d: any) => csv.push(`${d.department},${d.count},${d.cost}`));
              const blob = new Blob([csv.join("\n")], { type: "text/csv" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "taliq_report.csv"; a.click();
            }} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600">Export CSV</button>
          </div>
        )}
      </div>
    </div>
  );
}
