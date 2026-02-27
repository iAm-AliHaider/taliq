"use client";

import { useEffect, useRef } from "react";
import { ComponentItem, TaliqActions } from "./TaliqProvider";
import { LeaveBalanceCard } from "./taliq/LeaveBalanceCard";
import { LeaveRequestForm } from "./taliq/LeaveRequestForm";
import { EmployeeProfileCard } from "./taliq/EmployeeProfileCard";
import { ProfileEditCard } from "./taliq/ProfileEditCard";
import { PaySlipCard } from "./taliq/PaySlipCard";
import { InterviewPanel } from "./taliq/InterviewPanel";
import { ApprovalQueue } from "./taliq/ApprovalQueue";
import { AttendanceDashboard } from "./taliq/AttendanceDashboard";
import { StatusBanner } from "./taliq/StatusBanner";
import { LoanCard } from "./taliq/LoanCard";
import { LoanApplicationForm } from "./taliq/LoanApplicationForm";
import { DocumentRequestCard } from "./taliq/DocumentRequestCard";
import { DocumentRequestForm } from "./taliq/DocumentRequestForm";
import { AnnouncementCard } from "./taliq/AnnouncementCard";
import { TravelRequestCard } from "./taliq/TravelRequestCard";
import { TravelRequestForm } from "./taliq/TravelRequestForm";
import { ManagerDashboard } from "./taliq/ManagerDashboard";
import { TeamOverviewCard } from "./taliq/TeamOverviewCard";
import { ClockInCard } from "./taliq/ClockInCard";
import { MyAttendanceCard } from "./taliq/MyAttendanceCard";

const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  LeaveBalanceCard,
  LeaveRequestForm,
  EmployeeProfileCard,
  ProfileEditCard,
  PaySlipCard,
  InterviewPanel,
  ApprovalQueue,
  AttendanceDashboard,
  StatusBanner,
  LoanCard,
  LoanApplicationForm,
  DocumentRequestCard,
  DocumentRequestForm,
  AnnouncementCard,
  TravelRequestCard,
  TravelRequestForm,
  ManagerDashboard,
  TeamOverviewCard,
  ClockInCard,
  MyAttendanceCard,
};

interface Props {
  components: ComponentItem[];
  actions: TaliqActions;
}

export function GenerativePanel({ components, actions }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [components]);

  if (components.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-emerald-600">T</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">HR Dashboard</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Ask Taliq anything or tap a quick action. Interactive cards appear here - approve requests, view details, track workflows.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 mt-2">
            {["Leave", "Payroll", "Loans", "Travel", "Documents", "Attendance"].map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-[10px] text-gray-400 font-medium">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200/80 flex items-center justify-between" style={{ background: "rgba(250,251,252,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Active</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-600 font-bold">{components.length}</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {components.map((item) => {
          const Component = COMPONENT_MAP[item.component];
          if (!Component) {
            console.warn(`Unknown component: ${item.component}`);
            return null;
          }
          return (
            <div key={item.id} className="animate-slide-up">
              <Component {...item.props} onAction={(action: string, payload: Record<string, unknown>) => actions.sendAction(action, payload)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
