"use client";

import { useState, useEffect, useCallback } from "react";
import { TaliqProvider } from "@/components/TaliqProvider";
import { VoiceAgent } from "@/components/VoiceAgent";
import { GenerativePanel } from "@/components/GenerativePanel";
import { fetchToken } from "@/lib/livekit-config";

function AuroraBackground() {
  return (
    <div className="aurora-bg">
      {/* Emerald blob */}
      <div
        className="aurora-blob"
        style={{
          width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
          top: "-10%", left: "-10%",
          animationDelay: "0s",
        }}
      />
      {/* Gold blob */}
      <div
        className="aurora-blob"
        style={{
          width: "500px", height: "500px",
          background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
          bottom: "-5%", right: "-10%",
          animationDelay: "-7s",
        }}
      />
      {/* Subtle blue */}
      <div
        className="aurora-blob"
        style={{
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          top: "40%", left: "30%",
          animationDelay: "-14s",
        }}
      />
      {/* Grid overlay */}
      <div className="absolute inset-0 geo-grid" />
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-emerald-400/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${100 + Math.random() * 20}%`,
            animation: `drift ${15 + Math.random() * 25}s linear infinite`,
            animationDelay: `${Math.random() * 20}s`,
          }}
        />
      ))}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 17) return "مساء النور";
  return "مساء الخير";
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
      <div className="min-h-[100dvh] bg-[#050A12] flex items-center justify-center relative overflow-hidden">
        <AuroraBackground />
        <div className="flex flex-col items-center gap-6 z-10">
          {/* Breathing ring loader */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-breathe" />
            <div className="absolute inset-2 rounded-full border border-emerald-500/30 animate-breathe" style={{ animationDelay: "-1s" }} />
            <div className="absolute inset-4 rounded-full border border-emerald-500/40 animate-breathe" style={{ animationDelay: "-2s" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-emerald-400">ت</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-zinc-400 text-sm">Connecting to Taliq</p>
            <p className="text-zinc-600 text-xs mt-1 font-arabic rtl">{getGreeting()}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#050A12] flex items-center justify-center p-4 relative">
        <AuroraBackground />
        <div className="glass-card flex flex-col items-center gap-4 p-8 rounded-3xl max-w-sm w-full z-10">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-red-400 text-center text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 hover:bg-emerald-500/20 transition-all">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050A12] flex flex-col relative">
      <AuroraBackground />
      <FloatingParticles />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 border-b border-white/[0.06] safe-top">
        <div className="px-5 flex items-center justify-between h-16" style={{ background: "linear-gradient(180deg, rgba(5,10,18,0.9) 0%, rgba(5,10,18,0.7) 100%)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white text-sm font-bold">ت</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#050A12]" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-400 bg-clip-text text-transparent">
                Taliq
              </h1>
              <p className="text-[9px] text-zinc-600 -mt-0.5">Voice-First HR</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-600 font-arabic rtl hidden sm:block">تَلِيق</span>
            <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <span className="text-[10px]">🏢</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <TaliqProvider token={token}>
        {(components, setComponents) => (
          <main className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Voice Panel */}
            <div className="flex-shrink-0 md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-white/[0.06]">
              <div className="flex flex-col items-center justify-center py-8 md:py-0 md:h-full relative">
                <VoiceAgent />
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-6 px-6 justify-center max-w-xs">
                  {["Leave Balance", "My Profile", "Pay Slip", "Team Status"].map((action) => (
                    <button key={action} className="px-3 py-1.5 rounded-full text-[10px] text-zinc-500 bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/30 hover:text-emerald-400 transition-all duration-300">
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* HR Panel */}
            <div className="flex-1 overflow-hidden">
              <GenerativePanel
                components={components}
                onClear={() => setComponents([])}
              />
            </div>
          </main>
        )}
      </TaliqProvider>
    </div>
  );
}
