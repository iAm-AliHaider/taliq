"use client";

import { useEffect, useRef } from "react";
import { ComponentItem, TaliqActions } from "./TaliqProvider";
import { Lang, t, getSavedLang } from "@/lib/i18n";
import { LeaveBalanceCard } from "./taliq/LeaveBalanceCard";
import { LeaveRequestForm } from "./taliq/LeaveRequestForm";
import { EmployeeProfileCard } from "./taliq/EmployeeProfileCard";
import { ProfileEditCard } from "./taliq/ProfileEditCard";
import { PaySlipCard } from "./taliq/PaySlipCard";
import { InterviewPanel } from "./taliq/InterviewPanel";
import { ApprovalQueue } from "./taliq/ApprovalQueue";
import { AttendanceDashboard } from "./taliq/AttendanceDashboard";
import { InterviewResultsCard } from "./taliq/InterviewResultsCard";
import { AuditLogCard } from "./taliq/AuditLogCard";
import { NotificationQueueCard } from "./taliq/NotificationQueueCard";
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
import { QuickDashboard } from "./taliq/QuickDashboard";
import { LeaveHistoryCard } from "./taliq/LeaveHistoryCard";
import { PerformanceReviewCard } from "./taliq/PerformanceReviewCard";
import { GoalsCard } from "./taliq/GoalsCard";
import { TrainingCatalogCard } from "./taliq/TrainingCatalogCard";
import { MyTrainingsCard } from "./taliq/MyTrainingsCard";
import { GrievanceListCard } from "./taliq/GrievanceListCard";
import { NotificationCard } from "./taliq/NotificationCard";

import ManagerPendingCard from "./taliq/ManagerPendingCard";
import TeamPerformanceCard from "./taliq/TeamPerformanceCard";
import TeamTrainingCard from "./taliq/TeamTrainingCard";
import EmployeeDetailCard from "./taliq/EmployeeDetailCard";
import LeaveAnalyticsCard from "./taliq/LeaveAnalyticsCard";
import HeadcountCard from "./taliq/HeadcountCard";
import MyRequestsCard from "./taliq/MyRequestsCard";
import { ExpenseListCard } from "./taliq/ExpenseListCard";
import { ExpenseForm } from "./taliq/ExpenseForm";
import { ExpenseApprovalCard } from "./taliq/ExpenseApprovalCard";
import { ClaimListCard } from "./taliq/ClaimListCard";
import { ClaimForm } from "./taliq/ClaimForm";
import { ClaimApprovalCard } from "./taliq/ClaimApprovalCard";
import PaymentListCard from "./taliq/PaymentListCard";
import { SalaryBreakdownCard } from "./taliq/SalaryBreakdownCard";
import { GOSICard } from "./taliq/GOSICard";
import { EndOfServiceCard } from "./taliq/EndOfServiceCard";
import { LetterCard } from "./taliq/LetterCard";
import { LetterListCard } from "./taliq/LetterListCard";
import { ContractCard } from "./taliq/ContractCard";
import { ContractListCard } from "./taliq/ContractListCard";
import { AssetListCard } from "./taliq/AssetListCard";
import { AssetInventoryCard } from "./taliq/AssetInventoryCard";
import { ShiftCard } from "./taliq/ShiftCard";
import { TeamShiftCard } from "./taliq/TeamShiftCard";
import { HRReportCard } from "./taliq/HRReportCard";
import { PayrollSummaryCard } from "./taliq/PayrollSummaryCard";
import { DirectoryCard } from "./taliq/DirectoryCard";
import { OrgChartCard } from "./taliq/OrgChartCard";
import { IqamaVisaCard } from "./taliq/IqamaVisaCard";
import { ExpiringDocsCard } from "./taliq/ExpiringDocsCard";
import { ExitCard } from "./taliq/ExitCard";
import { ExitListCard } from "./taliq/ExitListCard";

import { JobListCard } from "./taliq/JobListCard";
import { JobDetailCard } from "./taliq/JobDetailCard";
import { ApplicationListCard } from "./taliq/ApplicationListCard";
import { RecruitmentDashboardCard } from "./taliq/RecruitmentDashboardCard";
import { GeofenceAlertCard } from "./taliq/GeofenceAlertCard";
import { AttendanceConfirmCard } from "./taliq/AttendanceConfirmCard";
import { GeofenceListCard } from "./taliq/GeofenceListCard";
import { ApprovalChainCard } from "./taliq/ApprovalChainCard";
import { PendingApprovalsCard } from "./taliq/PendingApprovalsCard";
import { WorkflowListCard } from "./taliq/WorkflowListCard";

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
  QuickDashboard,
  LeaveHistoryCard,
  PerformanceReviewCard,
  GoalsCard,
  TrainingCatalogCard,
  MyTrainingsCard,
  GrievanceListCard,
  NotificationCard,
  ManagerPendingCard,
  TeamPerformanceCard,
  TeamTrainingCard,
  EmployeeDetailCard,
  LeaveAnalyticsCard,
  HeadcountCard,
  MyRequestsCard,
  ExpenseListCard,
  ExpenseForm,
  ExpenseApprovalCard,
  ClaimListCard,
  ClaimForm,
  ClaimApprovalCard,
  PaymentListCard,
  SalaryBreakdownCard,
  GOSICard,
  EndOfServiceCard,
  LetterCard,
  LetterListCard,
  ContractCard,
  ContractListCard,
  AssetListCard,
  AssetInventoryCard,
  ShiftCard,
  TeamShiftCard,
  HRReportCard,
  PayrollSummaryCard,
  DirectoryCard,
  OrgChartCard,
  IqamaVisaCard,
  ExpiringDocsCard,
  ExitCard,
  ExitListCard,
  // Recruitment
  JobListCard,
  JobDetailCard,
  ApplicationListCard,
  RecruitmentDashboardCard,
  // Geofencing
  GeofenceAlertCard,
  AttendanceConfirmCard,
  GeofenceListCard,
  // Approval Workflows
  ApprovalChainCard,
  PendingApprovalsCard,
  WorkflowListCard,
  AuditLogCard,
  InterviewResultsCard,
  NotificationQueueCard,
};

interface Props {
  components: ComponentItem[];
  actions: TaliqActions;
}

export function GenerativePanel({ components, actions }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lang: Lang = typeof window !== "undefined" ? getSavedLang() : "en";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [components]);

  const tags = [
    t("tag.leave", lang), t("tag.payroll", lang), t("tag.loans", lang),
    t("tag.travel", lang), t("tag.documents", lang), t("tag.attendance", lang),
  ];

  if (components.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-emerald-600">ت</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">{t("panel.hr_dashboard", lang)}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{t("panel.ask_taliq", lang)}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 mt-2">
            {tags.map(tag => (
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
          <span className="text-xs font-semibold text-gray-700">{t("panel.active", lang)}</span>
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
