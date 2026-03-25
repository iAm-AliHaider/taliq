"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const plans = {
  starter: {
    name: "Starter",
    nameAr: "المبتدئ",
    price: 299,
    desc: "Up to 50 employees",
    descAr: "حتى 50 موظف",
    features: ["Voice HR Assistant", "Labor Law Alerts", "Nitaqat Tracking", "Arabic + English", "Email Support"],
    featuresAr: ["مساعد الموارد البشرية الصوتي", "تنبيهات نظام العمل", "تتبع نطاقات", "عربي وإنجليزي", "دعم بالبريد الإلكتروني"],
  },
  growth: {
    name: "Growth",
    nameAr: "النمو",
    price: 799,
    desc: "Up to 200 employees",
    descAr: "حتى 200 موظف",
    features: ["Everything in Starter", "AI Voice Interviews", "Advanced Analytics", "GOSI Integration", "Priority Support", "Custom Reports"],
    featuresAr: ["كل مزايا المبتدئ", "مقابلات صوتية ذكية", "تحليلات متقدمة", "تكامل GOSI", "دعم أولوية", "تقارير مخصصة"],
  },
};

type PlanKey = keyof typeof plans;

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("growth");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState("");
  const [moyasarLoaded, setMoyasarLoaded] = useState(false);
  const ar = lang === "ar";

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan && (plan === "starter" || plan === "growth")) {
      setSelectedPlan(plan);
    }
  }, [searchParams]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.moyasar.com/moyasar.js";
    script.async = true;
    script.onload = () => setMoyasarLoaded(true);
    document.body.appendChild(script);

    const styles = document.createElement("link");
    styles.rel = "stylesheet";
    styles.href = "https://cdn.moyasar.com/moyasar.css";
    document.head.appendChild(styles);

    return () => {
      document.body.removeChild(script);
      document.head.removeChild(styles);
    };
  }, []);

  const handleCreatePayment = async () => {
    if (!email || !companyName) {
      setError(ar ? "يرجى ملء جميع الحقول" : "Please fill in all fields");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          email,
          companyName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      setPaymentSessionId(data.sessionId);
    } catch (e: any) {
      setError(e.message);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (paymentSessionId && moyasarLoaded && typeof window !== "undefined" && (window as any).Moyasar) {
      const ms = (window as any).Moyasar;
      ms.init({
        element: "#moyasar-payment-form",
        amount: plans[selectedPlan].price * 100,
        currency: "SAR",
        description: `${plans[selectedPlan].name} Plan - ${plans[selectedPlan].desc}`,
        publishable_api_key: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY || "pk_test_",
        callback_url: `${window.location.origin}/api/checkout/callback`,
        redirect_url: `${window.location.origin}/checkout?success=true&plan=${selectedPlan}`,
        methods: ["creditcard"],
        metadata: {
          plan: selectedPlan,
          email,
          companyName,
        },
      });
    }
  }, [paymentSessionId, moyasarLoaded, selectedPlan, email, companyName]);

  if (success || searchParams.get("success") === "true") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">
            {ar ? "تم الدفع بنجاح!" : "Payment Successful!"}
          </h1>
          <p className="text-gray-500 mb-8">
            {ar
              ? `شكراً لاشتراكك في Taliq ${plans[selectedPlan as PlanKey]?.nameAr || selectedPlan}! سيصلك بريد إلكتروني بتفاصيل الدخول قريباً.`
              : `Thank you for subscribing to Taliq ${plans[selectedPlan as PlanKey]?.name || selectedPlan}! You'll receive a welcome email with your login details shortly.`}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all"
          >
            {ar ? "الذهاب إلى لوحة التحكم" : "Go to Dashboard"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={ar ? "rtl" : "ltr"}>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <span className="text-white text-base font-bold" style={{ fontFamily: "serif" }}>ت</span>
            </div>
            <span className="text-lg font-black text-gray-900">Taliq</span>
          </div>
          <button
            onClick={() => setLang(ar ? "en" : "ar")}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition-all font-medium"
          >
            {ar ? "English" : "العربية"}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            {ar ? "أكمل طلبك" : "Complete Your Order"}
          </h1>
          <p className="text-lg text-gray-500">
            {ar ? "ادخل بياناتك لبدء استخدام Taliq" : "Enter your details to get started with Taliq"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {ar ? "معلومات الفوترة" : "Billing Information"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {ar ? "البريد الإلكتروني *" : "Email *"}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={ar ? "email@company.com" : "you@company.com"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                    disabled={!!paymentSessionId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {ar ? "اسم الشركة *" : "Company Name *"}
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={ar ? "اسم شركتك" : "Your company name"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                    disabled={!!paymentSessionId}
                  />
                </div>
              </div>

              {!paymentSessionId ? (
                <button
                  onClick={handleCreatePayment}
                  disabled={isProcessing || !email || !companyName}
                  className="w-full mt-6 py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isProcessing
                    ? ar
                      ? "جاري المعالجة..."
                      : "Processing..."
                    : ar
                    ? "المتابعة للدفع"
                    : "Continue to Payment"}
                </button>
              ) : (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {ar ? "بيانات البطاقة" : "Card Details"}
                  </h3>
                  <div id="moyasar-payment-form" />
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>{ar ? "دفع آمن" : "Secure payment"}</span>
              </div>
              <span>•</span>
              <span>{ar ? "تدعم Visa و Mastercard" : "Visa & Mastercard supported"}</span>
              <span>•</span>
              <span>{ar ? "مشغل بواسطة Moyasar" : "Powered by Moyasar"}</span>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {ar ? "ملخص الطلب" : "Order Summary"}
              </h3>

              <div className="space-y-4">
                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    onClick={() => !paymentSessionId && setSelectedPlan(key as PlanKey)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPlan === key
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-100 hover:border-gray-200"
                    } ${paymentSessionId ? "cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">{ar ? plan.nameAr : plan.name}</span>
                      <span className="text-lg font-black text-emerald-600">SAR {plan.price}</span>
                    </div>
                    <p className="text-sm text-gray-500">{ar ? plan.descAr : plan.desc}</p>
                    {selectedPlan === key && (
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <ul className="space-y-1.5">
                          {(ar ? plan.featuresAr : plan.features).slice(0, 4).map((feat) => (
                            <li key={feat} className="flex items-center gap-2 text-xs text-gray-600">
                              <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              {feat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">{ar ? "المجموع الفرعي" : "Subtotal"}</span>
                  <span className="font-semibold text-gray-900">SAR {plans[selectedPlan].price}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500">{ar ? "الضريبة (15% VAT)" : "VAT (15%)"}</span>
                  <span className="font-semibold text-gray-900">SAR {Math.round(plans[selectedPlan].price * 0.15)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-900">{ar ? "المجموع" : "Total"}</span>
                  <span className="text-xl font-black text-emerald-600">
                    SAR {Math.round(plans[selectedPlan].price * 1.15)}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-sm text-amber-800">
                  {ar ? "🌟 عرض رؤية 2030: خصم 20% حتى 30 أبريل" : "🌟 Vision 2030 Offer: 20% off until April 30"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
