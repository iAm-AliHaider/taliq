"use client";

import { useState, useEffect, useCallback } from "react";
import { TaliqProvider } from "@/components/TaliqProvider";
import { VoiceAgent } from "@/components/VoiceAgent";
import { GenerativePanel } from "@/components/GenerativePanel";
import { fetchToken } from "@/lib/livekit-config";

export default function Home() {
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [roomName] = useState(() => `taliq-${Date.now()}`);

  useEffect(() => {
    async function getToken() {
      try {
        const identity = `emp-${Date.now()}`;
        const { token: newToken } = await fetchToken(roomName, identity);
        setToken(newToken);
      } catch (err) {
        console.error("Token error:", err);
        setError("Failed to connect to Taliq");
      } finally {
        setIsLoading(false);
      }
    }
    getToken();
  }, [roomName]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0F1A] flex items-center justify-center geometric-pattern">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Connecting to Taliq...</p>
          <p className="text-zinc-600 text-xs font-arabic">...جاري الاتصال</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0F1A] flex items-center justify-center p-4 geometric-pattern">
        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-red-500/10 border border-red-500/30 max-w-sm w-full">
          <span className="text-3xl">⚠️</span>
          <p className="text-red-400 text-center text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-white/10 text-sm text-white hover:bg-white/20 transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0A0F1A] flex flex-col geometric-pattern">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl safe-top">
        <div className="px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">ت</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent leading-tight">
                Taliq
              </h1>
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 font-arabic">تَلِيق — صوت الموارد البشرية</span>
        </div>
      </header>

      {/* Main */}
      <TaliqProvider token={token}>
        {(components, setComponents) => (
          <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Voice */}
            <div className="flex-shrink-0 md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]">
              <div className="flex flex-col items-center justify-center py-6 md:py-0 md:h-full">
                <VoiceAgent />
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
