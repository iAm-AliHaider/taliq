"use client";

import { useState, useEffect, useCallback } from "react";
import { TaliqProvider } from "@/components/TaliqProvider";
import { VoiceAgent } from "@/components/VoiceAgent";
import { GenerativePanel } from "@/components/GenerativePanel";
import { LoginPage } from "@/components/LoginPage";
import { HelpPanel } from "@/components/HelpPanel";
import { fetchToken } from "@/lib/livekit-config";
import { Lang, t, getSavedLang, saveLang, isRTL } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface AuthEmployee {
  id: string;
  name: string;
  position: string;
  department: string;
  isManager: boolean;
  isAdmin?: boolean;
}

function AuroraBackground() {
  return (
    <div className="aurora-bg">
      <div className="aurora-blob" style={{ width: "700px", height: "700px", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)", top: "-15%", left: "-10%", animationDelay: "0s" }} />
      <div className="aurora-blob" style={{ width: "500px", height: "500px", background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)", bottom: "-10%", right: "-5%", animationDelay: "-7s" }} />
      <div className="aurora-blob" style={{ width: "400px", height: "400px", background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)", top: "50%", left: "40%", animationDelay: "-14s" }} />
      <div className="absolute inset-0 geo-grid" />
    </div>
  );
}

export default function Home() {
  const [employee, setEmployee] = useState<AuthEmployee | null>(null);
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [authChecked, setAuthChecked] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [showHelp, setShowHelp] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("taliq_employee");
      if (stored) setEmployee(JSON.parse(stored));
    } catch { /* ignore */ }
    setAuthChecked(true);
    const savedLang = getSavedLang();
    setLang(savedLang);
    if (isRTL(savedLang)) { document.documentElement.dir = "rtl"; document.documentElement.lang = "ar"; }
  }, []);

  useEffect(() => {
    if (!employee) return;
    async function getToken() {
      setIsLoading(true);
      setError("");
      try {
        const freshRoom = `taliq-${Date.now()}`;
        const identity = `${employee!.id}-${Date.now()}`;
        const resp = await fetchToken(freshRoom, identity, employee!.id, lang);
        setToken(resp.token);
      } catch {
        setError(t("loading.connecting", lang));
      } finally {
        setIsLoading(false);
      }
    }
    getToken();
  }, [employee, lang]);

  const handleLogin = (emp: AuthEmployee) => {
    localStorage.setItem("taliq_employee", JSON.stringify(emp));
    setEmployee(emp);
  };

  const handleLogout = () => {
    localStorage.removeItem("taliq_employee");
    setEmployee(null);
    setToken("");
  };

  const handleLangSwitch = (l: Lang) => {
    setLang(l);
    saveLang(l);
    document.documentElement.dir = isRTL(l) ? "rtl" : "ltr";
    document.documentElement.lang = l;
  };

  const handleHelpCommand = useCallback((prompt: string) => {
    setPendingCommand(prompt);
  }, []);

  // Clear pending command after it's consumed
  const consumeCommand = useCallback(() => {
    setPendingCommand(null);
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFBFC] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!employee) return <LoginPage onLogin={handleLogin} />;

  if (isLoading || !token) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFBFC] flex items-center justify-center relative overflow-hidden" dir={isRTL(lang) ? "rtl" : "ltr"}>
        <AuroraBackground />
        <div className="flex flex-col items-center gap-6 z-10">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-200 animate-breathe" />
            <div className="absolute inset-2 rounded-full border-2 border-emerald-300 animate-breathe" style={{ animationDelay: "-1s" }} />
            <div className="absolute inset-4 rounded-full border-2 border-emerald-400 animate-breathe" style={{ animationDelay: "-2s" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-emerald-600">ت</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm font-medium">{t("loading.welcome", lang)}, {employee.name.split(" ")[0]}</p>
            <p className="text-gray-400 text-xs mt-1">{t("loading.connecting", lang)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFBFC] flex items-center justify-center p-4 relative">
        <AuroraBackground />
        <div className="card flex flex-col items-center gap-4 p-8 max-w-sm w-full z-10">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 text-center text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium hover:bg-emerald-100 transition-all">
            {lang === "ar" ? "حاول مرة أخرى" : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFBFC] flex flex-col relative" dir={isRTL(lang) ? "rtl" : "ltr"}>
      <AuroraBackground />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 border-b border-gray-200/80 safe-top">
        <div className="px-5 flex items-center justify-between h-14" style={{ background: "rgba(250,251,252,0.85)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white text-base font-bold">ت</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white animate-pulse-ring" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">{t("app.name", lang)}</h1>
              <p className="text-[9px] text-gray-400 tracking-widest uppercase">{employee.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher lang={lang} onSwitch={handleLangSwitch} />

            {/* Help button */}
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all group"
              title="Voice Commands"
            >
              <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>

            {employee.isManager && (
              <span className="px-2 py-1 rounded-lg bg-violet-50 border border-violet-100 text-[10px] font-semibold text-violet-600">
                {t("header.manager", lang)}
              </span>
            )}

            {employee.isAdmin && (
              <a href="/admin" className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors">
                {t("header.admin", lang)}
              </a>
            )}

            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" title={t("header.logout", lang)}>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Help Panel */}
      {showHelp && (
        <HelpPanel
          isManager={employee.isManager}
          isAdmin={employee.isAdmin}
          onClose={() => setShowHelp(false)}
          onCommand={handleHelpCommand}
        />
      )}

      {/* Main */}
      <TaliqProvider token={token}>
        {(components, actions) => (
          <main className="relative z-10 flex-1 overflow-hidden bg-gray-50/50">
            <GenerativePanel components={components} actions={actions} />
            <VoiceAgent pendingCommand={pendingCommand} onCommandConsumed={consumeCommand} />
          </main>
        )}
      </TaliqProvider>
    </div>
  );
}
