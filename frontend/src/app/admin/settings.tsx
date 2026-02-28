"use client";

import { useState, useEffect } from "react";

// ── Types ──────────────────────────────────────────────
interface PolicyConfig {
  [key: string]: any;
}
interface PolicyGroup {
  label: string;
  icon: string;
  color: string;
  description: string;
  fields: FieldDef[];
}
interface FieldDef {
  key: string;
  label: string;
  type: "number" | "text" | "boolean" | "select" | "list" | "time" | "date" | "textarea" | "json";
  description?: string;
  options?: string[];
  suffix?: string;
  min?: number;
  max?: number;
  placeholder?: string;
}

// ── Policy Schema ──────────────────────────────────────
const POLICY_SCHEMA: Record<string, PolicyGroup> = {
  company: {
    label: "Company Profile",
    icon: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
    color: "from-indigo-50 to-blue-50",
    description: "Organization identity and legal details used in letters, documents, and compliance",
    fields: [
      { key: "company_name_en", label: "Company Name (English)", type: "text", placeholder: "e.g. Morabaha MRNA" },
      { key: "company_name_ar", label: "Company Name (Arabic)", type: "text", placeholder: "e.g. مرابحة مرنا" },
      { key: "cr_number", label: "Commercial Registration (CR)", type: "text", placeholder: "1010xxxxxx" },
      { key: "mol_number", label: "MOL License Number", type: "text" },
      { key: "gosi_reg_number", label: "GOSI Registration Number", type: "text" },
      { key: "vat_number", label: "VAT Number", type: "text", placeholder: "3xxxxxxxxxx0003" },
      { key: "address_en", label: "Address (English)", type: "textarea" },
      { key: "address_ar", label: "Address (Arabic)", type: "textarea" },
      { key: "city", label: "City", type: "text", placeholder: "Riyadh" },
      { key: "country", label: "Country", type: "text", placeholder: "Saudi Arabia" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "website", label: "Website", type: "text" },
      { key: "legal_rep_name", label: "Legal Representative", type: "text" },
      { key: "legal_rep_title", label: "Representative Title", type: "text", placeholder: "CEO" },
    ],
  },
  leave: {
    label: "Leave Policy",
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    color: "from-blue-50 to-indigo-50",
    description: "Annual, sick, and special leave entitlements per Saudi Labor Law",
    fields: [
      { key: "annual", label: "Annual Leave Days", type: "number", suffix: "days", description: "Saudi law: min 21 days (<5yr), 30 days (5yr+)" },
      { key: "sick", label: "Sick Leave Days", type: "number", suffix: "days", description: "Saudi law: 30 full + 60 at 75% + 30 unpaid" },
      { key: "emergency", label: "Emergency Leave", type: "number", suffix: "days" },
      { key: "study", label: "Study Leave", type: "number", suffix: "days" },
      { key: "maternity", label: "Maternity Leave", type: "number", suffix: "days", description: "Saudi law: 70 days (10 weeks)" },
      { key: "paternity", label: "Paternity Leave", type: "number", suffix: "days", description: "Saudi law: 3 days" },
      { key: "marriage", label: "Marriage Leave", type: "number", suffix: "days", description: "Saudi law: 5 days" },
      { key: "bereavement", label: "Bereavement Leave", type: "number", suffix: "days", description: "Saudi law: 5 days" },
      { key: "hajj", label: "Hajj Leave", type: "number", suffix: "days", description: "Saudi law: 10-15 days once after 2 years" },
      { key: "max_carry_over", label: "Max Carry Over", type: "number", suffix: "days" },
      { key: "min_notice_days", label: "Min Notice Days", type: "number", suffix: "days" },
      { key: "approval_required", label: "Approval Required", type: "boolean" },
      { key: "allow_half_day", label: "Allow Half-Day Leave", type: "boolean" },
      { key: "allow_negative_balance", label: "Allow Negative Balance", type: "boolean" },
    ],
  },
  loan: {
    label: "Loan Policy",
    icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
    color: "from-emerald-50 to-teal-50",
    description: "Employee loan limits, EMI caps, and eligibility criteria",
    fields: [
      { key: "max_amount_multiplier", label: "Max Loan (x Basic Salary)", type: "number", suffix: "x", description: "e.g. 2 = max loan is 2x basic salary" },
      { key: "max_emi_percent", label: "Max EMI (% of Salary)", type: "number", suffix: "%", max: 50 },
      { key: "min_service_years", label: "Min Service Years", type: "number", suffix: "years" },
      { key: "max_concurrent_loans", label: "Max Concurrent Loans", type: "number" },
      { key: "min_months_between", label: "Min Gap Between Loans", type: "number", suffix: "months" },
      { key: "approval_required", label: "Approval Required", type: "boolean" },
      { key: "types", label: "Available Loan Types", type: "list" },
    ],
  },
  attendance: {
    label: "Attendance & Working Hours",
    icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "from-amber-50 to-orange-50",
    description: "Working hours, late thresholds, and overtime rules",
    fields: [
      { key: "work_start", label: "Work Start Time", type: "time" },
      { key: "work_end", label: "Work End Time", type: "time" },
      { key: "late_threshold", label: "Late Threshold", type: "time", description: "Clock-in after this = late" },
      { key: "standard_hours", label: "Standard Hours/Day", type: "number", suffix: "hrs", description: "Saudi law: max 8hrs (48/week)" },
      { key: "max_overtime_hours", label: "Max Overtime/Day", type: "number", suffix: "hrs" },
      { key: "overtime_rate", label: "Overtime Rate", type: "number", suffix: "x", description: "Saudi law: 1.5x base rate" },
      { key: "overtime_approval", label: "OT Requires Approval", type: "boolean" },
      { key: "grace_period_minutes", label: "Grace Period", type: "number", suffix: "min" },
      { key: "weekend_days", label: "Weekend Days", type: "list", description: "e.g. Friday, Saturday" },
    ],
  },
  ramadan: {
    label: "Ramadan Hours",
    icon: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z",
    color: "from-violet-50 to-purple-50",
    description: "Reduced working hours during the month of Ramadan (Saudi law: max 6hrs/day)",
    fields: [
      { key: "enabled", label: "Ramadan Hours Active", type: "boolean" },
      { key: "start_date", label: "Ramadan Start Date", type: "date" },
      { key: "end_date", label: "Ramadan End Date", type: "date" },
      { key: "work_start", label: "Ramadan Start Time", type: "time" },
      { key: "work_end", label: "Ramadan End Time", type: "time" },
      { key: "standard_hours", label: "Hours per Day", type: "number", suffix: "hrs" },
      { key: "apply_to_all", label: "Apply to All Employees", type: "boolean" },
    ],
  },
  travel: {
    label: "Travel & Per Diem",
    icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
    color: "from-sky-50 to-cyan-50",
    description: "Travel request limits and per diem rates by grade tier",
    fields: [
      { key: "max_days", label: "Max Travel Days", type: "number", suffix: "days" },
      { key: "approval_required", label: "Approval Required", type: "boolean" },
      { key: "per_diem_chairman_intl", label: "Per Diem: Chairman (Intl)", type: "number", suffix: "SAR" },
      { key: "per_diem_chairman_local", label: "Per Diem: Chairman (Local)", type: "number", suffix: "SAR" },
      { key: "per_diem_clevel_intl", label: "Per Diem: C-Level (Intl)", type: "number", suffix: "SAR" },
      { key: "per_diem_clevel_local", label: "Per Diem: C-Level (Local)", type: "number", suffix: "SAR" },
      { key: "per_diem_other_intl", label: "Per Diem: Staff (Intl)", type: "number", suffix: "SAR" },
      { key: "per_diem_other_local", label: "Per Diem: Staff (Local)", type: "number", suffix: "SAR" },
      { key: "advance_allowed", label: "Travel Advance Allowed", type: "boolean" },
      { key: "advance_max_percent", label: "Max Advance %", type: "number", suffix: "%" },
    ],
  },
  payroll: {
    label: "Payroll Settings",
    icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "from-green-50 to-emerald-50",
    description: "Pay cycle, salary structure, and deduction rules",
    fields: [
      { key: "pay_cycle", label: "Pay Cycle", type: "select", options: ["monthly", "bi-weekly", "weekly"] },
      { key: "pay_day", label: "Pay Day of Month", type: "number", min: 1, max: 28, suffix: "th" },
      { key: "currency", label: "Currency", type: "text" },
      { key: "housing_pct_of_basic", label: "Housing Allowance % of Basic", type: "number", suffix: "%" },
      { key: "transport_standard", label: "Standard Transport Allowance", type: "number", suffix: "SAR" },
      { key: "overtime_multiplier", label: "OT Pay Multiplier", type: "number", suffix: "x" },
      { key: "bank_transfer_method", label: "Transfer Method", type: "select", options: ["bank_transfer", "cheque", "wps"] },
      { key: "wps_enabled", label: "WPS (Wage Protection System)", type: "boolean", description: "Saudi MOL requirement" },
    ],
  },
  gosi: {
    label: "GOSI Social Insurance",
    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    color: "from-teal-50 to-green-50",
    description: "GOSI contribution rates and thresholds per Saudi regulations",
    fields: [
      { key: "employee_rate", label: "Employee Rate", type: "number", suffix: "%" },
      { key: "employer_rate", label: "Employer Rate", type: "number", suffix: "%" },
      { key: "max_insurable_salary", label: "Max Insurable Salary", type: "number", suffix: "SAR" },
      { key: "min_insurable_salary", label: "Min Insurable Salary", type: "number", suffix: "SAR" },
      { key: "annuities_employee", label: "Annuities (Employee)", type: "number", suffix: "%" },
      { key: "annuities_employer", label: "Annuities (Employer)", type: "number", suffix: "%" },
      { key: "occupational_hazards_employer", label: "Occupational Hazards", type: "number", suffix: "%" },
      { key: "saned_employer", label: "SANED Unemployment", type: "number", suffix: "%" },
      { key: "non_saudi_rate", label: "Non-Saudi Rate (Employer)", type: "number", suffix: "%" },
      { key: "applies_to", label: "Applies To", type: "select", options: ["saudi_nationals", "all_employees", "gcc_nationals"] },
      { key: "effective_date", label: "Effective Date", type: "date" },
    ],
  },
  end_of_service: {
    label: "End of Service (Gratuity)",
    icon: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9",
    color: "from-rose-50 to-pink-50",
    description: "Saudi Labor Law gratuity calculation rates",
    fields: [
      { key: "first_5_years_rate", label: "First 5 Years (per year)", type: "number", suffix: "x monthly", description: "Saudi law: 0.5 months per year" },
      { key: "after_5_years_rate", label: "After 5 Years (per year)", type: "number", suffix: "x monthly", description: "Saudi law: 1.0 months per year" },
      { key: "min_service_months", label: "Min Service for Eligibility", type: "number", suffix: "months" },
      { key: "resignation_2_5_years", label: "Resignation Multiplier (2-5yr)", type: "number", suffix: "x" },
      { key: "resignation_5_10_years", label: "Resignation Multiplier (5-10yr)", type: "number", suffix: "x" },
      { key: "resignation_10_plus_years", label: "Resignation Multiplier (10yr+)", type: "number", suffix: "x" },
      { key: "termination_rate", label: "Termination Multiplier", type: "number", suffix: "x" },
      { key: "based_on", label: "Based On", type: "select", options: ["last_basic_plus_housing", "last_basic", "total_salary"] },
      { key: "effective_date", label: "Effective Date", type: "date" },
    ],
  },
  grievance: {
    label: "Grievance & SLA",
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
    color: "from-red-50 to-rose-50",
    description: "Complaint categories, severity levels, and response SLA",
    fields: [
      { key: "categories", label: "Grievance Categories", type: "list" },
      { key: "severity_levels", label: "Severity Levels", type: "list" },
      { key: "sla_hours_low", label: "SLA: Low Priority", type: "number", suffix: "hours" },
      { key: "sla_hours_medium", label: "SLA: Medium Priority", type: "number", suffix: "hours" },
      { key: "sla_hours_high", label: "SLA: High Priority", type: "number", suffix: "hours" },
      { key: "sla_hours_critical", label: "SLA: Critical Priority", type: "number", suffix: "hours" },
      { key: "escalation_enabled", label: "Auto-Escalation", type: "boolean" },
      { key: "anonymous_allowed", label: "Anonymous Filing Allowed", type: "boolean" },
    ],
  },
  probation: {
    label: "Probation & Notice Period",
    icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
    color: "from-orange-50 to-amber-50",
    description: "Probation periods and notice requirements by contract type",
    fields: [
      { key: "probation_days", label: "Probation Period", type: "number", suffix: "days", description: "Saudi law: max 90 days, extendable to 180" },
      { key: "probation_extendable", label: "Extendable (to 180 days)", type: "boolean" },
      { key: "notice_unlimited", label: "Notice: Unlimited Contract", type: "number", suffix: "days" },
      { key: "notice_fixed", label: "Notice: Fixed Contract", type: "number", suffix: "days" },
      { key: "notice_probation", label: "Notice: During Probation", type: "number", suffix: "days" },
      { key: "notice_deduction", label: "Deduct for Unserved Notice", type: "boolean" },
    ],
  },
  documents: {
    label: "Letters & Documents",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    color: "from-slate-50 to-gray-50",
    description: "Letter templates, signatory details, and document numbering",
    fields: [
      { key: "signatory_name", label: "Signatory Name", type: "text" },
      { key: "signatory_title", label: "Signatory Title", type: "text", placeholder: "HR Director" },
      { key: "letter_prefix", label: "Letter Ref Prefix", type: "text", placeholder: "LTR" },
      { key: "auto_expiry_days", label: "Certificate Expiry", type: "number", suffix: "days" },
      { key: "processing_days", label: "Processing Time", type: "number", suffix: "days" },
    ],
  },
  iqama_visa: {
    label: "Iqama / Visa Compliance",
    icon: "M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z",
    color: "from-cyan-50 to-sky-50",
    description: "Iqama renewal reminders, visa costs, and compliance alerts",
    fields: [
      { key: "reminder_days_30", label: "First Reminder", type: "number", suffix: "days before expiry" },
      { key: "reminder_days_60", label: "Second Reminder", type: "number", suffix: "days before expiry" },
      { key: "reminder_days_90", label: "Third Reminder", type: "number", suffix: "days before expiry" },
      { key: "auto_escalation", label: "Auto-Escalate Expired Docs", type: "boolean" },
      { key: "medical_insurance_mandatory", label: "Medical Insurance Required", type: "boolean" },
      { key: "iqama_renewal_cost", label: "Iqama Renewal Cost", type: "number", suffix: "SAR" },
    ],
  },
  exit: {
    label: "Exit & Offboarding",
    icon: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75",
    color: "from-gray-50 to-slate-50",
    description: "Offboarding clearance departments, settlement timelines, and checklist",
    fields: [
      { key: "clearance_departments", label: "Clearance Departments", type: "list" },
      { key: "notice_enforcement", label: "Enforce Notice Period", type: "boolean" },
      { key: "settlement_deadline_days", label: "Settlement Deadline", type: "number", suffix: "days", description: "Saudi law: within 7 days of termination" },
      { key: "asset_return_checklist", label: "Asset Return Items", type: "list" },
      { key: "exit_interview_required", label: "Exit Interview Required", type: "boolean" },
    ],
  },
  recruitment: {
    label: "Recruitment & Interviews",
    icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    color: "from-fuchsia-50 to-pink-50",
    description: "Interview stages, scoring thresholds, and hiring workflows",
    fields: [
      { key: "stages_enabled", label: "Enabled Stages", type: "list" },
      { key: "min_passing_score", label: "Min Passing Score", type: "number", suffix: "/5" },
      { key: "max_interviews_per_candidate", label: "Max Interviews/Candidate", type: "number" },
      { key: "offer_approval_required", label: "Offer Requires Approval", type: "boolean" },
      { key: "reference_check_required", label: "Reference Check Required", type: "boolean" },
    ],
  },
  training: {
    label: "Training & Development",
    icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
    color: "from-lime-50 to-green-50",
    description: "Training requirements, budgets, and compliance targets",
    fields: [
      { key: "mandatory_deadline_days", label: "Mandatory Training Deadline", type: "number", suffix: "days after joining" },
      { key: "annual_hours_required", label: "Annual Training Hours", type: "number", suffix: "hours" },
      { key: "budget_per_employee", label: "Budget per Employee", type: "number", suffix: "SAR/year" },
      { key: "certification_reminder_days", label: "Cert Renewal Reminder", type: "number", suffix: "days" },
      { key: "compliance_target", label: "Compliance Target", type: "number", suffix: "%" },
    ],
  },
  expenses: {
    label: "Expenses & Claims",
    icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
    color: "from-yellow-50 to-amber-50",
    description: "Expense approval thresholds, receipt requirements, and claim limits",
    fields: [
      { key: "auto_approve_below", label: "Auto-Approve Below", type: "number", suffix: "SAR" },
      { key: "receipt_required_above", label: "Receipt Required Above", type: "number", suffix: "SAR" },
      { key: "max_claim_per_category_year", label: "Max Claim/Category/Year", type: "number", suffix: "SAR" },
      { key: "reimbursement_processing_days", label: "Reimbursement Processing", type: "number", suffix: "days" },
      { key: "categories_enabled", label: "Expense Categories", type: "list" },
      { key: "claim_types_enabled", label: "Claim Types", type: "list" },
    ],
  },
  holidays: {
    label: "Public Holidays",
    icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    color: "from-pink-50 to-rose-50",
    description: "National and religious holidays for Saudi Arabia",
    fields: [
      { key: "national_day", label: "National Day (Sept 23)", type: "boolean" },
      { key: "founding_day", label: "Founding Day (Feb 22)", type: "boolean" },
      { key: "eid_al_fitr_days", label: "Eid Al-Fitr Days", type: "number", suffix: "days" },
      { key: "eid_al_adha_days", label: "Eid Al-Adha Days", type: "number", suffix: "days" },
      { key: "custom_holidays", label: "Custom Holidays (dates)", type: "list" },
    ],
  },
  notifications: {
    label: "Notifications",
    icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
    color: "from-blue-50 to-indigo-50",
    description: "Notification channels, templates, and webhook integrations",
    fields: [
      { key: "email_enabled", label: "Email Notifications", type: "boolean" },
      { key: "whatsapp_enabled", label: "WhatsApp Notifications", type: "boolean" },
      { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://..." },
      { key: "notify_on_approval", label: "Notify on Approval", type: "boolean" },
      { key: "notify_on_rejection", label: "Notify on Rejection", type: "boolean" },
      { key: "notify_manager_on_request", label: "Notify Manager on Request", type: "boolean" },
      { key: "daily_digest", label: "Daily Digest Email", type: "boolean" },
    ],
  },
  security: {
    label: "Security & Access",
    icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
    color: "from-gray-100 to-slate-100",
    description: "Access control, PIN requirements, and session management",
    fields: [
      { key: "admin_employee_ids", label: "Admin Employee IDs", type: "list" },
      { key: "pin_min_length", label: "Min PIN Length", type: "number" },
      { key: "session_timeout_minutes", label: "Session Timeout", type: "number", suffix: "min" },
      { key: "max_login_attempts", label: "Max Login Attempts", type: "number" },
      { key: "lockout_duration_minutes", label: "Lockout Duration", type: "number", suffix: "min" },
      { key: "require_pin_change_days", label: "PIN Change Interval", type: "number", suffix: "days", description: "0 = never" },
    ],
  },
};

const CATEGORY_ORDER = [
  "company", "attendance", "ramadan", "payroll", "holidays",
  "leave", "loan", "travel", "expenses",
  "gosi", "end_of_service",
  "probation", "documents", "iqama_visa", "exit",
  "recruitment", "training", "grievance",
  "notifications", "security",
];

// ── Settings Component ─────────────────────────────────
export default function SettingsPanel({
  policies,
  onSave,
}: {
  policies: Record<string, any>;
  onSave: (category: string, config: any) => Promise<void>;
}) {
  const [activeGroup, setActiveGroup] = useState("company");
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  // Merge policies into drafts
  useEffect(() => {
    const d: Record<string, any> = {};
    for (const cat of CATEGORY_ORDER) {
      const existing = policies[cat] || {};
      // Strip internal fields
      const { _id, _updated_at, _updated_by, ...rest } = existing;
      d[cat] = { ...rest };
    }
    setDrafts(d);
  }, [policies]);

  const handleChange = (category: string, key: string, value: any) => {
    setDrafts(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }));
  };

  const handleSave = async (category: string) => {
    setSaving(true);
    try {
      await onSave(category, drafts[category]);
      setEditing(null);
      setSaved(category);
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      console.error("Save failed:", e);
    }
    setSaving(false);
  };

  const handleAddListItem = (category: string, key: string) => {
    const val = prompt("Add item:");
    if (!val) return;
    const arr = drafts[category]?.[key] || [];
    handleChange(category, key, [...arr, val]);
  };

  const handleRemoveListItem = (category: string, key: string, idx: number) => {
    const arr = [...(drafts[category]?.[key] || [])];
    arr.splice(idx, 1);
    handleChange(category, key, arr);
  };

  const schema = POLICY_SCHEMA[activeGroup];
  const draft = drafts[activeGroup] || {};
  const isEditing = editing === activeGroup;

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-sm font-bold text-gray-800">Settings</h3>
            <p className="text-[10px] text-gray-400">{CATEGORY_ORDER.length} configuration groups</p>
          </div>
          <div className="py-1 max-h-[520px] overflow-y-auto">
            {CATEGORY_ORDER.map(cat => {
              const s = POLICY_SCHEMA[cat];
              if (!s) return null;
              const isActive = activeGroup === cat;
              const hasData = policies[cat] && Object.keys(policies[cat]).filter(k => !k.startsWith("_")).length > 0;
              return (
                <button key={cat} onClick={() => { setActiveGroup(cat); setEditing(null); }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all ${
                    isActive ? "bg-emerald-50 border-r-2 border-emerald-500" : "hover:bg-gray-50"
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                    stroke="currentColor" className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-emerald-600" : "text-gray-400"}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isActive ? "text-emerald-700" : "text-gray-700"}`}>{s.label}</p>
                  </div>
                  {hasData && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {schema && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 bg-gradient-to-r ${schema.color} border-b border-gray-100 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                  stroke="currentColor" className="w-6 h-6 text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d={schema.icon} />
                </svg>
                <div>
                  <h2 className="text-base font-bold text-gray-800">{schema.label}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{schema.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {saved === activeGroup && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Saved
                  </span>
                )}
                {!isEditing ? (
                  <button onClick={() => setEditing(activeGroup)}
                    className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
                    Edit Settings
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(activeGroup)} disabled={saving}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 shadow-sm transition-all">
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button onClick={() => { setEditing(null); setDrafts(prev => ({ ...prev, [activeGroup]: policies[activeGroup] || {} })); }}
                      className="px-4 py-2 rounded-xl bg-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-300 transition-all">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schema.fields.map(field => {
                  const val = draft[field.key];
                  return (
                    <div key={field.key}
                      className={`${field.type === "textarea" || field.type === "list" || field.type === "json" ? "md:col-span-2" : ""}`}>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-all h-full">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <label className="text-xs font-semibold text-gray-700">{field.label}</label>
                            {field.description && <p className="text-[10px] text-gray-400 mt-0.5">{field.description}</p>}
                          </div>
                          {field.suffix && <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">{field.suffix}</span>}
                        </div>

                        {/* Boolean */}
                        {field.type === "boolean" && (
                          isEditing ? (
                            <button onClick={() => handleChange(activeGroup, field.key, !val)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                val ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-red-100 text-red-700 border border-red-200"
                              }`}>
                              {val ? "Enabled" : "Disabled"}
                            </button>
                          ) : (
                            <p className={`text-lg font-bold ${val ? "text-emerald-600" : "text-gray-400"}`}>{val ? "Enabled" : "Disabled"}</p>
                          )
                        )}

                        {/* Number */}
                        {field.type === "number" && (
                          isEditing ? (
                            <input type="number" value={val ?? ""} min={field.min} max={field.max}
                              onChange={e => handleChange(activeGroup, field.key, e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-full text-lg font-bold text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none" />
                          ) : (
                            <p className="text-lg font-bold text-gray-900">{val !== undefined && val !== null ? String(val) : <span className="text-gray-300">Not set</span>}</p>
                          )
                        )}

                        {/* Text / Time / Date */}
                        {(field.type === "text" || field.type === "time" || field.type === "date") && (
                          isEditing ? (
                            <input type={field.type === "time" ? "time" : field.type === "date" ? "date" : "text"}
                              value={val ?? ""} placeholder={field.placeholder}
                              onChange={e => handleChange(activeGroup, field.key, e.target.value)}
                              className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none" />
                          ) : (
                            <p className="text-sm font-bold text-gray-900">{val || <span className="text-gray-300">Not set</span>}</p>
                          )
                        )}

                        {/* Textarea */}
                        {field.type === "textarea" && (
                          isEditing ? (
                            <textarea value={val ?? ""} rows={3} placeholder={field.placeholder}
                              onChange={e => handleChange(activeGroup, field.key, e.target.value)}
                              className="w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none resize-none" />
                          ) : (
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{val || <span className="text-gray-300">Not set</span>}</p>
                          )
                        )}

                        {/* Select */}
                        {field.type === "select" && (
                          isEditing ? (
                            <select value={val ?? ""} onChange={e => handleChange(activeGroup, field.key, e.target.value)}
                              className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none">
                              <option value="">Select...</option>
                              {field.options?.map(o => <option key={o} value={o}>{o.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                            </select>
                          ) : (
                            <p className="text-sm font-bold text-gray-900">{val ? String(val).replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : <span className="text-gray-300">Not set</span>}</p>
                          )
                        )}

                        {/* List */}
                        {field.type === "list" && (
                          <div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {(Array.isArray(val) ? val : []).map((item: string, idx: number) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs text-gray-700">
                                  {item}
                                  {isEditing && (
                                    <button onClick={() => handleRemoveListItem(activeGroup, field.key, idx)}
                                      className="text-red-400 hover:text-red-600 ml-0.5">x</button>
                                  )}
                                </span>
                              ))}
                              {(!val || val.length === 0) && !isEditing && <span className="text-gray-300 text-xs">No items</span>}
                            </div>
                            {isEditing && (
                              <button onClick={() => handleAddListItem(activeGroup, field.key)}
                                className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-200 hover:bg-emerald-100 transition-all">
                                + Add Item
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
