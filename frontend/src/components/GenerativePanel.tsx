"use client";

import { useEffect, useRef } from "react";
import { LeaveRequestForm } from "./taliq/LeaveRequestForm";
import { LeaveBalanceCard } from "./taliq/LeaveBalanceCard";
import { EmployeeProfileCard } from "./taliq/EmployeeProfileCard";
import { InterviewPanel } from "./taliq/InterviewPanel";
import { ApprovalQueue } from "./taliq/ApprovalQueue";
import { AttendanceDashboard } from "./taliq/AttendanceDashboard";
import { PaySlipCard } from "./taliq/PaySlipCard";
import { StatusBanner } from "./taliq/StatusBanner";

interface ComponentItem {
  id: string;
  component: string;
  props: Record<string, unknown>;
}

interface GenerativePanelProps {
  components: ComponentItem[];
  onClear: () => void;
}

const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  LeaveRequestForm,
  LeaveBalanceCard,
  EmployeeProfileCard,
  InterviewPanel,
  ApprovalQueue,
  AttendanceDashboard,
  PaySlipCard,
  StatusBanner,
};

export function GenerativePanel({ components, onClear }: GenerativePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && components.length > 0) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [components.length]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-medium text-zinc-400">HR Dashboard</h2>
        {components.length > 0 && (
          <button onClick={onClear} className="text-xs text-zinc-500 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/10">
            Clear
          </button>
        )}
      </div>

      {/* Widgets */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {components.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-amber-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl">تَلِيق</span>
            </div>
            <p className="text-zinc-500 text-sm">Speak to interact with HR</p>
            <p className="text-zinc-600 text-xs mt-1">Try: &ldquo;Check my leave balance&rdquo;</p>
          </div>
        ) : (
          components.map((item, index) => {
            const Component = COMPONENT_MAP[item.component];
            if (!Component) return null;
            return (
              <div
                key={item.id}
                className="animate-in"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
              >
                <div className="rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/10 overflow-hidden shadow-lg shadow-black/20">
                  <Component {...item.props} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
