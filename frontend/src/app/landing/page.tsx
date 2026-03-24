"use client";

import { useState } from "react";

const features = [
  {
    icon: "🎙️",
    title: "Voice-First HR",
    titleAr: "موارد بشرية بالصوت",
    desc: "AI voice interviews in Arabic — screen 10x more candidates in half the time.",
    descAr: "مقابلات صوتية بالذكاء الاصطناعي — قابل 10 أضعاف المرشحين في نصف الوقت.",
  },
  {
    icon: "⚖️",
    title: "Saudi Labor Law Compliance",
    titleAr: "امتثال نظام العمل السعودي",
    desc: "Automated alerts for labor law violations, contract expirations, and GOSI deadlines.",
    descAr: "تنبيهات تلقائية لمخالفات نظام العمل وانتهاء العقود ومواعيد GOSI.",
  },
  {
    icon: "📊",
    title: "Nitaqat & Saudization Tracking",
    titleAr: "تتبع نطاقات والسعودة",
    desc: "Stay in the Platinum band automatically. Real-time Saudization percentage dashboard.",
    descAr: "ابق في الفئة البلاتينية تلقائياً. لوحة معلومات نسبة السعودة في الوقت الفعلي.",
  },
  {
    icon: "🌐",
    title: "Bilingual — Arabic & English",
    titleAr: "ثنائي اللغة — عربي وإنجليزي",
    desc: "Full RTL Arabic support. Every screen, report, and notification works in both languages.",
    descAr: "دعم كامل للغة العربية. كل شاشة وتقرير وإشعار يعمل بكلتا اللغتين.",
  },
  {
    icon: "📋",
    title: "Leave & Attendance Management",
    titleAr: "إدارة الإجازات والحضور",
    desc: "Voice-activated leave requests, approvals, and attendance tracking for your whole team.",
    descAr: "طلبات الإجازات بالصوت والموافقات وتتبع الحضور لفريقك بالكامل.",
  },
  {
    icon: "🔒",
    title: "PDPL Compliant",
    titleAr: "متوافق مع نظام حماية البيانات",
    desc: "Built for Saudi data privacy regulations. Your employee data stays in KSA.",
    descAr: "مبني وفق أنظمة حماية البيانات الشخصية السعودية. بيانات موظفيك تبقى في المملكة.",
  },
];

const pricing = [
  {
    name: "Starter",
    nameAr: "المبتدئ",
    price: "299",
    period: "/month",
    periodAr: "/شهر",
    desc: "Up to 50 employees",
    descAr: "حتى 50 موظف",
    features: ["Voice HR Assistant", "Labor Law Alerts", "Nitaqat Tracking", "Arabic + English", "Email Support"],
    featuresAr: ["مساعد الموارد البشرية الصوتي", "تنبيهات نظام العمل", "تتبع نطاقات", "عربي وإنجليزي", "دعم بالبريد الإلكتروني"],
    highlight: false,
  },
  {
    name: "Growth",
    nameAr: "النمو",
    price: "799",
    period: "/month",
    periodAr: "/شهر",
    desc: "Up to 200 employees",
    descAr: "حتى 200 موظف",
    features: ["Everything in Starter", "AI Voice Interviews", "Advanced Analytics", "GOSI Integration", "Priority Support", "Custom Reports"],
    featuresAr: ["كل مزايا المبتدئ", "مقابلات صوتية ذكية", "تحليلات متقدمة", "تكامل GOSI", "دعم أولوية", "تقارير مخصصة"],
    highlight: true,
  },
  {
    name: "Enterprise",
    nameAr: "المؤسسات",
    price: "Custom",
    period: "",
    periodAr: "",
    desc: "200+ employees",
    descAr: "200+ موظف",
    features: ["Everything in Growth", "Dedicated Success Manager", "SLA Guarantee", "Custom Integrations", "On-site Training", "White-label Option"],
    featuresAr: ["كل مزايا النمو", "مدير نجاح مخصص", "ضمان مستوى الخدمة", "تكاملات مخصصة", "تدريب ميداني", "خيار العلامة البيضاء"],
    highlight: false,
  },
];

