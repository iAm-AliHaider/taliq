"use client";

import { useState, useEffect } from "react";
import { TaliqProvider } from "@/components/TaliqProvider";
import { VoiceAgent } from "@/components/VoiceAgent";
import { GenerativePanel } from "@/components/GenerativePanel";
import { fetchToken } from "@/lib/livekit-config";

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
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [roomName] = useState(() => `taliq-${Date.now()}`);

  useEffect(() => {
    async function getToken() {
      try {
        const identity = `emp-${Date.now()}`;
        const { token: t } = await fetchToken(roomName, identity);
        setToken(t);
      } catch {
        setError("Failed to connect to Taliq");
      } finally {
        setIsLoading(false);
      }
    }
    getToken();
  }, [roomName]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFBFC] flex items-center justify-center relative overflow-hidden">
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
          <p className="text-gray-500 text-sm font-medium">Connecting to Taliq...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFBFC] flex items-center justify-center p-4 relative">
        <AuroraBackground />
        <div className="card flex flex-col items-center gap-4 p-8 max-w-sm w-full z-10">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center"><span className="text-2xl">⚠️</span></div>
          <p className="text-red-600 text-center text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium hover:bg-emerald-100 transition-all">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFBFC] flex flex-col relative">
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
              <h1 className="text-base font-bold text-gray-900 leading-tight">Taliq</h1>
              <p className="text-[9px] text-gray-400 tracking-widest uppercase">Voice-First HR</p>
            </div>
          </div>
          <span className="text-xs text-gray-400 font-arabic rtl">تَلِيق</span>
        </div>
      </header>

      {/* Full-screen card area */}
      <TaliqProvider token={token}>
        {(components, actions) => (
          <main className="relative z-10 flex-1 overflow-hidden bg-gray-50/50">
            <GenerativePanel components={components} actions={actions} />
            {/* Floating voice agent */}
            <VoiceAgent />
          </main>
        )}
      </TaliqProvider>
    </div>
  );
}
