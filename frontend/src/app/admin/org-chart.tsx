"use client";
import { useState, useEffect } from "react";

type Employee = {
  id: string; name: string; position: string; department: string;
  manager_id: string; manager_name: string; grade: string;
};

export default function OrgChart() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payroll?section=org_chart").then(r => r.json()).then(d => {
      setEmployees(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>;

  // Build tree
  const byId: Record<string, Employee> = {};
  const children: Record<string, Employee[]> = {};
  for (const e of employees) {
    byId[e.id] = e;
    const pid = e.manager_id || "root";
    if (!children[pid]) children[pid] = [];
    children[pid].push(e);
  }

  // Find roots (no manager or manager not in list)
  const roots = employees.filter(e => !e.manager_id || !byId[e.manager_id]);

  const DEPT_COLORS: Record<string, string> = {
    "Human Resources": "border-emerald-400 bg-emerald-50",
    "Information Technology": "border-blue-400 bg-blue-50",
    "Finance": "border-amber-400 bg-amber-50",
    "Administration": "border-purple-400 bg-purple-50",
    "Operations": "border-red-400 bg-red-50",
  };

  function renderNode(emp: Employee, depth: number) {
    const kids = children[emp.id] || [];
    const color = DEPT_COLORS[emp.department] || "border-gray-300 bg-gray-50";
    return (
      <div key={emp.id} className={`${depth > 0 ? "ml-8" : ""}`}>
        <div className={`border-2 rounded-xl p-3 mb-2 ${color} shadow-sm hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
              {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800 text-sm truncate">{emp.name}</div>
              <div className="text-xs text-gray-500">{emp.position}</div>
              <div className="text-xs text-gray-400 mt-0.5">{emp.department} {emp.grade ? `· ${emp.grade}` : ""}</div>
            </div>
            {kids.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white text-xs font-medium text-gray-600 border">{kids.length}</span>
            )}
          </div>
        </div>
        {kids.length > 0 && (
          <div className="border-l-2 border-gray-200 ml-5">
            {kids.map(k => renderNode(k, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800">Organisation Chart</h3>
          <p className="text-xs text-gray-500 mt-0.5">{employees.length} employees across {new Set(employees.map(e => e.department)).size} departments</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(DEPT_COLORS).map(([dept, cls]) => (
            <span key={dept} className={`px-2 py-0.5 rounded-full text-xs border ${cls}`}>{dept.split(" ")[0]}</span>
          ))}
        </div>
      </div>
      <div className="max-h-[600px] overflow-y-auto pr-2">
        {roots.map(r => renderNode(r, 0))}
      </div>
    </div>
  );
}
