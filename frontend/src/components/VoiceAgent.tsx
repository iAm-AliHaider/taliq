"use client";

import { useRoomContext, useConnectionState, useVoiceAssistant } from "@livekit/components-react";
import { ConnectionState, DataPacket_Kind } from "livekit-client";
import { useState, useEffect, useCallback } from "react";

interface Props {
  onQuickAction?: (text: string) => void;
}

export function VoiceAgent({ onQuickAction }: Props) {
  const room = useRoomContext();
  const connectionState = useConnectionState(room);
  const { state: agentState } = useVoiceAssistant();
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<Array<{ role: "user" | "agent"; text: string; ts: number }>>([]);

  const isConnected = connectionState === ConnectionState.Connected;
  const isListening = agentState === "listening";
  const isSpeaking = agentState === "speaking";
  const isThinking = agentState === "thinking";

  // Listen for transcription events
  useEffect(() => {
    if (!room) return;
    const handleTranscription = (segments: any[], participant: any) => {
      for (const seg of segments) {
        if (!seg.final || !seg.text?.trim()) continue;
        const isAgent = participant?.identity?.startsWith("agent") || participant?.identity === "taliq";
        setTranscript(prev => {
          const last = prev[prev.length - 1];
          // Merge consecutive same-role messages
          if (last && last.role === (isAgent ? "agent" : "user") && Date.now() - last.ts < 3000) {
            return [...prev.slice(0, -1), { ...last, text: last.text + " " + seg.text.trim(), ts: Date.now() }];
          }
          return [...prev, { role: isAgent ? "agent" : "user", text: seg.text.trim(), ts: Date.now() }];
        });
      }
    };
    room.on("transcriptionReceived", handleTranscription);
    return () => { room.off("transcriptionReceived", handleTranscription); };
  }, [room]);

  // Send text as simulated user speech via data channel
  const sendTextToAgent = useCallback(async (text: string) => {
    if (!room?.localParticipant) return;
    try {
      const payload = new TextEncoder().encode(JSON.stringify({ type: "user_text", text }));
      await room.localParticipant.publishData(payload, { topic: "lk-chat", reliable: true });
      setTranscript(prev => [...prev, { role: "user", text, ts: Date.now() }]);
    } catch (e) {
      console.error("Failed to send text:", e);
    }
  }, [room]);

  useEffect(() => {
    if (!isSpeaking && !isListening) { setAudioLevel(0); return; }
    const interval = setInterval(() => {
      setAudioLevel(isSpeaking ? 0.4 + Math.random() * 0.6 : 0.1 + Math.random() * 0.3);
    }, 100);
    return () => clearInterval(interval);
  }, [isSpeaking, isListening]);

  const ringScale = 1 + audioLevel * 0.3;
  const statusText = !isConnected ? "Connecting..." : isThinking ? "Thinking..." : isSpeaking ? "Speaking" : isListening ? "Listening..." : "Ready";
  const statusColor = isSpeaking ? "text-emerald-600" : isListening ? "text-amber-600" : isThinking ? "text-blue-600" : "text-gray-400";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Voice Orb */}
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full transition-transform duration-150" style={{ transform: `scale(${ringScale})`, background: isSpeaking ? "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)" : isListening ? "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)" : "transparent" }} />
        <div className={`absolute inset-2 rounded-full border-2 transition-colors duration-300 ${isSpeaking ? "border-emerald-300" : isListening ? "border-amber-200" : "border-gray-200"} animate-breathe`} />
        <div className={`absolute inset-5 rounded-full border-2 transition-colors duration-300 ${isSpeaking ? "border-emerald-400" : isListening ? "border-amber-300" : "border-gray-200"} animate-breathe`} style={{ animationDelay: "-1.3s" }} />
        <div className={`absolute inset-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
          isSpeaking ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/25" :
          isListening ? "bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/25" :
          isThinking ? "bg-gradient-to-br from-blue-400 to-blue-500 shadow-blue-500/25" :
          "bg-gradient-to-br from-gray-200 to-gray-300 shadow-gray-300/25"
        }`}>
          <span className="text-white text-xl font-bold select-none">ت</span>
        </div>
        {isSpeaking && <div className="absolute inset-5 rounded-full border-2 border-emerald-400/40 animate-ripple" />}
      </div>

      {/* Status */}
      <div className="text-center">
        <p className={`text-sm font-semibold ${statusColor} transition-colors`}>{statusText}</p>
        {isConnected && !isSpeaking && !isListening && !isThinking && (
          <p className="text-[10px] text-gray-400 mt-0.5">Tap a quick action or speak</p>
        )}
      </div>

      {/* Live Transcript */}
      {transcript.length > 0 && (
        <div className="w-full max-w-xs max-h-32 overflow-y-auto px-3 space-y-1.5 scrollbar-hide">
          {transcript.slice(-4).map((t, i) => (
            <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`px-3 py-1.5 rounded-2xl text-xs max-w-[85%] ${
                t.role === "user"
                  ? "bg-emerald-500 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-700 rounded-bl-sm"
              }`}>
                {t.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 px-4 w-full max-w-xs">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => {
              sendTextToAgent(action.prompt);
              onQuickAction?.(action.prompt);
            }}
            disabled={!isConnected}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-sm hover:shadow-emerald-500/5 transition-all duration-300 group disabled:opacity-40"
          >
            <span className="text-base group-hover:scale-110 transition-transform">{action.icon}</span>
            <span className="text-[9px] font-medium text-gray-500 group-hover:text-emerald-600 transition-colors leading-tight text-center">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "Leave Balance", icon: "🏖️", prompt: "Show me my leave balance" },
  { label: "My Profile", icon: "👤", prompt: "Show my profile" },
  { label: "Pay Slip", icon: "💰", prompt: "Show my pay slip" },
  { label: "Team Status", icon: "👥", prompt: "Show team attendance" },
  { label: "My Loans", icon: "🏦", prompt: "Show my loan balance" },
  { label: "Approvals", icon: "✅", prompt: "Show pending approvals" },
  { label: "Documents", icon: "📄", prompt: "Show my documents" },
  { label: "Announcements", icon: "📢", prompt: "Show announcements" },
  { label: "Travel", icon: "✈️", prompt: "Calculate travel allowance for Dubai 3 days" },
];
