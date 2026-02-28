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
  sections: SectionDef[];
}
interface SectionDef {
  title: string;
  fields: FieldDef[];
}
interface FieldDef {
  key: string;
  label: string;
  type: "number" | "text" | "boolean" | "select" | "list" | "time" | "date" | "textarea" | "json" | "percentage";
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
    description: "Organization identity used across letters, compliance reports, and GOSI registration",
    sections: [
      { title: "Basic Information", fields: [
        { key: "company_name_en", label: "Company Name (English)", type: "text", placeholder: "Morabaha MRNA" },
        { key: "company_name_ar", label: "Company Name (Arabic)", type: "text", placeholder: "مرابحة مرنا" },
        { key: "trade_name_en", label: "Trade Name (English)", type: "text" },
        { key: "trade_name_ar", label: "Trade Name (Arabic)", type: "text" },
        { key: "industry", label: "Industry / Sector", type: "select", options: ["technology", "finance", "healthcare", "education", "retail", "construction", "manufacturing", "government", "energy", "telecom", "other"] },
        { key: "company_size", label: "Company Size", type: "select", options: ["micro_1_9", "small_10_49", "medium_50_499", "large_500_2999", "giant_3000_plus"] },
      ]},
      { title: "Legal & Registration", fields: [
        { key: "cr_number", label: "Commercial Registration (CR)", type: "text", placeholder: "1010xxxxxx", description: "Ministry of Commerce CR number" },
        { key: "cr_expiry", label: "CR Expiry Date", type: "date" },
        { key: "mol_number", label: "MOL Unified Number", type: "text", description: "Ministry of Labor license number" },
        { key: "mol_expiry", label: "MOL License Expiry", type: "date" },
        { key: "gosi_reg_number", label: "GOSI Registration Number", type: "text" },
        { key: "vat_number", label: "VAT Number", type: "text", placeholder: "3xxxxxxxxxx0003", description: "ZATCA VAT registration" },
        { key: "zakat_number", label: "Zakat Certificate Number", type: "text" },
        { key: "nitaqat_band", label: "Nitaqat Band", type: "select", options: ["platinum", "green_high", "green_medium", "green_low", "yellow", "red"], description: "Saudization classification" },
        { key: "saudization_target", label: "Saudization Target %", type: "number", suffix: "%" },
      ]},
      { title: "Contact & Location", fields: [
        { key: "address_en", label: "Address (English)", type: "textarea" },
        { key: "address_ar", label: "Address (Arabic)", type: "textarea" },
        { key: "city", label: "City", type: "text", placeholder: "Riyadh" },
        { key: "region", label: "Region", type: "select", options: ["riyadh", "makkah", "madinah", "eastern", "qassim", "asir", "tabuk", "hail", "northern_borders", "jazan", "najran", "al_baha", "al_jouf"] },
        { key: "postal_code", label: "Postal Code", type: "text" },
        { key: "country", label: "Country", type: "text", placeholder: "Saudi Arabia" },
        { key: "phone", label: "Phone", type: "text" },
        { key: "fax", label: "Fax", type: "text" },
        { key: "email", label: "Email", type: "text" },
        { key: "website", label: "Website", type: "text" },
      ]},
      { title: "Legal Representative", fields: [
        { key: "legal_rep_name", label: "Representative Name", type: "text" },
        { key: "legal_rep_name_ar", label: "Representative Name (Arabic)", type: "text" },
        { key: "legal_rep_title", label: "Title", type: "text", placeholder: "CEO" },
        { key: "legal_rep_id", label: "National ID / Iqama", type: "text" },
        { key: "authorized_signatory", label: "Authorized Signatory", type: "text", description: "Person who signs letters & contracts" },
        { key: "authorized_signatory_title", label: "Signatory Title", type: "text" },
      ]},
    ],
  },
  attendance: {
    label: "Attendance & Working Hours",
    icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "from-amber-50 to-orange-50",
    description: "Working hours, late thresholds, overtime rules, and remote work policies",
    sections: [
      { title: "Standard Working Hours", fields: [
        { key: "work_start", label: "Work Start Time", type: "time" },
        { key: "work_end", label: "Work End Time", type: "time" },
        { key: "standard_hours", label: "Hours per Day", type: "number", suffix: "hrs", description: "Saudi law max: 8 hrs/day, 48 hrs/week" },
        { key: "standard_weekly_hours", label: "Hours per Week", type: "number", suffix: "hrs" },
        { key: "break_duration_minutes", label: "Break Duration", type: "number", suffix: "min", description: "Saudi law: max 5 continuous hrs before break" },
        { key: "break_start", label: "Break Start", type: "time" },
        { key: "break_end", label: "Break End", type: "time" },
      ]},
      { title: "Late & Absence", fields: [
        { key: "late_threshold", label: "Late After", type: "time", description: "Clock-in after this time counts as late" },
        { key: "grace_period_minutes", label: "Grace Period", type: "number", suffix: "min" },
        { key: "late_deduction_enabled", label: "Deduct for Lateness", type: "boolean" },
        { key: "late_deduction_per_minute", label: "Deduction per Minute Late", type: "number", suffix: "SAR" },
        { key: "absent_deduction_enabled", label: "Deduct for Absence", type: "boolean" },
        { key: "absent_deduction_formula", label: "Absence Deduction", type: "select", options: ["daily_salary", "hourly_rate", "fixed_amount"] },
        { key: "max_late_per_month", label: "Max Late Days/Month", type: "number", suffix: "days", description: "Warning after exceeding" },
        { key: "consecutive_absent_warning", label: "Warning After Consecutive Absences", type: "number", suffix: "days" },
      ]},
      { title: "Overtime", fields: [
        { key: "max_overtime_hours", label: "Max OT per Day", type: "number", suffix: "hrs" },
        { key: "max_overtime_monthly", label: "Max OT per Month", type: "number", suffix: "hrs" },
        { key: "overtime_rate", label: "OT Rate Multiplier", type: "number", suffix: "x base", description: "Saudi law: min 1.5x" },
        { key: "friday_ot_rate", label: "Friday OT Rate", type: "number", suffix: "x base", description: "Weekend/holiday OT multiplier" },
        { key: "holiday_ot_rate", label: "Holiday OT Rate", type: "number", suffix: "x base" },
        { key: "overtime_approval", label: "OT Requires Approval", type: "boolean" },
        { key: "overtime_auto_detect", label: "Auto-Detect from Clock Out", type: "boolean", description: "Automatically flag OT when clocked out past work_end" },
      ]},
      { title: "Remote Work", fields: [
        { key: "remote_work_enabled", label: "Remote Work Allowed", type: "boolean" },
        { key: "max_remote_days_week", label: "Max Remote Days/Week", type: "number", suffix: "days" },
        { key: "remote_requires_approval", label: "Requires Approval", type: "boolean" },
        { key: "remote_clock_required", label: "Clock In/Out Required for Remote", type: "boolean" },
      ]},
      { title: "Weekend & Work Week", fields: [
        { key: "weekend_days", label: "Weekend Days", type: "list", description: "e.g. Friday, Saturday" },
        { key: "work_days_per_week", label: "Work Days per Week", type: "number", suffix: "days" },
        { key: "flexible_hours_enabled", label: "Flexible Hours", type: "boolean", description: "Allow employees to choose start/end within range" },
        { key: "flex_earliest_start", label: "Earliest Flex Start", type: "time" },
        { key: "flex_latest_start", label: "Latest Flex Start", type: "time" },
      ]},
    ],
  },
  ramadan: {
    label: "Ramadan Hours",
    icon: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z",
    color: "from-violet-50 to-purple-50",
    description: "Reduced working hours during Ramadan (Saudi law: max 6hrs/day for Muslims)",
    sections: [
      { title: "Ramadan Schedule", fields: [
        { key: "enabled", label: "Ramadan Hours Active", type: "boolean" },
        { key: "start_date", label: "Ramadan Start Date", type: "date" },
        { key: "end_date", label: "Ramadan End Date", type: "date" },
        { key: "work_start", label: "Start Time", type: "time" },
        { key: "work_end", label: "End Time", type: "time" },
        { key: "standard_hours", label: "Hours per Day", type: "number", suffix: "hrs" },
        { key: "apply_to_all", label: "Apply to All Employees", type: "boolean" },
        { key: "apply_to_muslims_only", label: "Muslims Only", type: "boolean", description: "Non-Muslim employees keep regular hours" },
        { key: "break_for_iftar", label: "Iftar Break Included", type: "boolean" },
        { key: "late_threshold_ramadan", label: "Ramadan Late Threshold", type: "time" },
      ]},
    ],
  },
  payroll: {
    label: "Payroll & Compensation",
    icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "from-green-50 to-emerald-50",
    description: "Pay cycle, salary structure, allowances, deductions, and WPS compliance",
    sections: [
      { title: "Pay Cycle", fields: [
        { key: "pay_cycle", label: "Pay Frequency", type: "select", options: ["monthly", "bi-weekly", "weekly"] },
        { key: "pay_day", label: "Pay Day", type: "number", min: 1, max: 28, suffix: "th of month" },
        { key: "currency", label: "Currency", type: "text" },
        { key: "pay_method", label: "Payment Method", type: "select", options: ["bank_transfer", "cheque", "cash", "wps"] },
        { key: "bank_name", label: "Company Bank", type: "text" },
        { key: "bank_account", label: "Company Account", type: "text" },
      ]},
      { title: "Salary Structure", fields: [
        { key: "housing_pct_of_basic", label: "Housing Allowance", type: "number", suffix: "% of basic", description: "Standard: 25% of basic" },
        { key: "transport_standard", label: "Transport Allowance", type: "number", suffix: "SAR/month" },
        { key: "food_allowance", label: "Food Allowance", type: "number", suffix: "SAR/month" },
        { key: "phone_allowance", label: "Phone Allowance", type: "number", suffix: "SAR/month" },
        { key: "education_allowance", label: "Education Allowance", type: "number", suffix: "SAR/child/year" },
        { key: "cost_of_living_allowance", label: "Cost of Living (COLA)", type: "number", suffix: "SAR/month" },
        { key: "hazard_allowance", label: "Hazard Allowance", type: "number", suffix: "SAR/month", description: "For dangerous work environments" },
        { key: "shift_allowance_night", label: "Night Shift Allowance", type: "number", suffix: "SAR/shift" },
      ]},
      { title: "Overtime Pay", fields: [
        { key: "overtime_multiplier", label: "OT Pay Multiplier", type: "number", suffix: "x base" },
        { key: "ot_base_formula", label: "OT Base Calculation", type: "select", options: ["basic_only", "basic_plus_housing", "total_salary"], description: "What salary component OT is calculated on" },
        { key: "friday_ot_multiplier", label: "Friday OT Multiplier", type: "number", suffix: "x base" },
        { key: "holiday_ot_multiplier", label: "Holiday OT Multiplier", type: "number", suffix: "x base" },
      ]},
      { title: "Deductions", fields: [
        { key: "tax_enabled", label: "Income Tax", type: "boolean", description: "Saudi has no income tax for individuals" },
        { key: "gosi_auto_deduct", label: "Auto-Deduct GOSI", type: "boolean" },
        { key: "loan_auto_deduct", label: "Auto-Deduct Loan EMI", type: "boolean" },
        { key: "absence_deduction_enabled", label: "Absence Deductions", type: "boolean" },
        { key: "late_deduction_enabled", label: "Lateness Deductions", type: "boolean" },
        { key: "max_total_deduction_pct", label: "Max Total Deductions", type: "number", suffix: "% of salary", description: "Saudi law: max 50% can be deducted" },
      ]},
      { title: "Bonuses & Increments", fields: [
        { key: "annual_increment_enabled", label: "Annual Increment", type: "boolean" },
        { key: "annual_increment_pct", label: "Default Increment", type: "number", suffix: "% of basic" },
        { key: "performance_bonus_enabled", label: "Performance Bonus", type: "boolean" },
        { key: "eid_bonus_enabled", label: "Eid Bonus", type: "boolean" },
        { key: "eid_bonus_amount", label: "Eid Bonus Amount", type: "number", suffix: "SAR or % basic" },
        { key: "thirteenth_month", label: "13th Month Salary", type: "boolean" },
        { key: "air_ticket_allowance", label: "Annual Air Ticket", type: "boolean", description: "For expatriate employees" },
        { key: "air_ticket_amount", label: "Air Ticket Amount", type: "number", suffix: "SAR" },
      ]},
      { title: "WPS Compliance", fields: [
        { key: "wps_enabled", label: "Wage Protection System", type: "boolean", description: "Saudi MOL requirement for all employers" },
        { key: "wps_bank_code", label: "WPS Bank Code", type: "text" },
        { key: "wps_establishment_id", label: "WPS Establishment ID", type: "text" },
        { key: "wps_deadline_day", label: "WPS Upload Deadline", type: "number", suffix: "th of month" },
        { key: "wps_late_penalty_warning", label: "Warn Before Deadline", type: "number", suffix: "days" },
      ]},
    ],
  },
  holidays: {
    label: "Public Holidays & Calendar",
    icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    color: "from-pink-50 to-rose-50",
    description: "National and religious holidays, custom company holidays",
    sections: [
      { title: "Saudi National Holidays", fields: [
        { key: "national_day", label: "National Day (Sep 23)", type: "boolean" },
        { key: "national_day_days", label: "National Day Duration", type: "number", suffix: "days" },
        { key: "founding_day", label: "Founding Day (Feb 22)", type: "boolean" },
        { key: "founding_day_days", label: "Founding Day Duration", type: "number", suffix: "days" },
      ]},
      { title: "Religious Holidays", fields: [
        { key: "eid_al_fitr_days", label: "Eid Al-Fitr", type: "number", suffix: "days", description: "Typically 4 days" },
        { key: "eid_al_adha_days", label: "Eid Al-Adha", type: "number", suffix: "days", description: "Typically 4 days" },
        { key: "islamic_new_year", label: "Islamic New Year", type: "boolean" },
        { key: "prophet_birthday", label: "Prophet's Birthday", type: "boolean" },
      ]},
      { title: "Holiday Rules", fields: [
        { key: "weekend_adjacent_bridge", label: "Bridge Days Allowed", type: "boolean", description: "Auto-add bridge day between holiday and weekend" },
        { key: "holiday_pay_rate", label: "Holiday Work Pay Rate", type: "number", suffix: "x base", description: "Pay rate for working on holidays" },
        { key: "compensatory_day_off", label: "Comp Day for Holiday Work", type: "boolean" },
        { key: "custom_holidays", label: "Custom Company Holidays", type: "list", description: "Add dates like 2026-12-25" },
      ]},
    ],
  },
  leave: {
    label: "Leave Policy",
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    color: "from-blue-50 to-indigo-50",
    description: "Leave entitlements, accrual rules, and approval workflows per Saudi Labor Law",
    sections: [
      { title: "Annual & Standard Leave", fields: [
        { key: "annual", label: "Annual Leave", type: "number", suffix: "days/year", description: "Saudi law: 21 days (<5yr), 30 days (5yr+)" },
        { key: "annual_after_5_years", label: "Annual Leave (5yr+)", type: "number", suffix: "days/year" },
        { key: "sick", label: "Sick Leave", type: "number", suffix: "days", description: "Saudi: 30 full + 60 at 75% + 30 unpaid" },
        { key: "sick_full_pay_days", label: "Sick Leave (Full Pay)", type: "number", suffix: "days" },
        { key: "sick_75pct_pay_days", label: "Sick Leave (75% Pay)", type: "number", suffix: "days" },
        { key: "sick_unpaid_days", label: "Sick Leave (Unpaid)", type: "number", suffix: "days" },
        { key: "sick_certificate_required_after", label: "Medical Cert Required After", type: "number", suffix: "days" },
        { key: "emergency", label: "Emergency Leave", type: "number", suffix: "days" },
        { key: "study", label: "Study/Exam Leave", type: "number", suffix: "days" },
        { key: "unpaid_leave_max", label: "Max Unpaid Leave", type: "number", suffix: "days/year" },
      ]},
      { title: "Special Leave (Saudi Labor Law)", fields: [
        { key: "maternity", label: "Maternity Leave", type: "number", suffix: "days", description: "Saudi law: 70 days (10 weeks)" },
        { key: "maternity_extension_unpaid", label: "Maternity Extension (Unpaid)", type: "number", suffix: "days" },
        { key: "paternity", label: "Paternity Leave", type: "number", suffix: "days", description: "Saudi law: 3 days" },
        { key: "marriage", label: "Marriage Leave", type: "number", suffix: "days", description: "Saudi law: 5 days" },
        { key: "bereavement", label: "Bereavement Leave", type: "number", suffix: "days", description: "Saudi law: 5 days (spouse/parent/child death)" },
        { key: "hajj", label: "Hajj Leave", type: "number", suffix: "days", description: "Saudi law: 10-15 days, once per service" },
        { key: "hajj_min_service_years", label: "Hajj Min Service", type: "number", suffix: "years", description: "Must complete before eligible" },
        { key: "iddah_leave", label: "Iddah Leave (Widow)", type: "number", suffix: "days", description: "Saudi law: 130 days for Muslim widows" },
      ]},
      { title: "Accrual & Carry Over", fields: [
        { key: "accrual_method", label: "Accrual Method", type: "select", options: ["annual_grant", "monthly_accrual", "daily_accrual"] },
        { key: "accrual_start", label: "Accrual Starts After", type: "number", suffix: "days of service" },
        { key: "max_carry_over", label: "Max Carry Over", type: "number", suffix: "days" },
        { key: "carry_over_expiry_months", label: "Carry Over Expires After", type: "number", suffix: "months" },
        { key: "encashment_allowed", label: "Leave Encashment Allowed", type: "boolean", description: "Saudi law: employer must pay for unused leave" },
        { key: "encashment_formula", label: "Encashment Rate", type: "select", options: ["basic_daily", "total_daily", "custom_rate"] },
        { key: "allow_negative_balance", label: "Allow Negative Balance", type: "boolean" },
        { key: "max_negative_days", label: "Max Negative Days", type: "number", suffix: "days" },
      ]},
      { title: "Rules & Approval", fields: [
        { key: "min_notice_days", label: "Min Advance Notice", type: "number", suffix: "days" },
        { key: "approval_required", label: "Approval Required", type: "boolean" },
        { key: "auto_approve_emergency", label: "Auto-Approve Emergency", type: "boolean" },
        { key: "allow_half_day", label: "Allow Half-Day Leave", type: "boolean" },
        { key: "allow_hourly_leave", label: "Allow Hourly Leave", type: "boolean" },
        { key: "max_consecutive_days", label: "Max Consecutive Days", type: "number", suffix: "days", description: "Alert if leave exceeds this" },
        { key: "blackout_dates", label: "Blackout Dates", type: "list", description: "Dates when leave is not allowed" },
        { key: "min_team_present_pct", label: "Min Team Present", type: "number", suffix: "%", description: "Reject if team drops below this" },
      ]},
    ],
  },
  loan: {
    label: "Loan Policy",
    icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
    color: "from-emerald-50 to-teal-50",
    description: "Employee loan limits, EMI caps, and eligibility criteria",
    sections: [
      { title: "Eligibility", fields: [
        { key: "min_service_years", label: "Min Service", type: "number", suffix: "years" },
        { key: "min_service_months", label: "Min Service (Months)", type: "number", suffix: "months", description: "Alternative to years for finer control" },
        { key: "probation_eligible", label: "Eligible During Probation", type: "boolean" },
        { key: "max_concurrent_loans", label: "Max Active Loans", type: "number" },
        { key: "min_months_between", label: "Gap Between Loans", type: "number", suffix: "months" },
      ]},
      { title: "Limits", fields: [
        { key: "max_amount_multiplier", label: "Max Amount (x Basic)", type: "number", suffix: "x basic salary" },
        { key: "max_amount_absolute", label: "Max Amount (Absolute)", type: "number", suffix: "SAR" },
        { key: "max_emi_percent", label: "Max EMI", type: "number", suffix: "% of net salary", description: "Saudi law: total deductions max 50%" },
        { key: "max_tenure_months", label: "Max Repayment Period", type: "number", suffix: "months" },
        { key: "min_amount", label: "Min Loan Amount", type: "number", suffix: "SAR" },
      ]},
      { title: "Types & Rules", fields: [
        { key: "types", label: "Available Types", type: "list" },
        { key: "interest_free", label: "Interest-Free Only", type: "boolean" },
        { key: "approval_required", label: "Approval Required", type: "boolean" },
        { key: "hr_approval_above", label: "HR Approval Above", type: "number", suffix: "SAR", description: "Additional HR sign-off above this amount" },
        { key: "ceo_approval_above", label: "CEO Approval Above", type: "number", suffix: "SAR" },
        { key: "deduction_start", label: "Deduction Starts", type: "select", options: ["next_month", "same_month", "after_2_months"] },
        { key: "early_repayment_allowed", label: "Early Repayment Allowed", type: "boolean" },
        { key: "settlement_on_exit", label: "Deduct from Final Settlement", type: "boolean" },
      ]},
    ],
  },
  travel: {
    label: "Travel & Per Diem",
    icon: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
    color: "from-sky-50 to-cyan-50",
    description: "Travel request limits, per diem rates by grade, and advance policies",
    sections: [
      { title: "General Rules", fields: [
        { key: "max_days", label: "Max Trip Duration", type: "number", suffix: "days" },
        { key: "approval_required", label: "Approval Required", type: "boolean" },
        { key: "advance_booking_days", label: "Min Advance Booking", type: "number", suffix: "days" },
        { key: "max_trips_per_year", label: "Max Trips per Year", type: "number" },
      ]},
      { title: "Per Diem Rates (International)", fields: [
        { key: "per_diem_chairman_intl", label: "Chairman/Board", type: "number", suffix: "SAR/day" },
        { key: "per_diem_clevel_intl", label: "C-Level / VP", type: "number", suffix: "SAR/day" },
        { key: "per_diem_director_intl", label: "Director / GM", type: "number", suffix: "SAR/day" },
        { key: "per_diem_manager_intl", label: "Manager", type: "number", suffix: "SAR/day" },
        { key: "per_diem_other_intl", label: "Staff", type: "number", suffix: "SAR/day" },
      ]},
      { title: "Per Diem Rates (Local/Domestic)", fields: [
        { key: "per_diem_chairman_local", label: "Chairman/Board", type: "number", suffix: "SAR/day" },
        { key: "per_diem_clevel_local", label: "C-Level / VP", type: "number", suffix: "SAR/day" },
        { key: "per_diem_director_local", label: "Director / GM", type: "number", suffix: "SAR/day" },
        { key: "per_diem_manager_local", label: "Manager", type: "number", suffix: "SAR/day" },
        { key: "per_diem_other_local", label: "Staff", type: "number", suffix: "SAR/day" },
      ]},
      { title: "Travel Advance", fields: [
        { key: "advance_allowed", label: "Travel Advance", type: "boolean" },
        { key: "advance_max_percent", label: "Max Advance", type: "number", suffix: "% of estimated cost" },
        { key: "advance_settlement_days", label: "Settlement Deadline", type: "number", suffix: "days after return" },
        { key: "receipt_required", label: "Receipts Required", type: "boolean" },
      ]},
      { title: "Travel Class", fields: [
        { key: "business_class_grade_min", label: "Business Class: Min Grade", type: "number", description: "Employees at or above this grade get business class" },
        { key: "first_class_grade_min", label: "First Class: Min Grade", type: "number" },
        { key: "hotel_budget_intl", label: "Hotel Budget (Intl)", type: "number", suffix: "SAR/night" },
        { key: "hotel_budget_local", label: "Hotel Budget (Local)", type: "number", suffix: "SAR/night" },
      ]},
    ],
  },
  expenses: {
    label: "Expenses & Claims",
    icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
    color: "from-yellow-50 to-amber-50",
    description: "Expense policies, approval thresholds, and claim limits",
    sections: [
      { title: "Approval Workflow", fields: [
        { key: "auto_approve_below", label: "Auto-Approve Below", type: "number", suffix: "SAR" },
        { key: "manager_approve_below", label: "Manager Limit", type: "number", suffix: "SAR", description: "Manager can approve up to this; above goes to HR" },
        { key: "hr_approve_below", label: "HR Limit", type: "number", suffix: "SAR" },
        { key: "cfo_approval_above", label: "CFO Required Above", type: "number", suffix: "SAR" },
        { key: "receipt_required_above", label: "Receipt Required Above", type: "number", suffix: "SAR" },
      ]},
      { title: "Limits", fields: [
        { key: "max_claim_per_category_year", label: "Max per Category/Year", type: "number", suffix: "SAR" },
        { key: "max_single_expense", label: "Max Single Expense", type: "number", suffix: "SAR" },
        { key: "reimbursement_processing_days", label: "Processing Time", type: "number", suffix: "days" },
        { key: "submission_deadline_days", label: "Submission Deadline", type: "number", suffix: "days after expense", description: "Reject if submitted too late" },
      ]},
      { title: "Categories", fields: [
        { key: "categories_enabled", label: "Expense Categories", type: "list" },
        { key: "claim_types_enabled", label: "Claim Types", type: "list" },
        { key: "mileage_rate", label: "Mileage Rate", type: "number", suffix: "SAR/km" },
        { key: "meal_limit_per_day", label: "Daily Meal Limit", type: "number", suffix: "SAR" },
      ]},
    ],
  },
  gosi: {
    label: "GOSI Social Insurance",
    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    color: "from-teal-50 to-green-50",
    description: "GOSI contribution rates and thresholds per Saudi Social Insurance Law",
    sections: [
      { title: "Saudi National Rates", fields: [
        { key: "employee_rate", label: "Employee Contribution", type: "number", suffix: "%", description: "2025: 9.75% of insurable salary" },
        { key: "employer_rate", label: "Employer Contribution", type: "number", suffix: "%", description: "2025: 11.75% of insurable salary" },
      ]},
      { title: "Rate Breakdown (Employer)", fields: [
        { key: "annuities_employee", label: "Annuities (Employee)", type: "number", suffix: "%", description: "Retirement pension fund" },
        { key: "annuities_employer", label: "Annuities (Employer)", type: "number", suffix: "%", description: "Retirement pension fund" },
        { key: "occupational_hazards_employer", label: "Occupational Hazards", type: "number", suffix: "%", description: "Work injury insurance" },
        { key: "saned_employer", label: "SANED (Unemployment)", type: "number", suffix: "%", description: "Unemployment insurance for Saudis" },
        { key: "saned_employee", label: "SANED (Employee)", type: "number", suffix: "%", description: "Employee share of SANED" },
      ]},
      { title: "Salary Thresholds", fields: [
        { key: "max_insurable_salary", label: "Max Insurable Salary", type: "number", suffix: "SAR", description: "Contributions capped at this amount" },
        { key: "min_insurable_salary", label: "Min Insurable Salary", type: "number", suffix: "SAR" },
        { key: "insurable_components", label: "Insurable Components", type: "list", description: "Which salary components count: basic, housing, etc." },
      ]},
      { title: "Non-Saudi Workers", fields: [
        { key: "non_saudi_rate", label: "Non-Saudi Employer Rate", type: "number", suffix: "%", description: "Occupational hazards only, no pension" },
        { key: "non_saudi_employee_rate", label: "Non-Saudi Employee Rate", type: "number", suffix: "%", description: "Typically 0% for non-Saudis" },
        { key: "gcc_nationals_like_saudi", label: "GCC Nationals = Saudi Rates", type: "boolean", description: "GCC nationals get Saudi treatment" },
      ]},
      { title: "Compliance & Dates", fields: [
        { key: "applies_to", label: "Applies To", type: "select", options: ["saudi_nationals", "all_employees", "gcc_nationals"] },
        { key: "effective_date", label: "Rates Effective From", type: "date" },
        { key: "gosi_registration_deadline_days", label: "New Hire Registration Deadline", type: "number", suffix: "days", description: "Days to register new employee with GOSI" },
        { key: "gosi_payment_deadline_day", label: "Monthly Payment Deadline", type: "number", suffix: "th of next month" },
        { key: "late_penalty_rate", label: "Late Payment Penalty", type: "number", suffix: "% per month" },
      ]},
    ],
  },
  end_of_service: {
    label: "End of Service (Gratuity)",
    icon: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9",
    color: "from-rose-50 to-pink-50",
    description: "Saudi Labor Law Article 84-86 gratuity calculation rules",
    sections: [
      { title: "Gratuity Rates", fields: [
        { key: "first_5_years_rate", label: "First 5 Years", type: "number", suffix: "x monthly wage/year", description: "Saudi law: half month per year" },
        { key: "after_5_years_rate", label: "After 5 Years", type: "number", suffix: "x monthly wage/year", description: "Saudi law: full month per year" },
        { key: "max_total_gratuity", label: "Max Total Gratuity", type: "number", suffix: "SAR", description: "0 = unlimited" },
      ]},
      { title: "Resignation Discounts", fields: [
        { key: "min_service_months", label: "Min Service for Any Gratuity", type: "number", suffix: "months", description: "Saudi law: 2 years minimum" },
        { key: "resignation_1_2_years", label: "Resign < 2 years", type: "number", suffix: "x (multiplier)", description: "0 = no gratuity" },
        { key: "resignation_2_5_years", label: "Resign 2-5 years", type: "number", suffix: "x", description: "Saudi law: 1/3 of gratuity" },
        { key: "resignation_5_10_years", label: "Resign 5-10 years", type: "number", suffix: "x", description: "Saudi law: 2/3 of gratuity" },
        { key: "resignation_10_plus_years", label: "Resign 10+ years", type: "number", suffix: "x", description: "Saudi law: full gratuity" },
        { key: "termination_rate", label: "Termination Multiplier", type: "number", suffix: "x", description: "Full gratuity on employer termination" },
      ]},
      { title: "Wage Basis", fields: [
        { key: "based_on", label: "Calculated On", type: "select", options: ["last_basic_plus_housing", "last_basic", "total_salary", "average_last_3_months"] },
        { key: "include_allowances", label: "Include Regular Allowances", type: "boolean", description: "Saudi law: includes all regular payments" },
        { key: "prorate_partial_year", label: "Prorate Partial Year", type: "boolean" },
        { key: "effective_date", label: "Effective Date", type: "date" },
      ]},
    ],
  },
  grievance: {
    label: "Grievance & Complaints",
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
    color: "from-red-50 to-rose-50",
    description: "Complaint handling, SLA targets, escalation rules, and whistleblower protection",
    sections: [
      { title: "Categories & Severity", fields: [
        { key: "categories", label: "Grievance Categories", type: "list" },
        { key: "severity_levels", label: "Severity Levels", type: "list" },
      ]},
      { title: "SLA Targets", fields: [
        { key: "sla_hours_low", label: "Low Priority SLA", type: "number", suffix: "hours" },
        { key: "sla_hours_medium", label: "Medium Priority SLA", type: "number", suffix: "hours" },
        { key: "sla_hours_high", label: "High Priority SLA", type: "number", suffix: "hours" },
        { key: "sla_hours_critical", label: "Critical Priority SLA", type: "number", suffix: "hours" },
        { key: "first_response_hours", label: "First Response SLA", type: "number", suffix: "hours" },
      ]},
      { title: "Rules", fields: [
        { key: "escalation_enabled", label: "Auto-Escalation", type: "boolean", description: "Auto-escalate when SLA breached" },
        { key: "escalation_to", label: "Escalate To", type: "select", options: ["hr_director", "ceo", "legal", "board_committee"] },
        { key: "anonymous_allowed", label: "Anonymous Filing", type: "boolean" },
        { key: "whistleblower_protection", label: "Whistleblower Protection", type: "boolean" },
        { key: "external_investigation_threshold", label: "External Investigation Above Severity", type: "select", options: ["high", "critical", "never"] },
        { key: "mandatory_investigation_categories", label: "Mandatory Investigation Categories", type: "list", description: "Always trigger formal investigation" },
      ]},
    ],
  },
  probation: {
    label: "Probation & Notice Period",
    icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
    color: "from-orange-50 to-amber-50",
    description: "Probation periods and notice requirements per Saudi Labor Law Article 53-54",
    sections: [
      { title: "Probation", fields: [
        { key: "probation_days", label: "Standard Probation", type: "number", suffix: "days", description: "Saudi law: max 90 days" },
        { key: "probation_extendable", label: "Extendable to 180 Days", type: "boolean" },
        { key: "probation_extension_requires", label: "Extension Requires", type: "select", options: ["mutual_agreement", "employer_decision", "hr_approval"] },
        { key: "probation_leave_accrual", label: "Accrue Leave During Probation", type: "boolean" },
        { key: "probation_gosi_from_day1", label: "GOSI from Day 1", type: "boolean", description: "Register with GOSI during probation" },
        { key: "probation_termination_notice", label: "Notice During Probation", type: "number", suffix: "days" },
        { key: "probation_eos_eligible", label: "EOS Eligible During Probation", type: "boolean" },
      ]},
      { title: "Notice Period", fields: [
        { key: "notice_unlimited", label: "Unlimited Contract", type: "number", suffix: "days", description: "Saudi law: 60 days" },
        { key: "notice_fixed", label: "Fixed Contract", type: "number", suffix: "days" },
        { key: "notice_probation", label: "During Probation", type: "number", suffix: "days" },
        { key: "notice_by_grade", label: "Different by Grade", type: "boolean", description: "Senior roles may need longer notice" },
        { key: "notice_grade_30_below", label: "Grade 30 & Below", type: "number", suffix: "days" },
        { key: "notice_grade_31_35", label: "Grade 31-35", type: "number", suffix: "days" },
        { key: "notice_grade_36_above", label: "Grade 36+", type: "number", suffix: "days" },
        { key: "notice_deduction", label: "Deduct Unserved Notice", type: "boolean" },
        { key: "garden_leave_allowed", label: "Garden Leave Allowed", type: "boolean", description: "Pay instead of working notice period" },
      ]},
    ],
  },
  documents: {
    label: "Letters & Documents",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    color: "from-slate-50 to-gray-50",
    description: "Letter templates, numbering, signatory, and processing rules",
    sections: [
      { title: "Signatory", fields: [
        { key: "signatory_name", label: "Signatory Name", type: "text" },
        { key: "signatory_name_ar", label: "Signatory Name (Arabic)", type: "text" },
        { key: "signatory_title", label: "Title", type: "text", placeholder: "HR Director" },
        { key: "signatory_title_ar", label: "Title (Arabic)", type: "text" },
        { key: "secondary_signatory_name", label: "Secondary Signatory", type: "text", description: "For high-value documents" },
        { key: "secondary_signatory_title", label: "Secondary Title", type: "text" },
      ]},
      { title: "Document Rules", fields: [
        { key: "letter_prefix", label: "Letter Ref Prefix", type: "text", placeholder: "LTR" },
        { key: "auto_expiry_days", label: "Certificate Validity", type: "number", suffix: "days" },
        { key: "processing_days", label: "Processing Time", type: "number", suffix: "business days" },
        { key: "max_requests_per_month", label: "Max Requests/Month", type: "number" },
        { key: "salary_cert_approval", label: "Salary Cert Needs Approval", type: "boolean", description: "Contains sensitive salary info" },
        { key: "available_letter_types", label: "Available Types", type: "list" },
        { key: "watermark_enabled", label: "Digital Watermark", type: "boolean" },
        { key: "bilingual_letters", label: "Bilingual (EN+AR)", type: "boolean" },
      ]},
    ],
  },
  iqama_visa: {
    label: "Iqama / Visa Compliance",
    icon: "M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z",
    color: "from-cyan-50 to-sky-50",
    description: "Government document tracking, renewal alerts, and compliance requirements",
    sections: [
      { title: "Reminders", fields: [
        { key: "reminder_days_90", label: "First Alert", type: "number", suffix: "days before expiry" },
        { key: "reminder_days_60", label: "Second Alert", type: "number", suffix: "days before expiry" },
        { key: "reminder_days_30", label: "Urgent Alert", type: "number", suffix: "days before expiry" },
        { key: "reminder_days_7", label: "Critical Alert", type: "number", suffix: "days before expiry" },
        { key: "auto_escalation", label: "Auto-Escalate to HR", type: "boolean" },
        { key: "escalation_days", label: "Escalate After", type: "number", suffix: "days before expiry" },
      ]},
      { title: "Costs & Budgeting", fields: [
        { key: "iqama_renewal_cost", label: "Iqama Renewal", type: "number", suffix: "SAR" },
        { key: "iqama_late_penalty", label: "Late Renewal Penalty", type: "number", suffix: "SAR/day" },
        { key: "exit_reentry_single", label: "Exit/Re-entry (Single)", type: "number", suffix: "SAR" },
        { key: "exit_reentry_multiple", label: "Exit/Re-entry (Multiple)", type: "number", suffix: "SAR" },
        { key: "work_visa_cost", label: "Work Visa Cost", type: "number", suffix: "SAR" },
        { key: "medical_insurance_cost", label: "Medical Insurance/Year", type: "number", suffix: "SAR" },
        { key: "dependent_iqama_cost", label: "Dependent Iqama Fee", type: "number", suffix: "SAR/dependent" },
      ]},
      { title: "Compliance Rules", fields: [
        { key: "medical_insurance_mandatory", label: "Medical Insurance Required", type: "boolean" },
        { key: "professional_license_required", label: "Professional License Track", type: "boolean", description: "For doctors, engineers, etc." },
        { key: "block_payroll_expired_iqama", label: "Block Payroll if Expired", type: "boolean" },
        { key: "document_types_tracked", label: "Document Types Tracked", type: "list" },
      ]},
    ],
  },
  exit: {
    label: "Exit & Offboarding",
    icon: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75",
    color: "from-gray-50 to-slate-50",
    description: "Offboarding workflow, clearance checklist, and final settlement rules",
    sections: [
      { title: "Clearance Process", fields: [
        { key: "clearance_departments", label: "Clearance Departments", type: "list" },
        { key: "clearance_deadline_days", label: "Clearance Deadline", type: "number", suffix: "days from notice" },
        { key: "parallel_clearance", label: "Parallel Clearance", type: "boolean", description: "All departments clear simultaneously" },
        { key: "hr_final_sign_off", label: "HR Final Sign-Off Required", type: "boolean" },
      ]},
      { title: "Notice & Timeline", fields: [
        { key: "notice_enforcement", label: "Enforce Notice Period", type: "boolean" },
        { key: "settlement_deadline_days", label: "Settlement Payment Deadline", type: "number", suffix: "days", description: "Saudi law: within 7 days" },
        { key: "last_working_day_calculation", label: "Last Day Calculation", type: "select", options: ["notice_period_from_today", "end_of_month", "custom_date"] },
      ]},
      { title: "Final Settlement", fields: [
        { key: "include_eos_gratuity", label: "Include EOS Gratuity", type: "boolean" },
        { key: "include_leave_encashment", label: "Include Leave Encashment", type: "boolean" },
        { key: "include_pending_salary", label: "Include Pending Salary", type: "boolean" },
        { key: "include_pending_expenses", label: "Include Pending Expenses", type: "boolean" },
        { key: "deduct_outstanding_loans", label: "Deduct Loans", type: "boolean" },
        { key: "deduct_unreturned_assets", label: "Deduct Unreturned Assets", type: "boolean" },
        { key: "deduct_unserved_notice", label: "Deduct Unserved Notice", type: "boolean" },
      ]},
      { title: "Asset Return & Exit Interview", fields: [
        { key: "asset_return_checklist", label: "Asset Checklist", type: "list" },
        { key: "exit_interview_required", label: "Exit Interview Required", type: "boolean" },
        { key: "exit_interview_conducted_by", label: "Conducted By", type: "select", options: ["hr_manager", "department_head", "ceo", "external"] },
        { key: "reference_letter_auto", label: "Auto-Issue Reference Letter", type: "boolean" },
        { key: "revoke_access_on_last_day", label: "Revoke Access on Last Day", type: "boolean" },
        { key: "alumni_program", label: "Alumni Network Enrollment", type: "boolean" },
      ]},
    ],
  },
  recruitment: {
    label: "Recruitment & Interviews",
    icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    color: "from-fuchsia-50 to-pink-50",
    description: "Interview stages, scoring, onboarding timeline, and hiring workflows",
    sections: [
      { title: "Interview Process", fields: [
        { key: "stages_enabled", label: "Interview Stages", type: "list" },
        { key: "min_passing_score", label: "Min Passing Score", type: "number", suffix: "out of 5" },
        { key: "max_interviews_per_candidate", label: "Max Interviews per Candidate", type: "number" },
        { key: "interview_expiry_days", label: "Interview Result Valid For", type: "number", suffix: "days" },
        { key: "panel_interview_required", label: "Panel Interview for Senior Roles", type: "boolean" },
        { key: "panel_min_interviewers", label: "Min Panel Members", type: "number" },
      ]},
      { title: "Hiring Approvals", fields: [
        { key: "offer_approval_required", label: "Offer Needs Approval", type: "boolean" },
        { key: "offer_approval_chain", label: "Approval Chain", type: "list", description: "e.g. HR Manager, Department Head, CEO" },
        { key: "salary_negotiation_range", label: "Salary Negotiation Range", type: "number", suffix: "% above posted" },
        { key: "reference_check_required", label: "Reference Check Required", type: "boolean" },
        { key: "background_check_required", label: "Background Check Required", type: "boolean" },
        { key: "medical_exam_required", label: "Medical Exam Required", type: "boolean" },
      ]},
      { title: "Onboarding", fields: [
        { key: "onboarding_checklist", label: "Onboarding Checklist Items", type: "list" },
        { key: "onboarding_duration_days", label: "Onboarding Period", type: "number", suffix: "days" },
        { key: "buddy_system", label: "Assign Buddy/Mentor", type: "boolean" },
        { key: "orientation_required", label: "Orientation Session Required", type: "boolean" },
        { key: "it_setup_advance_days", label: "IT Setup Advance Notice", type: "number", suffix: "days before join" },
      ]},
    ],
  },
  training: {
    label: "Training & Development",
    icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5",
    color: "from-lime-50 to-green-50",
    description: "Training requirements, budgets, compliance tracking, and career development",
    sections: [
      { title: "Requirements", fields: [
        { key: "mandatory_deadline_days", label: "Mandatory Training Deadline", type: "number", suffix: "days after joining" },
        { key: "annual_hours_required", label: "Annual Training Hours", type: "number", suffix: "hours" },
        { key: "compliance_target", label: "Compliance Target", type: "number", suffix: "%" },
        { key: "safety_training_required", label: "Safety Training Mandatory", type: "boolean" },
        { key: "safety_training_renewal", label: "Safety Renewal Interval", type: "number", suffix: "months" },
      ]},
      { title: "Budget", fields: [
        { key: "budget_per_employee", label: "Budget per Employee", type: "number", suffix: "SAR/year" },
        { key: "department_budget_enabled", label: "Department Budget Limits", type: "boolean" },
        { key: "external_training_approval", label: "External Training Needs Approval", type: "boolean" },
        { key: "conference_attendance_max", label: "Conferences per Year", type: "number" },
      ]},
      { title: "Certifications", fields: [
        { key: "certification_reminder_days", label: "Cert Renewal Reminder", type: "number", suffix: "days" },
        { key: "certification_cost_covered", label: "Company Covers Cert Cost", type: "boolean" },
        { key: "certification_bonus", label: "Certification Bonus", type: "number", suffix: "SAR" },
        { key: "professional_dev_leave_days", label: "Professional Dev Leave", type: "number", suffix: "days/year" },
      ]},
    ],
  },
  notifications: {
    label: "Notifications & Alerts",
    icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
    color: "from-blue-50 to-indigo-50",
    description: "Notification channels, escalation rules, and integration webhooks",
    sections: [
      { title: "Channels", fields: [
        { key: "email_enabled", label: "Email Notifications", type: "boolean" },
        { key: "email_from", label: "From Email Address", type: "text", placeholder: "hr@company.sa" },
        { key: "whatsapp_enabled", label: "WhatsApp Notifications", type: "boolean" },
        { key: "sms_enabled", label: "SMS Notifications", type: "boolean" },
        { key: "push_enabled", label: "Push Notifications", type: "boolean" },
      ]},
      { title: "Event Triggers", fields: [
        { key: "notify_on_approval", label: "On Approval", type: "boolean" },
        { key: "notify_on_rejection", label: "On Rejection", type: "boolean" },
        { key: "notify_manager_on_request", label: "Manager on New Request", type: "boolean" },
        { key: "notify_on_clock_in", label: "On Clock In/Out", type: "boolean" },
        { key: "notify_on_salary", label: "On Salary Processed", type: "boolean" },
        { key: "notify_on_document_ready", label: "On Document Ready", type: "boolean" },
        { key: "notify_birthday", label: "Birthday Reminders", type: "boolean" },
        { key: "notify_work_anniversary", label: "Work Anniversary", type: "boolean" },
        { key: "notify_contract_expiry", label: "Contract Expiry Alert", type: "boolean" },
        { key: "notify_probation_end", label: "Probation End Alert", type: "boolean" },
      ]},
      { title: "Digest & Integration", fields: [
        { key: "daily_digest", label: "Daily Digest", type: "boolean" },
        { key: "digest_time", label: "Digest Time", type: "time" },
        { key: "weekly_summary", label: "Weekly Summary (Managers)", type: "boolean" },
        { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://..." },
        { key: "webhook_events", label: "Webhook Events", type: "list", description: "Which events trigger webhook" },
        { key: "slack_webhook", label: "Slack Webhook", type: "text" },
        { key: "teams_webhook", label: "MS Teams Webhook", type: "text" },
      ]},
    ],
  },
  security: {
    label: "Security & Access Control",
    icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
    color: "from-gray-100 to-slate-100",
    description: "Access control, authentication, audit logging, and data privacy",
    sections: [
      { title: "Access Control", fields: [
        { key: "admin_employee_ids", label: "Admin Employee IDs", type: "list" },
        { key: "hr_employee_ids", label: "HR Staff IDs", type: "list", description: "Can access sensitive employee data" },
        { key: "finance_employee_ids", label: "Finance Staff IDs", type: "list", description: "Can access payroll data" },
        { key: "role_based_access", label: "Role-Based Access Control", type: "boolean" },
      ]},
      { title: "Authentication", fields: [
        { key: "pin_min_length", label: "Min PIN Length", type: "number" },
        { key: "pin_max_length", label: "Max PIN Length", type: "number" },
        { key: "require_pin_change_days", label: "Force PIN Change Every", type: "number", suffix: "days", description: "0 = never" },
        { key: "max_login_attempts", label: "Max Login Attempts", type: "number" },
        { key: "lockout_duration_minutes", label: "Lockout Duration", type: "number", suffix: "min" },
        { key: "session_timeout_minutes", label: "Session Timeout", type: "number", suffix: "min" },
        { key: "two_factor_enabled", label: "Two-Factor Auth", type: "boolean" },
        { key: "biometric_enabled", label: "Biometric Login", type: "boolean" },
      ]},
      { title: "Audit & Privacy", fields: [
        { key: "audit_log_enabled", label: "Audit Logging", type: "boolean" },
        { key: "audit_log_retention_days", label: "Log Retention", type: "number", suffix: "days" },
        { key: "salary_visible_to_manager", label: "Managers See Salary", type: "boolean" },
        { key: "personal_data_export", label: "Allow Data Export (GDPR)", type: "boolean" },
        { key: "data_retention_years", label: "Data Retention", type: "number", suffix: "years after exit" },
        { key: "ip_whitelist", label: "IP Whitelist", type: "list", description: "Restrict admin access to these IPs" },
      ]},
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

  useEffect(() => {
    const d: Record<string, any> = {};
    for (const cat of CATEGORY_ORDER) {
      const existing = policies[cat] || {};
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

  // Count total fields
  const totalFields = schema?.sections.reduce((sum, s) => sum + s.fields.length, 0) || 0;
  const filledFields = schema?.sections.reduce((sum, s) => sum + s.fields.filter(f => {
    const v = draft[f.key];
    return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length, 0) || 0;

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-sm font-bold text-gray-800">Settings</h3>
            <p className="text-[10px] text-gray-400">{CATEGORY_ORDER.length} configuration groups</p>
          </div>
          <div className="py-1 max-h-[560px] overflow-y-auto">
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
      <div className="flex-1 min-w-0">
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
                  <p className="text-[10px] text-gray-400 mt-0.5">{filledFields}/{totalFields} fields configured</p>
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

            {/* Sections */}
            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
              {schema.sections.map((section, si) => (
                <div key={si}>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-px bg-gray-200" />
                    {section.title}
                    <span className="w-full h-px bg-gray-200" />
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.fields.map(field => {
                      const val = draft[field.key];
                      const isWide = field.type === "textarea" || field.type === "list" || field.type === "json";
                      return (
                        <div key={field.key} className={isWide ? "md:col-span-2" : ""}>
                          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 hover:border-gray-200 transition-all h-full">
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="flex-1">
                                <label className="text-[11px] font-semibold text-gray-700">{field.label}</label>
                                {field.description && <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{field.description}</p>}
                              </div>
                              {field.suffix && <span className="text-[9px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">{field.suffix}</span>}
                            </div>

                            {field.type === "boolean" && (
                              isEditing ? (
                                <button onClick={() => handleChange(activeGroup, field.key, !val)}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                    val ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-red-100 text-red-700 border border-red-200"
                                  }`}>
                                  {val ? "Enabled" : "Disabled"}
                                </button>
                              ) : (
                                <p className={`text-sm font-bold ${val ? "text-emerald-600" : "text-gray-400"}`}>{val ? "Enabled" : "Disabled"}</p>
                              )
                            )}

                            {field.type === "number" && (
                              isEditing ? (
                                <input type="number" value={val ?? ""} min={field.min} max={field.max}
                                  onChange={e => handleChange(activeGroup, field.key, e.target.value === "" ? "" : Number(e.target.value))}
                                  className="w-full text-sm font-bold text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none" />
                              ) : (
                                <p className="text-sm font-bold text-gray-900">{val !== undefined && val !== null && val !== "" ? String(val) : <span className="text-gray-300 font-normal">Not set</span>}</p>
                              )
                            )}

                            {(field.type === "text" || field.type === "time" || field.type === "date") && (
                              isEditing ? (
                                <input type={field.type === "time" ? "time" : field.type === "date" ? "date" : "text"}
                                  value={val ?? ""} placeholder={field.placeholder}
                                  onChange={e => handleChange(activeGroup, field.key, e.target.value)}
                                  className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none" />
                              ) : (
                                <p className="text-sm font-bold text-gray-900">{val || <span className="text-gray-300 font-normal">Not set</span>}</p>
                              )
                            )}

                            {field.type === "textarea" && (
                              isEditing ? (
                                <textarea value={val ?? ""} rows={2} placeholder={field.placeholder}
                                  onChange={e => handleChange(activeGroup, field.key, e.target.value)}
                                  className="w-full text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none resize-none" />
                              ) : (
                                <p className="text-sm text-gray-900 whitespace-pre-wrap">{val || <span className="text-gray-300 font-normal">Not set</span>}</p>
                              )
                            )}

                            {field.type === "select" && (
                              isEditing ? (
                                <select value={val ?? ""} onChange={e => handleChange(activeGroup, field.key, e.target.value)}
                                  className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none">
                                  <option value="">Select...</option>
                                  {field.options?.map(o => <option key={o} value={o}>{o.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                                </select>
                              ) : (
                                <p className="text-sm font-bold text-gray-900">{val ? String(val).replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) : <span className="text-gray-300 font-normal">Not set</span>}</p>
                              )
                            )}

                            {field.type === "list" && (
                              <div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(Array.isArray(val) ? val : []).map((item: string, idx: number) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-[11px] text-gray-700">
                                      {item}
                                      {isEditing && (
                                        <button onClick={() => handleRemoveListItem(activeGroup, field.key, idx)}
                                          className="text-red-400 hover:text-red-600 ml-0.5 text-xs">x</button>
                                      )}
                                    </span>
                                  ))}
                                  {(!val || val.length === 0) && !isEditing && <span className="text-gray-300 text-[11px]">No items</span>}
                                </div>
                                {isEditing && (
                                  <button onClick={() => handleAddListItem(activeGroup, field.key)}
                                    className="mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[11px] font-medium border border-emerald-200 hover:bg-emerald-100 transition-all">
                                    + Add
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
