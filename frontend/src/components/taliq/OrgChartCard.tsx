"use client";

import dynamic from "next/dynamic";
const Tree = dynamic(() => import("react-organizational-chart").then(m => m.Tree), { ssr: false });
const TreeNode = dynamic(() => import("react-organizational-chart").then(m => m.TreeNode), { ssr: false });

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  managerId: string | null;
  grade: string;
}

const DEPT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Executive: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700" },
  "Human Resources": { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-700" },
  "Information Technology": { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700" },
  Finance: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700" },
};

const DEPT_GRADIENT: Record<string, string> = {
  Executive: "from-purple-400 to-purple-600",
  "Human Resources": "from-pink-400 to-pink-600",
  "Information Technology": "from-blue-400 to-blue-600",
  Finance: "from-emerald-400 to-emerald-600",
};

function NodeCard({ emp, isRoot }: { emp: Employee; isRoot?: boolean }) {
  const colors = DEPT_COLORS[emp.department] || { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-700" };
  const grad = DEPT_GRADIENT[emp.department] || "from-gray-400 to-gray-600";
  return (
    <div
      className={`inline-flex flex-col items-center px-4 py-3 rounded-xl border-2 ${colors.border} ${colors.bg} shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-default ${isRoot ? "ring-2 ring-purple-200 ring-offset-2" : ""}`}
    >
      <div
        className={`${isRoot ? "w-12 h-12" : "w-9 h-9"} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center mb-1.5 shadow-inner`}
      >
        <span className={`text-white font-bold ${isRoot ? "text-sm" : "text-[10px]"}`}>
          {emp.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </span>
      </div>
      <p className={`font-semibold text-gray-900 ${isRoot ? "text-sm" : "text-xs"} text-center leading-tight`}>
        {emp.name}
      </p>
      <p className={`text-[10px] ${colors.text} font-medium text-center`}>{emp.position}</p>
      <span className={`mt-1 px-2 py-0.5 rounded-full text-[8px] font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
        {emp.department}
      </span>
    </div>
  );
}

function OrgNode({ emp, employees }: { emp: Employee; employees: Employee[] }) {
  const reports = employees.filter((e) => e.managerId === emp.id);
  if (reports.length === 0) {
    return <TreeNode label={<NodeCard emp={emp} />} />;
  }
  return (
    <TreeNode label={<NodeCard emp={emp} />}>
      {(reports || []).map((r) => (
        <OrgNode key={r.id} emp={r} employees={employees} />
      ))}
    </TreeNode>
  );
}

export function OrgChartCard({ employees }: { employees: Employee[] }) {
  const roots = employees.filter((e) => !e.managerId);
  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-400">
        No organization data available
      </div>
    );
  }

  // Use first root as the tree root; if multiple roots, pick the executive
  const root = roots.find((r) => r.department === "Executive") || roots[0];
  const otherRoots = roots.filter((r) => r.id !== root.id);
  const reports = employees.filter((e) => e.managerId === root.id);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
        <h3 className="text-sm font-bold text-gray-900">Organization Chart</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">{employees.length} employees across {[...new Set((employees || []).map((e) => e.department))].length} departments</p>
      </div>
      <div className="p-6 overflow-x-auto">
        <Tree
          lineWidth="2px"
          lineColor="#d1d5db"
          lineBorderRadius="8px"
          nodePadding="8px"
          label={<NodeCard emp={root} isRoot />}
        >
          {(reports || []).map((r) => (
            <OrgNode key={r.id} emp={r} employees={employees} />
          ))}
          {(otherRoots || []).map((r) => (
            <OrgNode key={r.id} emp={r} employees={employees} />
          ))}
        </Tree>
      </div>
    </div>
  );
}
