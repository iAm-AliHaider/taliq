"use client";

import { useState } from "react";

interface HelpPanelProps {
  isManager: boolean;
  isAdmin?: boolean;
  onClose: () => void;
  onCommand?: (prompt: string) => void;
}

interface CommandItem {
  label: string;
  prompt: string;
  icon: string;
}

interface CommandSection {
  title: string;
  icon: string;
  color: string;
  commands: CommandItem[];
  role: "all" | "manager" | "admin";
}

const COMMAND_SECTIONS: CommandSection[] = [
  {
    title: "Dashboard & Status",
    icon: "📊",
    color: "emerald",
    role: "all",
    commands: [
      { label: "Show dashboard", prompt: "Show my dashboard", icon: "🏠" },
      { label: "My status overview", prompt: "Show my status", icon: "📋" },
      { label: "Show all my requests", prompt: "Show my requests", icon: "📄" },
      { label: "Show announcements", prompt: "Show announcements", icon: "📢" },
      { label: "Acknowledge announcement", prompt: "Acknowledge the latest announcement", icon: "✅" },
      { label: "Show notifications", prompt: "Show notifications", icon: "🔔" },
    ],
  },
  {
    title: "Leave Management",
    icon: "🏖️",
    color: "blue",
    role: "all",
    commands: [
      { label: "Check leave balance", prompt: "Check my leave balance", icon: "📊" },
      { label: "Apply for leave", prompt: "Apply for leave", icon: "✏️" },
      { label: "Show my leave requests", prompt: "Show my leave requests", icon: "📋" },
      { label: "Leave history", prompt: "Show my leave history", icon: "📜" },
    ],
  },
  {
    title: "Attendance",
    icon: "⏰",
    color: "teal",
    role: "all",
    commands: [
      { label: "Clock in", prompt: "Clock me in", icon: "🟢" },
      { label: "Clock out", prompt: "Clock me out", icon: "🔴" },
      { label: "Clock in with GPS", prompt: "Clock me in with GPS", icon: "📍" },
      { label: "Clock out with GPS", prompt: "Clock me out with GPS", icon: "📍" },
      { label: "Show my attendance", prompt: "Show my attendance", icon: "📋" },
      { label: "Request overtime", prompt: "Request overtime approval", icon: "⏱️" },
      { label: "Team attendance", prompt: "Show team attendance", icon: "👥" },
    ],
  },
  {
    title: "Pay & Compensation",
    icon: "💰",
    color: "amber",
    role: "all",
    commands: [
      { label: "Show pay slip", prompt: "Show my pay slip", icon: "💵" },
      { label: "GOSI breakdown", prompt: "Show my GOSI breakdown", icon: "🏛️" },
      { label: "End of service estimate", prompt: "Show my end of service", icon: "📊" },
      { label: "Salary breakdown", prompt: "Show my salary breakdown", icon: "📊" },
      { label: "Payment history", prompt: "Show my payments", icon: "💳" },
    ],
  },
  {
    title: "Profile & Documents",
    icon: "👤",
    color: "indigo",
    role: "all",
    commands: [
      { label: "Show my profile", prompt: "Show my profile", icon: "👤" },
      { label: "Edit my profile", prompt: "Edit my profile", icon: "✏️" },
      { label: "Show my documents", prompt: "Show my documents", icon: "📁" },
      { label: "Request a document", prompt: "Request a document", icon: "📄" },
      { label: "Show my contract", prompt: "Show my contract", icon: "📝" },
      { label: "Show my iqama/visa", prompt: "Show my iqama status", icon: "🪪" },
    ],
  },
  {
    title: "Loans",
    icon: "🏦",
    color: "violet",
    role: "all",
    commands: [
      { label: "Check loan eligibility", prompt: "Check my loan eligibility", icon: "✅" },
      { label: "Apply for a loan", prompt: "Apply for a loan", icon: "✏️" },
      { label: "Loan balance", prompt: "Show my loan balance", icon: "📊" },
    ],
  },
  {
    title: "Expenses & Claims",
    icon: "🧾",
    color: "orange",
    role: "all",
    commands: [
      { label: "Submit expense", prompt: "Submit an expense", icon: "➕" },
      { label: "Show my expenses", prompt: "Show my expenses", icon: "📋" },
      { label: "Submit a claim", prompt: "Submit a claim", icon: "➕" },
      { label: "Show my claims", prompt: "Show my claims", icon: "📋" },
      { label: "Show my payments", prompt: "Show my payment history", icon: "💳" },
    ],
  },
  {
    title: "Travel",
    icon: "✈️",
    color: "sky",
    role: "all",
    commands: [
      { label: "Create travel request", prompt: "Create a travel request", icon: "✏️" },
    ],
  },
  {
    title: "Performance & Goals",
    icon: "🎯",
    color: "rose",
    role: "all",
    commands: [
      { label: "Show my performance", prompt: "Show my performance review", icon: "📊" },
      { label: "Show my goals", prompt: "Show my goals", icon: "🎯" },
      { label: "Set a new goal", prompt: "Set a new goal", icon: "➕" },
      { label: "Update goal progress", prompt: "Update my goal progress", icon: "📈" },
      { label: "Create performance review", prompt: "Create a performance review", icon: "📝" },
    ],
  },
  {
    title: "Training & Development",
    icon: "📚",
    color: "cyan",
    role: "all",
    commands: [
      { label: "Available courses", prompt: "Show available trainings", icon: "📚" },
      { label: "Enroll in course", prompt: "Enroll in a training course", icon: "✏️" },
      { label: "Show training progress", prompt: "Show my training progress", icon: "📈" },
      { label: "My trainings", prompt: "Show my trainings", icon: "📋" },
    ],
  },
  {
    title: "Grievances",
    icon: "⚠️",
    color: "red",
    role: "all",
    commands: [
      { label: "File a complaint", prompt: "File a grievance", icon: "✏️" },
      { label: "Show my grievances", prompt: "Show my grievances", icon: "📋" },
      { label: "File harassment complaint", prompt: "File a harassment grievance", icon: "🚨" },
    ],
  },
  {
    title: "Letters",
    icon: "✉️",
    color: "purple",
    role: "all",
    commands: [
      { label: "Generate letter", prompt: "Generate an employment certificate", icon: "📄" },
      { label: "Salary certificate", prompt: "Generate a salary certificate", icon: "💰" },
      { label: "Experience letter", prompt: "Generate an experience letter", icon: "📜" },
      { label: "Show my letters", prompt: "Show my letters", icon: "📋" },
    ],
  },
  {
    title: "Assets & Shifts",
    icon: "🖥️",
    color: "gray",
    role: "all",
    commands: [
      { label: "Show my assets", prompt: "Show my assets", icon: "🖥️" },
      { label: "Show my shift", prompt: "Show my shift schedule", icon: "📅" },
      { label: "Show payroll report", prompt: "Show payroll summary", icon: "💰" },
      { label: "Show HR report", prompt: "Show HR report", icon: "📊" },
    ],
  },
  {
    title: "Directory & Org",
    icon: "🔍",
    color: "slate",
    role: "all",
    commands: [
      { label: "Search directory", prompt: "Search the employee directory", icon: "🔍" },
      { label: "Org chart", prompt: "Show the org chart", icon: "🏢" },
    ],
  },
  {
    title: "Exit & Offboarding",
    icon: "🚪",
    color: "stone",
    role: "all",
    commands: [
      { label: "Initiate resignation", prompt: "I want to resign", icon: "🚪" },
      { label: "Check exit status", prompt: "Show my exit status", icon: "📋" },
      { label: "Show all exit requests", prompt: "Show all exit requests", icon: "📋" },
    ],
  },
  // ── Manager-only ──
  {
    title: "Team Approvals",
    icon: "✅",
    color: "emerald",
    role: "manager",
    commands: [
      { label: "All pending approvals", prompt: "Show all pending approvals", icon: "📋" },
      { label: "Approve leave", prompt: "Show pending leave requests", icon: "✅" },
      { label: "Approve loan", prompt: "Show pending loan requests", icon: "✅" },
      { label: "Approve travel", prompt: "Show pending travel requests", icon: "✅" },
      { label: "Approve overtime", prompt: "Show pending overtime requests", icon: "✅" },
      { label: "Approve document", prompt: "Show pending document requests", icon: "✅" },
      { label: "Pending expenses", prompt: "Show pending expenses", icon: "🧾" },
      { label: "Pending claims", prompt: "Show pending claims", icon: "🧾" },
    ],
  },
  {
    title: "Team Analytics",
    icon: "📈",
    color: "blue",
    role: "manager",
    commands: [
      { label: "Team overview", prompt: "Show team overview", icon: "👥" },
      { label: "Department stats", prompt: "Show department stats", icon: "📊" },
      { label: "Team performance", prompt: "Show team performance", icon: "📈" },
      { label: "Training compliance", prompt: "Show training compliance", icon: "📚" },
      { label: "Leave analytics", prompt: "Show leave analytics", icon: "📊" },
      { label: "Leave calendar", prompt: "Show leave calendar", icon: "📅" },
      { label: "Headcount report", prompt: "Show headcount report", icon: "👥" },
      { label: "HR report", prompt: "Show HR report", icon: "📊" },
      { label: "Payroll summary", prompt: "Show payroll summary", icon: "💰" },
    ],
  },
  {
    title: "Team Administration",
    icon: "⚙️",
    color: "violet",
    role: "manager",
    commands: [
      { label: "Employee 360 view", prompt: "Show employee details for E001", icon: "👤" },
      { label: "Reassign employee", prompt: "Reassign a team member", icon: "🔄" },
      { label: "Team grievances", prompt: "Show team grievances", icon: "⚠️" },
      { label: "Resolve grievance", prompt: "Resolve a team grievance", icon: "✅" },
      { label: "Team shifts", prompt: "Show team shifts", icon: "📅" },
      { label: "All assets", prompt: "Show all assets", icon: "🖥️" },
      { label: "Expiring contracts", prompt: "Show expiring contracts", icon: "📝" },
      { label: "Expiring documents", prompt: "Show expiring documents", icon: "📄" },
      { label: "All exits", prompt: "Show all exits", icon: "🚪" },
      { label: "All payments", prompt: "Show all payments", icon: "💳" },
    ],
  },
  // ── Admin-only ──
  {
    title: "Admin Operations",
    icon: "🛡️",
    color: "red",
    role: "admin",
    commands: [
      { label: "View audit log", prompt: "Show the audit log", icon: "📜" },
      { label: "Bulk approve leaves", prompt: "Bulk approve all pending leaves", icon: "✅" },
      { label: "Bulk approve expenses", prompt: "Bulk approve all pending expenses", icon: "✅" },
      { label: "Send notifications", prompt: "Send pending notifications", icon: "📤" },
    ],
  },
  {
    title: "Recruitment",
    icon: "🎯",
    color: "pink",
    role: "manager",
    commands: [
      { label: "List job postings", prompt: "List all job postings", icon: "📋" },
      { label: "Create job posting", prompt: "Create a new job posting", icon: "➕" },
      { label: "List applications", prompt: "List all applications", icon: "👥" },
      { label: "Recruitment stats", prompt: "Show recruitment stats", icon: "📊" },
      { label: "View job details", prompt: "View details of a job posting", icon: "📄" },
      { label: "Advance candidate", prompt: "Advance a candidate to next stage", icon: "⏩" },
      { label: "Close job posting", prompt: "Close a job posting", icon: "🔒" },
    ],
  },
  {
    title: "Geofencing",
    icon: "📍",
    color: "teal",
    role: "manager",
    commands: [
      { label: "List office locations", prompt: "List office locations", icon: "📍" },
      { label: "Manage geofence", prompt: "Manage geofence settings", icon: "⚙️" },
    ],
  },
  {
    title: "Approval Workflows",
    icon: "🔄",
    color: "indigo",
    role: "manager",
    commands: [
      { label: "View pending approvals", prompt: "View pending workflow approvals", icon: "📋" },
      { label: "View approval chain", prompt: "Show the approval chain", icon: "🔗" },
      { label: "Approve workflow request", prompt: "Approve a pending workflow request", icon: "✅" },
      { label: "Reject workflow request", prompt: "Reject a pending workflow request", icon: "❌" },
      { label: "Show all workflows", prompt: "Show approval workflows", icon: "🔄" },
    ],
  },
  {
    title: "AI Interviews",
    icon: "🎤",
    color: "purple",
    role: "manager",
    commands: [
      { label: "Start interview", prompt: "Start an interview for a candidate", icon: "🎤" },
      { label: "Show interview results", prompt: "Show interview results", icon: "📊" },
    ],
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  emerald: { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  blue: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  teal: { bg: "bg-teal-50", border: "border-teal-100", text: "text-teal-700", badge: "bg-teal-100 text-teal-700" },
  amber: { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700" },
  violet: { bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
  orange: { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  sky: { bg: "bg-sky-50", border: "border-sky-100", text: "text-sky-700", badge: "bg-sky-100 text-sky-700" },
  rose: { bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-100", text: "text-cyan-700", badge: "bg-cyan-100 text-cyan-700" },
  red: { bg: "bg-red-50", border: "border-red-100", text: "text-red-700", badge: "bg-red-100 text-red-700" },
  purple: { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
  gray: { bg: "bg-gray-50", border: "border-gray-100", text: "text-gray-700", badge: "bg-gray-100 text-gray-700" },
  slate: { bg: "bg-slate-50", border: "border-slate-100", text: "text-slate-700", badge: "bg-slate-100 text-slate-700" },
  stone: { bg: "bg-stone-50", border: "border-stone-100", text: "text-stone-700", badge: "bg-stone-100 text-stone-700" },
  pink: { bg: "bg-pink-50", border: "border-pink-100", text: "text-pink-700", badge: "bg-pink-100 text-pink-700" },
};

export function HelpPanel({ isManager, isAdmin, onClose, onCommand }: HelpPanelProps) {
  const [search, setSearch] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const filteredSections = COMMAND_SECTIONS
    .filter((s) => {
      if (s.role === "all") return true;
      if (s.role === "manager" && (isManager || isAdmin)) return true;
      if (s.role === "admin" && isAdmin) return true;
      return false;
    })
    .map((s) => ({
      ...s,
      commands: search
        ? s.commands.filter(
            (c) =>
              c.label.toLowerCase().includes(search.toLowerCase()) ||
              c.prompt.toLowerCase().includes(search.toLowerCase())
          )
        : s.commands,
    }))
    .filter((s) => s.commands.length > 0);

  const totalCommands = filteredSections.reduce((sum, s) => sum + s.commands.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden" style={{ maxHeight: "85vh" }}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-lg font-bold">?</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Voice Commands</h2>
                <p className="text-[11px] text-gray-400">
                  {totalCommands} commands available
                  {isManager && !isAdmin && " · Manager"}
                  {isAdmin && " · Admin"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search commands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all"
            />
          </div>
        </div>

        {/* Role badges */}
        {(isManager || isAdmin) && (
          <div className="px-5 py-2 border-b border-gray-50 flex gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">Employee</span>
            {isManager && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">Manager</span>}
            {isAdmin && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold">Admin</span>}
          </div>
        )}

        {/* Command sections */}
        <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: "calc(85vh - 180px)" }}>
          {filteredSections.map((section) => {
            const colors = COLOR_MAP[section.color] || COLOR_MAP.gray;
            const isExpanded = expandedSection === section.title || !!search;

            return (
              <div key={section.title} className={`rounded-xl border ${colors.border} overflow-hidden transition-all`}>
                <button
                  onClick={() => setExpandedSection(isExpanded && !search ? null : section.title)}
                  className={`w-full flex items-center justify-between px-4 py-3 ${colors.bg} hover:brightness-95 transition-all`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{section.icon}</span>
                    <span className={`text-sm font-semibold ${colors.text}`}>{section.title}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${colors.badge}`}>
                      {section.commands.length}
                    </span>
                    {section.role !== "all" && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                        section.role === "admin" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                      }`}>
                        {section.role}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 ${colors.text} transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-2 py-1.5 bg-white border-t border-gray-50">
                    {section.commands.map((cmd) => (
                      <button
                        key={cmd.prompt}
                        onClick={() => {
                          onCommand?.(cmd.prompt);
                          onClose();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group text-left"
                      >
                        <span className="text-sm opacity-60 group-hover:opacity-100 transition-opacity">{cmd.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 font-medium truncate">{cmd.label}</p>
                          <p className="text-[11px] text-gray-400 truncate">"{cmd.prompt}"</p>
                        </div>
                        <svg className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredSections.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No commands match "{search}"</p>
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-[11px] text-gray-400 text-center">
            Tap a command to send it to Taliq, or just speak naturally
          </p>
        </div>
      </div>
    </div>
  );
}
