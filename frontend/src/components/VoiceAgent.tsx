"use client";

import { useRoomContext, useConnectionState, useVoiceAssistant } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { useState, useEffect } from "react";

export function VoiceAgent() {
  const room = useRoomContext();
  const connectionState = useConnectionState(room);
  const { state: agentState } = useVoiceAssistant();
  const [audioLevel, setAudioLevel] = useState(0);

  const isConnected = connectionState === ConnectionState.Connected;
  const isListening = agentState === "listening";
  const isSpeaking = agentState === "speaking";
  const isThinking = agentState === "thinking";

  useEffect(() => {
    if (!isSpeaking && !isListening) {
      setAudioLevel(0);
      return;
    }
    const interval = setInterval(() => {
      setAudioLevel(isSpeaking ? 0.4 + Math.random() * 0.6 : 0.1 + Math.random() * 0.3);
    }, 100);
    return () => clearInterval(interval);
  }, [isSpeaking, isListening]);

  const ringScale = 1 + audioLevel * 0.3;
  const statusText = !isConnected ? "Connecting..." : isThinking ? "Thinking..." : isSpeaking ? "Speaking" : isListening ? "Listening..." : "Ready";
  const statusColor = isSpeaking ? "text-emerald-600" : isListening ? "text-amber-600" : isThinking ? "text-blue-600" : "text-gray-400";

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Voice Orb */}
      <div className="relative w-32 h-32">
        {/* Outer reactive ring */}
        <div className="absolute inset-0 rounded-full transition-transform duration-150" style={{ transform: `scale(${ringScale})`, background: isSpeaking ? "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)" : isListening ? "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)" : "transparent" }} />
        
        {/* Breathing rings */}
        <div className={`absolute inset-2 rounded-full border-2 transition-colors duration-300 ${isSpeaking ? "border-emerald-300" : isListening ? "border-amber-200" : "border-gray-200"} animate-breathe`} />
        <div className={`absolute inset-5 rounded-full border-2 transition-colors duration-300 ${isSpeaking ? "border-emerald-400" : isListening ? "border-amber-300" : "border-gray-200"} animate-breathe`} style={{ animationDelay: "-1.3s" }} />
        
        {/* Core */}
        <div className={`absolute inset-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
          isSpeaking ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/25" :
          isListening ? "bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/25" :
          isThinking ? "bg-gradient-to-br from-blue-400 to-blue-500 shadow-blue-500/25" :
          "bg-gradient-to-br from-gray-200 to-gray-300 shadow-gray-300/25"
        }`}>
          <span className="text-white text-2xl font-bold select-none">ت</span>
        </div>

        {/* Pulse ring when speaking */}
        {isSpeaking && (
          <div className="absolute inset-6 rounded-full border-2 border-emerald-400/40 animate-ripple" />
        )}
      </div>

      {/* Status */}
      <div className="text-center">
        <p className={`text-sm font-semibold ${statusColor} transition-colors`}>{statusText}</p>
        {isConnected && (
          <p className="text-[10px] text-gray-400 mt-1">Say &quot;Marhaba&quot; to begin</p>
        )}
      </div>
    </div>
  );
}