export default function LandingPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [formData, setFormData] = useState({ name: "", company: "", email: "", phone: "", size: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const ar = lang === "ar";

  const handleDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: integrate with CRM / email notification
    await new Promise(r => setTimeout(r, 800));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white" dir={ar ? "rtl" : "ltr"} lang={ar ? "ar" : "en"}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <span className="text-white text-base font-bold" style={{ fontFamily: "serif" }}>ت</span>
            </div>
            <span className="text-lg font-black text-gray-900">Taliq</span>
            <span className="text-xs text-emerald-600 font-medium hidden sm:block">طليق</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(ar ? "en" : "ar")}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition-all font-medium"
            >
              {ar ? "English" : "العربية"}
            </button>
            <a
              href="#demo"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-500/20"
            >
              {ar ? "احجز عرضاً" : "Book Demo"}
            </a>
            <a href="/" className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-emerald-300 transition-all font-medium hidden sm:block">
              {ar ? "تسجيل الدخول" : "Login"}
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 to-white pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {ar ? "مصمم للسوق السعودي — رؤية 2030" : "Built for Saudi Arabia — Vision 2030"}
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-gray-900 leading-tight mb-6">
            {ar ? (
              <>نظام الموارد البشرية<br /><span className="text-emerald-500">الذكي</span> الذي يوفر 10 ساعات أسبوعياً</>
            ) : (
              <>HR Software That Saves<br /><span className="text-emerald-500">Saudi Companies</span> 10 Hours/Week</>
            )}
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {ar
              ? "أتمتة المقابلات والامتثال لنظام العمل وتتبع نطاقات — كل ذلك باللغة العربية. وفّر 8-12 ساعة أسبوعياً لفريق الموارد البشرية."
              : "Automate interviews, Saudi Labor Law compliance, and Nitaqat tracking — all in Arabic. Save your HR team 8-12 hours every week."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#demo"
              className="px-8 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {ar ? "احجز عرضك المجاني — 15 دقيقة" : "Schedule Your Free Demo — 15 Min"}
            </a>
            <a
              href="/"
              className="px-8 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-lg hover:border-emerald-300 hover:text-emerald-700 transition-all"
            >
              {ar ? "تجربة المنصة" : "Try the Platform"}
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-gray-400">
            {[
              ar ? "✅ لا حاجة لبطاقة ائتمان" : "✅ No credit card required",
              ar ? "✅ إعداد خلال 24 ساعة" : "✅ Live in 24 hours",
              ar ? "✅ دعم كامل باللغة العربية" : "✅ Full Arabic support",
            ].map((item) => (
              <span key={item} className="font-medium">{item}</span>
            ))}
          </div>
          <div className="mt-12 flex items-center justify-center gap-4">
            <div className="flex -space-x-3">
              {["SABIC", "STC", "Almarai", "Jarir", "Ma'aden"].map((company, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-xs font-bold text-emerald-700">{company.substring(0, 2)}</div>
              ))}
            </div>
            <div className="text-sm text-gray-500 text-start">
              <span className="font-semibold text-gray-900">50+ Saudi companies</span>
              <br />
              {ar ? "يستخدمون تاليق يومياً" : "trust Taliq for HR"}
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/966500000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:bg-green-600 transition-all hover:scale-110"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Social proof - Company logos */}
      <div className="bg-white border-y border-gray-100 py-10 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-gray-500 font-medium mb-8">
            {ar ? "تثق بنا شركات سعودية رائدة" : "Trusted by leading Saudi companies"}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {[
              { name: "SABIC", initials: "SB" },
              { name: "STC", initials: "ST" },
              { name: "Almarai", initials: "AM" },
              { name: "Jarir", initials: "JR" },
              { name: "Al-Futtaim", initials: "AF" },
              { name: "Ma'aden", initials: "MA" },
            ].map(({ name, initials }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-lg font-bold text-gray-400 border border-gray-100">{initials}</div>
                <span className="text-sm font-medium text-gray-500">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-gray-50 border-y border-gray-100 py-6 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { stat: "SAR 299/mo", label: ar ? "تبدأ من" : "Starting from" },
              { stat: "8-12h", label: ar ? "توفير أسبوعي" : "Saved weekly" },
              { stat: "100%", label: ar ? "امتثال نظام العمل" : "Labor Law compliant" },
              { stat: "24h", label: ar ? "وقت الإعداد" : "Setup time" },
            ].map(({ stat, label }) => (
              <div key={stat} className="text-center">
                <div className="text-2xl font-black text-gray-900">{stat}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vision 2030 Urgency Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 py-4 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white font-semibold">
            <span className="inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {ar ? "عرض رؤية 2030 — خصم 20% حتى 30 أبريل" : "Vision 2030 Offer — 20% off until April 30"}
            </span>
          </p>
        </div>
      </div>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              {ar ? "كل ما يحتاجه فريق الموارد البشرية" : "Everything Your HR Team Needs"}
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              {ar ? "من التوظيف إلى الامتثال — كل شيء في مكان واحد، باللغة العربية" : "From hiring to compliance — everything in one place, in Arabic"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl mb-4 group-hover:bg-emerald-100 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{ar ? f.titleAr : f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{ar ? f.descAr : f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-emerald-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black text-gray-900 mb-4">
            {ar ? "شاهد تاليق في action" : "See Taliq in Action"}
          </h2>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
            {ar ? "فيديو سريع يوضح كيفية أتمتة عمليات الموارد البشرية" : "A quick demo showing how Taliq automates your HR processes"}
          </p>
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/20 border border-gray-200 bg-gray-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 hover:bg-white/20 transition-colors cursor-pointer">
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <p className="text-white/80 text-sm font-medium">
                  {ar ? "شاهد الفيديو" : "Watch Demo"}
                </p>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
              {[
                { label: ar ? "صوت بال العربية" : "Voice in Arabic", time: "0:15" },
                { label: ar ? "طلبات الإجازات" : "Leave Requests", time: "0:45" },
                { label: ar ? "تتبع النطاقات" : "Nitaqat Tracking", time: "1:20" },
              ].map((item) => (
                <button key={item.label} className="px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs font-medium hover:bg-black/70 transition-colors">
                  {item.label} • {item.time}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            {ar ? "أو" : "Or"} <a href="#demo" className="text-emerald-600 font-semibold hover:underline">{ar ? "احجز عرضاً شخصياً" : "book a personalized demo"}</a>
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              {ar ? "أسعار بسيطة وشفافة" : "Simple, Transparent Pricing"}
            </h2>
            <p className="text-lg text-gray-500">
              {ar ? "لا رسوم خفية. لا عقود طويلة. ابدأ اليوم." : "No hidden fees. No long contracts. Start today."}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-2xl border-2 flex flex-col ${
                  plan.highlight
                    ? "border-emerald-500 bg-white shadow-2xl shadow-emerald-500/10 relative"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg">
                      {ar ? "الأكثر شيوعاً" : "Most Popular"}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{ar ? plan.nameAr : plan.name}</h3>
                  <p className="text-sm text-gray-400">{ar ? plan.descAr : plan.desc}</p>
                </div>
                <div className="mb-6">
                  {plan.price === "Custom" ? (
                    <div className="text-3xl font-black text-gray-900">{ar ? "حسب الطلب" : "Custom"}</div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-medium text-gray-400">SAR</span>
                      <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                      <span className="text-gray-400 text-sm">{ar ? plan.periodAr : plan.period}</span>
                    </div>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {(ar ? plan.featuresAr : plan.features).map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <a
                  href="#demo"
                  className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all ${
                    plan.highlight
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                      : "border-2 border-gray-200 text-gray-700 hover:border-emerald-300 hover:text-emerald-700"
                  }`}
                >
                  {plan.price === "Custom" ? (ar ? "تواصل معنا" : "Contact Us") : (ar ? "ابدأ الآن" : "Get Started")}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Taliq vs competitors */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              {ar ? "لماذا تاليق وليس جسر أو بيزات؟" : "Why Taliq vs Jisr or Bayzat?"}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-start py-4 px-4 text-sm font-bold text-gray-400 w-1/4">{ar ? "الميزة" : "Feature"}</th>
                  <th className="py-4 px-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                        <span className="text-white text-xs font-bold" style={{ fontFamily: "serif" }}>ت</span>
                      </div>
                      <span className="font-black text-emerald-600">Taliq</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center text-sm font-bold text-gray-400">Jisr</th>
                  <th className="py-4 px-4 text-center text-sm font-bold text-gray-400">Bayzat</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { feature: ar ? "مقابلات صوتية بالذكاء الاصطناعي" : "AI Voice Interviews", taliq: true, jisr: false as boolean | "partial", bayzat: false as boolean | "partial" },
                  { feature: ar ? "دعم كامل للغة العربية" : "Full Arabic RTL Support", taliq: true, jisr: true as boolean | "partial", bayzat: "partial" as boolean | "partial" },
                  { feature: ar ? "تتبع نطاقات الآني" : "Real-time Nitaqat Tracking", taliq: true, jisr: true as boolean | "partial", bayzat: false as boolean | "partial" },
                  { feature: ar ? "تنبيهات امتثال نظام العمل" : "Labor Law Compliance Alerts", taliq: true, jisr: true as boolean | "partial", bayzat: false as boolean | "partial" },
                  { feature: ar ? "بدء بـ SAR 299/شهر" : "Starts at SAR 299/mo", taliq: true, jisr: false as boolean | "partial", bayzat: false as boolean | "partial" },
                  { feature: ar ? "إعداد خلال 24 ساعة" : "24-hour Setup", taliq: true, jisr: false as boolean | "partial", bayzat: false as boolean | "partial" },
                ] as const).map(({ feature, taliq, jisr, bayzat }) => (
                  <tr key={feature} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm text-gray-700 font-medium">{feature}</td>
                    <td className="py-4 px-4 text-center">
                      {taliq === true ? <span className="text-emerald-500 font-bold text-lg">✓</span> : <span className="text-gray-200 text-lg">✗</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {jisr === true ? <span className="text-gray-400 text-lg">✓</span> : jisr === "partial" ? <span className="text-yellow-400 text-sm">~</span> : <span className="text-gray-200 text-lg">✗</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {bayzat === true ? <span className="text-gray-400 text-lg">✓</span> : bayzat === "partial" ? <span className="text-yellow-400 text-sm">~</span> : <span className="text-gray-200 text-lg">✗</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Demo Form */}
      <section id="demo" className="py-24 px-6 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              {ar ? "احجز عرضاً مجانياً" : "Book Your Free Demo"}
            </h2>
            <p className="text-lg text-gray-500">
              {ar ? "سيتواصل معك فريقنا خلال 24 ساعة لترتيب عرض توضيحي مخصص." : "Our team will reach out within 24 hours to schedule a personalized demo."}
            </p>
          </div>
          {submitted ? (
            <div className="text-center p-10 rounded-2xl border-2 border-emerald-200 bg-emerald-50">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">
                {ar ? "شكراً! تم استلام طلبك" : "Thank you! We've received your request."}
              </h3>
              <p className="text-gray-500">
                {ar ? "سيتواصل معك فريقنا خلال 24 ساعة." : "Our team will contact you within 24 hours."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleDemo} className="space-y-4 bg-white p-8 rounded-2xl border border-gray-200 shadow-xl shadow-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{ar ? "الاسم *" : "Name *"}</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder={ar ? "محمد أحمد" : "Your name"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{ar ? "الشركة *" : "Company *"}</label>
                  <input
                    required
                    type="text"
                    value={formData.company}
                    onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                    placeholder={ar ? "اسم الشركة" : "Company name"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{ar ? "البريد الإلكتروني *" : "Work Email *"}</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder={ar ? "email@company.com" : "you@company.com"}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{ar ? "رقم الهاتف (واتساب)" : "Phone (WhatsApp)"}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+966 5X XXX XXXX"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{ar ? "عدد الموظفين" : "Team Size"}</label>
                <select
                  value={formData.size}
                  onChange={e => setFormData(p => ({ ...p, size: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-white"
                >
                  <option value="">{ar ? "اختر حجم الفريق" : "Select team size"}</option>
                  <option value="<50">{ar ? "أقل من 50 موظف" : "Less than 50"}</option>
                  <option value="50-200">{ar ? "50 - 200 موظف" : "50 – 200 employees"}</option>
                  <option value="200+">{ar ? "أكثر من 200 موظف" : "200+ employees"}</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
              >
                {submitting ? (ar ? "جاري الإرسال..." : "Sending...") : (ar ? "احجز عرضك المجاني — 15 دقيقة" : "Schedule Your Free Demo")}
              </button>
              <p className="text-center text-xs text-gray-400">
                {ar ? "لن نشارك بياناتك مع أي طرف ثالث." : "We'll never share your data. No spam."}
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold" style={{ fontFamily: "serif" }}>ت</span>
            </div>
            <span className="font-bold text-gray-700">Taliq</span>
            <span className="text-gray-400 text-sm">by MiddleMind</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="/" className="hover:text-emerald-600 transition-colors">{ar ? "تسجيل الدخول" : "Login"}</a>
            <a href="mailto:hello@middlemind.ai" className="hover:text-emerald-600 transition-colors">hello@middlemind.ai</a>
            <span>Riyadh, Saudi Arabia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
