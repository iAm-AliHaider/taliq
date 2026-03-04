"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { LiveKitRoom, RoomAudioRenderer, useConnectionState, useVoiceAssistant, useRoomContext } from "@livekit/components-react";
import { ConnectionState, RoomEvent } from "livekit-client";
import { getLiveKitUrl } from "@/lib/livekit-config";

interface VoiceInterviewProps {
  applicationRef: string;
  applicationId: number;
  candidateName: string;
  position: string;
  pin: string;
  onComplete: () => void;
}

/* ── Inner component (runs inside LiveKitRoom context) ───────── */
function InterviewSession({ candidateName, position, onComplete }: { candidateName: string; position: string; onComplete: () => void }) {
  const connState = useConnectionState();
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const [duration, setDuration] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [interviewResult, setInterviewResult] = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const room = useRoomContext();
  const connected = connState === ConnectionState.Connected;
  const agentSpeaking = agentState === "speaking";
  const userSpeaking = agentState === "listening";

  // Listen for data channel messages (UI cards from agent)
  useEffect(() => {
    if (!room) return;
    const handler = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === "ui_update") {
          const data = msg.data || {};
          if (msg.component === "InterviewQuestion") {
            setCurrentQuestion(data);
          } else if (msg.component === "InterviewComplete") {
            setInterviewResult(data);
            // Automatically disconnect after 10 seconds to allow final speech to finish
            setTimeout(() => {
              if (room.state === ConnectionState.Connected) {
                room.disconnect();
              }
            }, 10000);
          }
        }
      } catch {}
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => { room.off(RoomEvent.DataReceived, handler); };
  }, [room]);

  useEffect(() => {
    if (connected) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [connected]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (interviewResult) {
    return (
      <div className="py-2 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-opacity-10 rotate-3 ${interviewResult.passed ? "bg-emerald-500 shadow-emerald-200" : "bg-amber-500 shadow-amber-200"}`}>
            {interviewResult.passed ? (
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01" /></svg>
            )}
          </div>
          <h4 className="text-2xl font-black text-slate-900 leading-tight">Interview Complete</h4>
          <p className="text-sm text-slate-500 font-medium">Results for {interviewResult.candidateName}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Final Score</p>
            <p className={`text-3xl font-black ${interviewResult.passed ? "text-emerald-600" : "text-amber-600"}`}>{interviewResult.score}%</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Recommendation</p>
            <p className={`text-sm font-bold mt-2 ${interviewResult.passed ? "text-emerald-700" : "text-amber-700"}`}>{interviewResult.passed ? "PROCEED" : "HOLD"}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Performance Breakdown</p>
          {(interviewResult.breakdown || []).map((b: any, i: number) => (
            <div key={i} className="flex items-center justify-between group">
              <div className="flex-1 pr-4">
                <p className="text-xs font-bold text-slate-700 truncate">{b.question}</p>
                <p className="text-[9px] text-slate-400">{b.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${b.score >= 8 ? "bg-emerald-400" : b.score >= 6 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${b.score * 10}%` }} />
                </div>
                <span className="text-[10px] font-black text-slate-600 w-4">{b.score}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-[10px] text-slate-400 mb-4 italic">Call disconnected. Your responses have been saved.</p>
          <button onClick={onComplete} className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-[0.98]">
            Finish & Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voice visualization */}
      <div className="flex items-center justify-center gap-6 py-6">
        {/* AI avatar */}
        <div className="relative">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg transition-all ${agentSpeaking ? "ring-4 ring-amber-200 scale-105" : ""}`}>
            <span className="text-2xl font-black text-white" style={{ fontFamily: "serif" }}>&#1591;</span>
          </div>
          {agentSpeaking && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              {[0.3, 0.6, 1, 0.6, 0.3].map((h, i) => (
                <div key={i} className="w-1 bg-amber-400 rounded-full animate-pulse" style={{ height: `${h * 12}px`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" />
        </div>

        {/* Waves */}
        <div className="flex items-center gap-1 h-16">
          {[0.2, 0.4, 0.6, 0.9, 1, 0.9, 0.6, 0.4, 0.2].map((h, i) => (
            <div key={i}
              className={`w-1.5 rounded-full transition-all duration-300 ${agentSpeaking ? "bg-amber-400 animate-pulse" : userSpeaking ? "bg-blue-400 animate-pulse" : "bg-slate-200"}`}
              style={{ height: `${h * 48}px`, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>

        {/* User avatar */}
        <div className="relative">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg transition-all ${userSpeaking ? "ring-4 ring-blue-200 scale-105" : ""}`}>
            <span className="text-xl font-bold text-white">{candidateName.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
          </div>
        </div>
      </div>

      {/* Question display */}
      {currentQuestion && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Q{currentQuestion.questionNumber}/{currentQuestion.totalQuestions}</span>
            <span className="text-xs text-amber-600 font-medium">{currentQuestion.category}</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-1.5 mb-2">
            <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${currentQuestion.progress}%` }} />
          </div>
          <p className="text-sm font-medium text-amber-800">{currentQuestion.question}</p>
        </div>
      )}

      {!currentQuestion && connected && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-sm text-emerald-700 font-medium">Taliq is preparing your interview...</p>
          <p className="text-xs text-emerald-500 mt-1">Listen carefully and speak when ready</p>
        </div>
      )}

      {!connected && (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-xs text-slate-400">Connecting...</p>
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`} />
          <span>{connected ? (agentSpeaking ? "Taliq speaking..." : userSpeaking ? "Listening to you..." : "Ready") : "Connecting..."}</span>
        </div>
        <span className="font-mono">{fmt(duration)}</span>
      </div>

      <button onClick={onComplete}
        className="w-full py-2 rounded-xl border border-red-200 text-red-500 text-xs hover:bg-red-50 transition">
        End Interview Early
      </button>
    </div>
  );
}

/* ── Outer component (fetches token, wraps LiveKitRoom) ──────── */
export default function VoiceInterview({ applicationRef, applicationId, candidateName, position, pin, onComplete }: VoiceInterviewProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const roomName = `interview-${applicationRef}-${Date.now()}`;
        const res = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName, participantName: candidateName, mode: "interview", applicationRef, applicationId: String(applicationId), candidateName, position }),
        }).then(r => r.json());
        if (res.error) { setError(res.error); return; }
        setToken(res.token);
      } catch (e: any) {
        setError(e.message || "Failed to connect");
      }
    })();
  }, [applicationRef, applicationId, candidateName, position]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Voice Interview</h3>
            <p className="text-amber-100 text-xs">{position} &middot; AI-Powered by Taliq</p>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            <span className="text-xs font-semibold text-amber-100">LIVE</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-red-600 font-semibold">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">Retry</button>
          </div>
        )}

        {!error && !token && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-slate-600">Connecting to your AI interviewer...</p>
            <p className="text-xs text-slate-400 mt-1">Please allow microphone access when prompted</p>
          </div>
        )}

        {!error && token && (
          <LiveKitRoom token={token} serverUrl={getLiveKitUrl()} connect={true} audio={true}>
            <RoomAudioRenderer />
            <InterviewSession candidateName={candidateName} position={position} onComplete={onComplete} />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}
