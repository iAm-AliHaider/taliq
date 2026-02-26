"use client";

import { useEffect, useRef, useState } from "react";
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

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 6) return { en: "Working late?", ar: "سهران؟" };
  if (h < 12) return { en: "Good morning", ar: "صباح الخير" };
  if (h < 17) return { en: "Good afternoon", ar: "مساء النور" };
  if (h < 21) return { en: "Good evening", ar: "مساء الخير" };
  return { en: "Good night", ar: "تصبح على خير" };
}

const SUGGESTIONS = [
  "What's my leave balance?",
  "Apply for 2 days sick leave",
  "Show my pay slip",
  "Start an interview",
  "Who's in office today?",
  "Show pending approvals",
];

export function GenerativePanel({ components, onClear }: GenerativePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const greeting = getTimeGreeting();

  useEffect(() => {
    if (scrollRef.current && components.length > 0) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [components.length]);

  // Rotate suggestions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion(prev => (prev + 1) % SUGGESTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
          <h2 className="text-xs font-medium text-zinc-500 tracking-wider uppercase">Live Dashboard</h2>
        </div>
        {components.length > 0 && (
          <button onClick={onClear} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition px-2 py-1 rounded-lg hover:bg-white/[0.03]">
            Clear ({components.length})
          </button>
        )}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {components.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            {/* Arabic greeting */}
            <p className="text-2xl font-arabic rtl text-zinc-700 mb-1">{greeting.ar}</p>
            <p className="text-sm text-zinc-500 mb-8">{greeting.en}</p>

            {/* Animated suggestion */}
            <div className="relative h-12 w-full max-w-xs overflow-hidden mb-6">
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-500">
                <p className="text-xs text-emerald-500/40 italic">
                  &ldquo;{SUGGESTIONS[currentSuggestion]}&rdquo;
                </p>
              </div>
            </div>

            {/* Geometric decoration */}
            <div className="relative w-24 h-24 mb-4">
              <div className="absolute inset-0 border border-white/[0.04] rounded-2xl rotate-45 animate-breathe" />
              <div className="absolute inset-3 border border-emerald-500/[0.08] rounded-xl rotate-45 animate-breathe" style={{ animationDelay: "-2s" }} />
              <div className="absolute inset-6 border border-amber-500/[0.06] rounded-lg rotate-45 animate-breathe" style={{ animationDelay: "-4s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-zinc-700 text-lg">ت</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-700">Speak or tap a suggestion to begin</p>
          </div>
        ) : (
          components.map((item, index) => {
            const Component = COMPONENT_MAP[item.component];
            if (!Component) return null;
            return (
              <div
                key={item.id}
                className="animate-in"
                style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
              >
                <div className="glass-card rounded-2xl overflow-hidden">
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
