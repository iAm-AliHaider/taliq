"use client";

import { LeaveBalanceCard } from "./taliq/LeaveBalanceCard";
import { LeaveRequestForm } from "./taliq/LeaveRequestForm";
import { EmployeeProfileCard } from "./taliq/EmployeeProfileCard";
import { PaySlipCard } from "./taliq/PaySlipCard";
import { InterviewPanel } from "./taliq/InterviewPanel";
import { ApprovalQueue } from "./taliq/ApprovalQueue";
import { AttendanceDashboard } from "./taliq/AttendanceDashboard";
import { StatusBanner } from "./taliq/StatusBanner";
import { LoanCard } from "./taliq/LoanCard";
import { DocumentRequestCard } from "./taliq/DocumentRequestCard";
import { AnnouncementCard } from "./taliq/AnnouncementCard";
import { TravelRequestCard } from "./taliq/TravelRequestCard";

/* eslint-disable @typescript-eslint/no-explicit-any */
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  LeaveBalanceCard,
  LeaveRequestForm,
  EmployeeProfileCard,
  PaySlipCard,
  InterviewPanel,
  ApprovalQueue,
  AttendanceDashboard,
  StatusBanner,
  LoanCard,
  DocumentRequestCard,
  AnnouncementCard,
  TravelRequestCard,
};

interface UIMessage {
  component: string;
  props: Record<string, any>;
  timestamp?: number;
}

interface Props {
  components: UIMessage[];
  onClear: () => void;
}

export function GenerativePanel({ components, onClear }: Props) {
  if (components.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">HR Dashboard</h3>
        <p className="text-sm text-gray-400 max-w-xs">
          Ask Taliq about your leave balance, pay slip, team attendance, or start an interview.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-sm">
          {["\"What's my leave balance?\"", "\"Show my pay slip\"", "\"Start an interview\"", "\"Show pending approvals\""].map((q) => (
            <span key={q} className="text-[10px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">{q}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80">
        <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">Results</span>
        <button onClick={onClear} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
          Clear All
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {components.map((item, i) => {
          const Comp = COMPONENT_MAP[item.component];
          if (!Comp) return (
            <div key={i} className="card p-4 text-sm text-gray-500">
              Unknown: {item.component}
            </div>
          );
          return (
            <div key={i} className="animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <Comp {...item.props} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
