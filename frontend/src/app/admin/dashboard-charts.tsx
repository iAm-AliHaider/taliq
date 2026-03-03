"use client";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
type Metric = { metric: string; period: string; value: number };
type EmpGroup = { department: string; nationality: string; cnt: number };
type PayrollRun = { ref: string; period: string; total_gross: number; total_deductions: number; total_net: number; status: string };
type RecentHire = { id: string; name: string; position: string; department: string; join_date: string };

interface DashboardData {
  metrics: Metric[];
  employees: EmpGroup[];
  payrollSummary: PayrollRun[];
  recentHires: RecentHire[];
}

const COLORS = ["#10b981","#6366f1","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899"];

function fmt(n: number) {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n/1000).toFixed(0)}K`;
  return String(n);
}

// ─── Mini stat card ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string|number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="text-xs text-slate-400 font-medium">{label}</div>
      <div className={`text-2xl font-black mt-1 ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function DashboardCharts({ data }: { data: DashboardData | null }) {
  if (!data) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1,2,3,4].map(i => <div key={i} className="animate-pulse h-24 bg-slate-100 rounded-2xl" />)}
    </div>
  );

  const { metrics, employees, payrollSummary, recentHires } = data;

  // Build series by period
  const periods = [...new Set(metrics.map(m => m.period))].sort();
  const byPeriod: Record<string, Record<string, number>> = {};
  for (const m of metrics) {
    if (!byPeriod[m.period]) byPeriod[m.period] = {};
    byPeriod[m.period][m.metric] = Number(m.value);
  }

  const payrollTrend = periods.map(p => ({
    period: p.slice(5),
    cost: byPeriod[p]?.payroll_cost || 0,
    headcount: byPeriod[p]?.headcount || 0,
  }));

  const leaveTrend = periods.map(p => ({
    period: p.slice(5),
    days: byPeriod[p]?.leave_days_used || 0,
  }));

  // Department breakdown
  const deptMap: Record<string, number> = {};
  for (const e of employees) {
    deptMap[e.department] = (deptMap[e.department] || 0) + Number(e.cnt);
  }
  const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

  // Nationality split
  const natMap: Record<string, number> = {};
  for (const e of employees) {
    const k = e.nationality === "Saudi" ? "Saudi" : "Non-Saudi";
    natMap[k] = (natMap[k] || 0) + Number(e.cnt);
  }
  const natData = Object.entries(natMap).map(([name, value]) => ({ name, value }));

  // Payroll bar chart data
  const payrollBars = [...payrollSummary].reverse().map(r => ({
    period: r.period,
    Gross: Number(r.total_gross),
    Deductions: Number(r.total_deductions),
    Net: Number(r.total_net),
  }));

  // KPI cards
  const latestHeadcount = byPeriod[periods[periods.length - 1]]?.headcount || employees.reduce((a, e) => a + Number(e.cnt), 0);
  const latestPayroll = payrollSummary[0]?.total_gross || 0;
  const avgSalary = latestHeadcount ? Math.round(Number(latestPayroll) / latestHeadcount) : 0;
  const totalLeave = (byPeriod[periods[periods.length - 1]]?.leave_days_used || 0);

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Headcount" value={latestHeadcount} sub="employees" color="text-emerald-600" />
        <StatCard label="Monthly Payroll" value={`SAR ${fmt(Number(latestPayroll))}`} sub="gross this month" color="text-violet-600" />
        <StatCard label="Avg. Salary" value={`SAR ${fmt(avgSalary)}`} sub="per employee" color="text-blue-600" />
        <StatCard label="Leave Days (MTD)" value={totalLeave} sub="days used this month" color="text-amber-600" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payroll cost trend */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Payroll Cost Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={payrollTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#94a3b8" }} width={50} />
              <Tooltip formatter={(v: number | undefined) => [`SAR ${Number(v||0).toLocaleString()}`, "Payroll Cost"]} />
              <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Headcount trend */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Headcount Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={payrollTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={30} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="headcount" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Payroll breakdown bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:col-span-2">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Payroll Breakdown by Run</h3>
          {payrollBars.length === 0 ? (
            <div className="text-center py-10 text-slate-300 text-sm">No payroll runs yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={payrollBars} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "#94a3b8" }} width={50} />
                <Tooltip formatter={(v: number | undefined) => `SAR ${Number(v||0).toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Gross" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="Deductions" fill="#f59e0b" radius={[4,4,0,0]} />
                <Bar dataKey="Net" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Dept pie */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm mb-4">By Department</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={deptData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {deptData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-600 truncate">{d.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Leave trend */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Leave Days Used (Monthly)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={leaveTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={30} />
              <Tooltip />
              <Bar dataKey="days" fill="#f59e0b" radius={[4,4,0,0]} name="Leave Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Nationality + recent hires */}
        <div className="space-y-4">
          {/* Saudi vs non-Saudi donut */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Workforce Split</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie data={natData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} dataKey="value" paddingAngle={4}>
                    {natData.map((_, i) => <Cell key={i} fill={i === 0 ? "#10b981" : "#6366f1"} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1">
                {natData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: i === 0 ? "#10b981" : "#6366f1" }} />
                    <span className="text-slate-600">{d.name}</span>
                    <span className="font-bold text-slate-800">{d.value}</span>
                    <span className="text-slate-400">({Math.round(d.value / natData.reduce((a,b)=>a+b.value,0)*100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent hires */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Recent Hires</h3>
            <div className="space-y-2">
              {recentHires.slice(0, 4).map(h => (
                <div key={h.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{h.name}</div>
                    <div className="text-[10px] text-slate-400">{h.position} · {h.department}</div>
                  </div>
                  <div className="text-[10px] text-slate-400">{String(h.join_date || "").slice(0,10)}</div>
                </div>
              ))}
              {recentHires.length === 0 && <div className="text-xs text-slate-300 text-center py-2">No hires yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
