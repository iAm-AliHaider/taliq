const translations: Record<string, Record<string, string>> = {
  en: {
    // General
    "app.name": "Taliq",
    "app.subtitle": "Voice-First HR",
    "app.tagline": "HR Management Console",
    "loading.connecting": "Connecting to Taliq...",
    "loading.welcome": "Welcome",
    
    // Auth
    "auth.title": "Welcome to Taliq",
    "auth.subtitle": "Voice-First HR Platform",
    "auth.select_employee": "Select Employee",
    "auth.enter_pin": "Enter PIN",
    "auth.login": "Sign In",
    "auth.logging_in": "Signing in...",
    "auth.invalid": "Invalid PIN. Please try again.",
    "auth.admin_required": "Admin Access Required",
    "auth.admin_hint": "Login as admin (E005 / PIN: 5678) from the main page first.",
    "auth.go_login": "Go to Login",
    
    // Header
    "header.manager": "Manager",
    "header.admin": "Admin Panel",
    "header.logout": "Sign out",
    
    // Dashboard
    "dashboard.good_morning": "Good Morning",
    "dashboard.good_afternoon": "Good Afternoon",
    "dashboard.good_evening": "Good Evening",
    "dashboard.annual_leave": "Annual Leave",
    "dashboard.active_loans": "Active Loans",
    "dashboard.requests": "Requests",
    "dashboard.approvals": "Approvals",
    "dashboard.news": "News",
    "dashboard.quick_actions": "Quick Actions",
    "dashboard.manager_actions": "Manager Actions",
    "dashboard.not_clocked": "Not clocked in",
    "dashboard.in_since": "In since",
    
    // Actions
    "action.clock_in": "Clock In",
    "action.clock_out": "Clock Out",
    "action.apply_leave": "Apply Leave",
    "action.pay_slip": "Pay Slip",
    "action.documents": "Documents",
    "action.attendance": "Attendance",
    "action.loans": "Loans",
    "action.team": "Team",
    "action.approvals": "Approvals",
    "action.interview": "Interview",
    "action.start_day": "Start day",
    "action.end_day": "End day",
    "action.this_week": "This week",
    "action.check": "Check",
    "action.request": "Request",
    "action.pending": "pending",
    "action.members": "members",
    "action.start_new": "Start new",
    
    // Voice
    "voice.hold_to_speak": "Hold to speak",
    "voice.click_to_speak": "Click to speak",
    "voice.release_to_send": "Release to send",
    "voice.click_to_stop": "Listening - click to stop",
    "voice.speaking": "Speaking...",
    "voice.thinking": "Thinking...",
    "voice.connecting": "Connecting...",
    "voice.start_speaking": "Start speaking or tap a quick action",
    
    // Quick actions
    "qa.leave": "Leave",
    "qa.profile": "Profile",
    "qa.payslip": "Pay Slip",
    "qa.team": "Team",
    "qa.loans": "Loans",
    "qa.approvals": "Approvals",
    "qa.docs": "Docs",
    "qa.news": "News",
    "qa.travel": "Travel",
    
    // Panel
    "panel.hr_dashboard": "HR Dashboard",
    "panel.ask_taliq": "Ask Taliq anything or tap a quick action. Interactive cards appear here.",
    "panel.active": "Active",
    
    // Tags
    "tag.leave": "Leave",
    "tag.payroll": "Payroll",
    "tag.loans": "Loans",
    "tag.travel": "Travel",
    "tag.documents": "Documents",
    "tag.attendance": "Attendance",
    // Common labels
    "common.employee": "Employee",
    "common.department": "Department",
    "common.position": "Position",
    "common.status": "Status",
    "common.date": "Date",
    "common.amount": "Amount",
    "common.type": "Type",
    "common.ref": "Reference",
    "common.actions": "Actions",
    "common.submit": "Submit",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.approve": "Approve",
    "common.reject": "Reject",
    "common.pending": "Pending",
    "common.approved": "Approved",
    "common.rejected": "Rejected",
    "common.completed": "Completed",
    "common.active": "Active",
    "common.total": "Total",
    "common.details": "Details",
    "common.search": "Search",
    "common.no_data": "No data found",
    "common.loading": "Loading...",
    "common.sar": "SAR",
    "common.days": "days",
    "common.hours": "hours",
    "common.download_pdf": "Download PDF",
    
    // Letters
    "letter.title": "Generated Letters",
    "letter.employment_cert": "Employment Certificate",
    "letter.salary_cert": "Salary Certificate",
    "letter.experience": "Experience Letter",
    "letter.noc": "No Objection Certificate",
    "letter.bank": "Bank Letter",
    "letter.purpose": "Purpose",
    "letter.addressed_to": "Addressed To",
    "letter.generated": "Generated",
    
    // Contracts
    "contract.title": "Employment Contract",
    "contract.type": "Contract Type",
    "contract.fixed": "Fixed Term",
    "contract.unlimited": "Unlimited",
    "contract.start_date": "Start Date",
    "contract.end_date": "End Date",
    "contract.probation": "Probation End",
    "contract.salary": "Contract Salary",
    "contract.days_left": "days left",
    "contract.expired": "Expired",
    "contract.expiring": "Expiring Contracts",
    
    // Assets
    "asset.title": "My Company Assets",
    "asset.inventory": "Asset Inventory",
    "asset.assigned": "Assigned",
    "asset.available": "Available",
    "asset.type": "Asset Type",
    "asset.serial": "Serial Number",
    "asset.condition": "Condition",
    "asset.good": "Good",
    
    // Shifts
    "shift.title": "Work Shift",
    "shift.team_shifts": "Team Shift Schedule",
    "shift.start": "Start",
    "shift.end": "End",
    "shift.break": "Break",
    "shift.night": "Night Shift",
    "shift.differential": "Night Differential",
    "shift.morning": "Morning",
    "shift.evening": "Evening",
    "shift.ramadan": "Ramadan",
    
    // Reports
    "report.title": "HR Analytics Report",
    "report.overview": "Overview",
    "report.workforce": "Workforce",
    "report.financial": "Financial",
    "report.headcount": "Total Employees",
    "report.monthly_payroll": "Monthly Payroll",
    "report.active_exits": "Active Exits",
    "report.expiring_docs": "Expiring Documents",
    "report.by_dept": "By Department",
    "report.by_nationality": "By Nationality",
    "report.export_csv": "Export CSV",
    "report.payroll_summary": "Monthly Payroll Summary",
    
    // Directory
    "dir.title": "Employee Directory",
    "dir.search": "Search employees...",
    "dir.org_chart": "Organization Chart",
    
    // Iqama/Visa
    "visa.title": "Iqama & Visa Documents",
    "visa.iqama": "Iqama (Residency Permit)",
    "visa.passport": "Passport",
    "visa.work_visa": "Work Visa",
    "visa.medical": "Medical Insurance",
    "visa.expiring": "Expiring Documents",
    "visa.valid": "Valid",
    "visa.expiring_soon": "Expiring Soon",
    "visa.expired": "Expired",
    "visa.days_left": "days left",
    
    // Exit/Offboarding
    "exit.title": "Exit / Offboarding",
    "exit.resignation": "Resignation",
    "exit.termination": "Termination",
    "exit.last_day": "Last Working Day",
    "exit.clearance": "Clearance Progress",
    "exit.settlement": "Final Settlement",
    "exit.eos": "End of Service (EOS)",
    "exit.leave_encash": "Leave Encashment",
    "exit.pending_salary": "Pending Salary",
    "exit.total_settlement": "Total Settlement",
    "exit.it_assets": "IT Assets Return",
    "exit.access_cards": "Access Cards",
    "exit.finance": "Finance Clearance",
    "exit.hr_docs": "HR Documents",
    "exit.knowledge": "Knowledge Transfer",
    "exit.manager_sign": "Manager Sign-off",
    
    // Expenses
    "expense.title": "Expenses",
    "expense.submit": "Submit Expense",
    "expense.category": "Category",
    "expense.description": "Description",
    "expense.receipt": "Receipt Reference",
    "expense.travel": "Travel",
    "expense.meals": "Meals",
    "expense.office": "Office Supplies",
    "expense.training": "Training",
    "expense.other": "Other",
    
    // Claims
    "claim.title": "Claims",
    "claim.submit": "Submit Claim",
    "claim.medical": "Medical",
    "claim.education": "Education",
    "claim.relocation": "Relocation",
    
    // Payments
    "payment.title": "Payments",
    "payment.salary": "Salary",
    "payment.reimbursement": "Reimbursement",
    "payment.bonus": "Bonus",
    
    // GOSI
    "gosi.title": "GOSI Social Insurance",
    "gosi.employee_share": "Employee Share",
    "gosi.employer_share": "Employer Share",
    "gosi.monthly": "Monthly",
    "gosi.annual": "Annual",
    
    // EOS
    "eos.title": "End of Service Benefits",
    "eos.gratuity": "Gratuity",
    "eos.years_service": "Years of Service",
    
    // Salary
    "salary.title": "Salary Breakdown",
    "salary.basic": "Basic Salary",
    "salary.housing": "Housing Allowance",
    "salary.transport": "Transport Allowance",
    "salary.gross": "Gross Salary",
    "salary.deductions": "Deductions",
    "salary.net": "Net Salary",
    "salary.ytd": "Year to Date",
    "salary.pay_info": "Pay Info",
    
    // Performance
    "perf.title": "Performance Review",
    "perf.goals": "Goals",
    "perf.rating": "Rating",
    "perf.strengths": "Strengths",
    "perf.improvements": "Areas for Improvement",
    
    // Training
    "training.title": "Training & Development",
    "training.available": "Available Courses",
    "training.enrolled": "Enrolled",
    "training.completed": "Completed",
    "training.enroll": "Enroll",
    
    // Grievance
    "grievance.title": "Grievances",
    "grievance.file": "File Grievance",
    "grievance.category": "Category",
    "grievance.severity": "Severity",
    "grievance.resolution": "Resolution",
    
    // Interview
    "interview.title": "AI Interviewer",
    "interview.start": "Start Interview",
    "interview.score": "Score",
    "interview.feedback": "Feedback",
  },
  ar: {
    // General
    "app.name": "تليق",
    "app.subtitle": "الموارد البشرية الصوتية",
    "app.tagline": "لوحة إدارة الموارد البشرية",
    "loading.connecting": "...جاري الاتصال بتليق",
    "loading.welcome": "مرحباً",
    
    // Auth
    "auth.title": "مرحباً بك في تليق",
    "auth.subtitle": "منصة الموارد البشرية الصوتية",
    "auth.select_employee": "اختر الموظف",
    "auth.enter_pin": "أدخل الرمز",
    "auth.login": "تسجيل الدخول",
    "auth.logging_in": "...جاري الدخول",
    "auth.invalid": "الرمز غير صحيح. حاول مرة أخرى.",
    "auth.admin_required": "مطلوب صلاحية المدير",
    "auth.admin_hint": "سجل دخول كمدير (E005 / رمز: 5678) من الصفحة الرئيسية أولاً.",
    "auth.go_login": "الذهاب لتسجيل الدخول",
    
    // Header
    "header.manager": "مدير",
    "header.admin": "لوحة الإدارة",
    "header.logout": "تسجيل خروج",
    
    // Dashboard
    "dashboard.good_morning": "صباح الخير",
    "dashboard.good_afternoon": "مساء الخير",
    "dashboard.good_evening": "مساء الخير",
    "dashboard.annual_leave": "إجازة سنوية",
    "dashboard.active_loans": "قروض نشطة",
    "dashboard.requests": "طلبات",
    "dashboard.approvals": "موافقات",
    "dashboard.news": "أخبار",
    "dashboard.quick_actions": "إجراءات سريعة",
    "dashboard.manager_actions": "إجراءات المدير",
    "dashboard.not_clocked": "لم يتم تسجيل الحضور",
    "dashboard.in_since": "حاضر منذ",
    
    // Actions
    "action.clock_in": "تسجيل حضور",
    "action.clock_out": "تسجيل انصراف",
    "action.apply_leave": "طلب إجازة",
    "action.pay_slip": "كشف الراتب",
    "action.documents": "المستندات",
    "action.attendance": "الحضور",
    "action.loans": "القروض",
    "action.team": "الفريق",
    "action.approvals": "الموافقات",
    "action.interview": "مقابلة",
    "action.start_day": "بداية اليوم",
    "action.end_day": "نهاية اليوم",
    "action.this_week": "هذا الأسبوع",
    "action.check": "فحص",
    "action.request": "طلب",
    "action.pending": "معلق",
    "action.members": "أعضاء",
    "action.start_new": "بدء جديد",
    
    // Voice
    "voice.hold_to_speak": "اضغط مع الاستمرار للتحدث",
    "voice.click_to_speak": "اضغط للتحدث",
    "voice.release_to_send": "حرر للإرسال",
    "voice.click_to_stop": "جاري الاستماع - اضغط للإيقاف",
    "voice.speaking": "...يتحدث",
    "voice.thinking": "...يفكر",
    "voice.connecting": "...جاري الاتصال",
    "voice.start_speaking": "ابدأ بالتحدث أو اختر إجراء سريع",
    
    // Quick actions
    "qa.leave": "إجازة",
    "qa.profile": "الملف",
    "qa.payslip": "الراتب",
    "qa.team": "الفريق",
    "qa.loans": "القروض",
    "qa.approvals": "الموافقات",
    "qa.docs": "المستندات",
    "qa.news": "الأخبار",
    "qa.travel": "السفر",
    
    // Panel
    "panel.hr_dashboard": "لوحة الموارد البشرية",
    "panel.ask_taliq": "اسأل تليق أي شيء أو اختر إجراء سريع. البطاقات التفاعلية تظهر هنا.",
    "panel.active": "نشط",
    
    // Tags
    "tag.leave": "إجازة",
    "tag.payroll": "الرواتب",
    "tag.loans": "القروض",
    "tag.travel": "السفر",
    "tag.documents": "المستندات",
    "tag.attendance": "الحضور",
    // Common labels
    "common.employee": "موظف",
    "common.department": "القسم",
    "common.position": "المنصب",
    "common.status": "الحالة",
    "common.date": "التاريخ",
    "common.amount": "المبلغ",
    "common.type": "النوع",
    "common.ref": "المرجع",
    "common.actions": "الإجراءات",
    "common.submit": "إرسال",
    "common.cancel": "إلغاء",
    "common.save": "حفظ",
    "common.edit": "تعديل",
    "common.delete": "حذف",
    "common.approve": "موافقة",
    "common.reject": "رفض",
    "common.pending": "معلق",
    "common.approved": "مقبول",
    "common.rejected": "مرفوض",
    "common.completed": "مكتمل",
    "common.active": "نشط",
    "common.total": "الإجمالي",
    "common.details": "تفاصيل",
    "common.search": "بحث",
    "common.no_data": "لا توجد بيانات",
    "common.loading": "...جاري التحميل",
    "common.sar": "ريال",
    "common.days": "أيام",
    "common.hours": "ساعات",
    "common.download_pdf": "تحميل PDF",
    
    // Letters
    "letter.title": "الخطابات المُصدرة",
    "letter.employment_cert": "شهادة عمل",
    "letter.salary_cert": "شهادة راتب",
    "letter.experience": "خطاب خبرة",
    "letter.noc": "شهادة عدم ممانعة",
    "letter.bank": "خطاب بنكي",
    "letter.purpose": "الغرض",
    "letter.addressed_to": "موجه إلى",
    "letter.generated": "تم الإصدار",
    
    // Contracts
    "contract.title": "عقد العمل",
    "contract.type": "نوع العقد",
    "contract.fixed": "محدد المدة",
    "contract.unlimited": "غير محدد",
    "contract.start_date": "تاريخ البداية",
    "contract.end_date": "تاريخ الانتهاء",
    "contract.probation": "نهاية التجربة",
    "contract.salary": "راتب العقد",
    "contract.days_left": "يوم متبقي",
    "contract.expired": "منتهي",
    "contract.expiring": "عقود منتهية",
    
    // Assets
    "asset.title": "أصول الشركة",
    "asset.inventory": "جرد الأصول",
    "asset.assigned": "مخصص",
    "asset.available": "متاح",
    "asset.type": "نوع الأصل",
    "asset.serial": "الرقم التسلسلي",
    "asset.condition": "الحالة",
    "asset.good": "جيد",
    
    // Shifts
    "shift.title": "جدول العمل",
    "shift.team_shifts": "جدول الفريق",
    "shift.start": "بداية",
    "shift.end": "نهاية",
    "shift.break": "استراحة",
    "shift.night": "وردية ليلية",
    "shift.differential": "بدل ليلي",
    "shift.morning": "صباحية",
    "shift.evening": "مسائية",
    "shift.ramadan": "رمضان",
    
    // Reports
    "report.title": "تقارير الموارد البشرية",
    "report.overview": "نظرة عامة",
    "report.workforce": "القوى العاملة",
    "report.financial": "مالي",
    "report.headcount": "عدد الموظفين",
    "report.monthly_payroll": "الرواتب الشهرية",
    "report.active_exits": "حالات خروج نشطة",
    "report.expiring_docs": "مستندات منتهية",
    "report.by_dept": "حسب القسم",
    "report.by_nationality": "حسب الجنسية",
    "report.export_csv": "تصدير CSV",
    "report.payroll_summary": "ملخص الرواتب الشهرية",
    
    // Directory
    "dir.title": "دليل الموظفين",
    "dir.search": "...ابحث عن موظف",
    "dir.org_chart": "الهيكل التنظيمي",
    
    // Iqama/Visa
    "visa.title": "الإقامة والتأشيرات",
    "visa.iqama": "إقامة",
    "visa.passport": "جواز سفر",
    "visa.work_visa": "تأشيرة عمل",
    "visa.medical": "تأمين طبي",
    "visa.expiring": "مستندات منتهية",
    "visa.valid": "ساري",
    "visa.expiring_soon": "ينتهي قريباً",
    "visa.expired": "منتهي",
    "visa.days_left": "يوم متبقي",
    
    // Exit/Offboarding
    "exit.title": "الخروج / إنهاء الخدمة",
    "exit.resignation": "استقالة",
    "exit.termination": "إنهاء خدمة",
    "exit.last_day": "آخر يوم عمل",
    "exit.clearance": "إخلاء الطرف",
    "exit.settlement": "المستحقات النهائية",
    "exit.eos": "مكافأة نهاية الخدمة",
    "exit.leave_encash": "رصيد الإجازات",
    "exit.pending_salary": "الراتب المعلق",
    "exit.total_settlement": "إجمالي المستحقات",
    "exit.it_assets": "أصول تقنية",
    "exit.access_cards": "بطاقات الدخول",
    "exit.finance": "إخلاء مالي",
    "exit.hr_docs": "مستندات الموارد",
    "exit.knowledge": "نقل المعرفة",
    "exit.manager_sign": "توقيع المدير",
    
    // Expenses
    "expense.title": "المصروفات",
    "expense.submit": "تقديم مصروف",
    "expense.category": "الفئة",
    "expense.description": "الوصف",
    "expense.receipt": "مرجع الإيصال",
    "expense.travel": "سفر",
    "expense.meals": "وجبات",
    "expense.office": "مستلزمات مكتبية",
    "expense.training": "تدريب",
    "expense.other": "أخرى",
    
    // Claims
    "claim.title": "المطالبات",
    "claim.submit": "تقديم مطالبة",
    "claim.medical": "طبي",
    "claim.education": "تعليمي",
    "claim.relocation": "نقل",
    
    // Payments
    "payment.title": "المدفوعات",
    "payment.salary": "راتب",
    "payment.reimbursement": "تعويض",
    "payment.bonus": "مكافأة",
    
    // GOSI
    "gosi.title": "التأمينات الاجتماعية",
    "gosi.employee_share": "حصة الموظف",
    "gosi.employer_share": "حصة صاحب العمل",
    "gosi.monthly": "شهري",
    "gosi.annual": "سنوي",
    
    // EOS
    "eos.title": "مكافأة نهاية الخدمة",
    "eos.gratuity": "المكافأة",
    "eos.years_service": "سنوات الخدمة",
    
    // Salary
    "salary.title": "تفاصيل الراتب",
    "salary.basic": "الراتب الأساسي",
    "salary.housing": "بدل سكن",
    "salary.transport": "بدل نقل",
    "salary.gross": "إجمالي الراتب",
    "salary.deductions": "الخصومات",
    "salary.net": "صافي الراتب",
    "salary.ytd": "منذ بداية السنة",
    "salary.pay_info": "معلومات الدفع",
    
    // Performance
    "perf.title": "تقييم الأداء",
    "perf.goals": "الأهداف",
    "perf.rating": "التقييم",
    "perf.strengths": "نقاط القوة",
    "perf.improvements": "مجالات التحسين",
    
    // Training
    "training.title": "التدريب والتطوير",
    "training.available": "الدورات المتاحة",
    "training.enrolled": "مسجل",
    "training.completed": "مكتمل",
    "training.enroll": "تسجيل",
    
    // Grievance
    "grievance.title": "الشكاوى",
    "grievance.file": "تقديم شكوى",
    "grievance.category": "الفئة",
    "grievance.severity": "الخطورة",
    "grievance.resolution": "الحل",
    
    // Interview
    "interview.title": "المقابلات الذكية",
    "interview.start": "بدء مقابلة",
    "interview.score": "الدرجة",
    "interview.feedback": "ملاحظات",
  },
};

export type Lang = "en" | "ar";

export function t(key: string, lang: Lang = "en"): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}

export function isRTL(lang: Lang): boolean {
  return lang === "ar";
}

export function getSavedLang(): Lang {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("taliq_lang") as Lang) || "en";
}

export function saveLang(lang: Lang): void {
  localStorage.setItem("taliq_lang", lang);
  document.documentElement.dir = isRTL(lang) ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}
