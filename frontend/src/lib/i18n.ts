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
