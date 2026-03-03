"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface VoiceInterviewProps {
  applicationRef: string;
  applicationId: number;
  candidateName: string;
  position: string;
  pin: string;
  onComplete: () => void;
}

export default function VoiceInterview({ applicationRef, applicationId, candidateName, position, pin, onComplete }: VoiceInterviewProps) {
  const [status, setStatus] = useState<"connecting" | "connected" | "interviewing" | "complete" | "error">("connecting");
  const [error, setError] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Simple timer
  useEffect(() => {
    if (status === "interviewing") {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  // Connect to LiveKit via token API
  const startInterview = useCallback(async () => {
    try {
      setStatus("connecting");
      
      // Get token for interview room
      const roomName = `interview-${applicationRef}-${Date.now()}`;
      const tokenRes = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName,
          participantName: candidateName,
          mode: "interview",
          applicationRef,
          applicationId: String(applicationId),
          candidateName,
          position,
        }),
      }).then(r => r.json());

      if (tokenRes.error) {
        setError(tokenRes.error);
        setStatus("error");
        return;
      }

      // Also tell our candidate API that the interview started
      await fetch("/api/candidate?action=start_interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_ref: applicationRef, pin }),
      });

      setStatus("connected");
      
      // Simple audio-only connection would need LiveKit client SDK
      // For now, we'll show that the voice interview is ready and provide instructions
      setStatus("interviewing");
      
      // Store the connection info for the voice widget
      sessionStorage.setItem("interview_token", tokenRes.token);
      sessionStorage.setItem("interview_server", tokenRes.serverUrl);
      sessionStorage.setItem("interview_room", roomName);

    } catch (e: any) {
      setError(e.message || "Connection failed");
      setStatus("error");
    }
  }, [applicationRef, applicationId, candidateName, position, pin]);

  useEffect(() => {
    startInterview();
  }, [startInterview]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Voice Interview</h3>
            <p className="text-amber-100 text-xs">{position} &middot; AI-Powered by Taliq</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold">{formatTime(duration)}</div>
            <div className={`text-xs ${status === "interviewing" ? "text-emerald-200" : "text-amber-200"}`}>
              {status === "connecting" ? "Connecting..." : status === "interviewing" ? "In Progress" : status === "complete" ? "Complete" : status === "error" ? "Error" : "Connected"}
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="p-5 space-y-4">
        {status === "connecting" && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-slate-600">Connecting to your AI interviewer...</p>
            <p className="text-xs text-slate-400 mt-1">Please allow microphone access when prompted</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="text-sm text-red-600 font-semibold">{error || "Connection failed"}</p>
            <button onClick={startInterview} className="mt-3 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">
              Retry
            </button>
          </div>
        )}

        {(status === "connected" || status === "interviewing") && (
          <div className="space-y-4">
            {/* Voice visualization */}
            <div className="flex items-center justify-center gap-4 py-6">
              {/* AI avatar */}
              <div className="relative">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg `}>
                  <span className="text-2xl font-black text-white" style={{fontFamily:"serif"}}>ط</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>

              {/* Audio waves */}
              <div className="flex items-center gap-1 h-12">
                {[0.3,0.5,0.8,1,0.8,0.5,0.3].map((h, i) => (
                  <div key={i} className={`w-1.5 bg-amber-400 rounded-full transition-all ${status === "interviewing" ? "animate-pulse" : ""}`}
                    style={{ height: `${h * 48}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>

              {/* User avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-xl font-bold text-white">{candidateName.split(" ").map(n => n[0]).join("").slice(0,2)}</span>
                </div>
              </div>
            </div>

            {/* Question display */}
            {currentQuestion && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Q{currentQuestion.questionNumber}</span>
                  <span className="text-xs text-amber-600 font-medium">{currentQuestion.category}</span>
                  <div className="flex-1" />
                  <span className="text-xs text-amber-400">{currentQuestion.progress}%</span>
                </div>
                <p className="text-sm font-medium text-amber-800">{currentQuestion.question}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase">How the Voice Interview Works</h4>
              <ul className="text-xs text-slate-600 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold mt-0.5">1.</span>
                  <span>The AI interviewer (Taliq) will ask you questions one at a time via voice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold mt-0.5">2.</span>
                  <span>Speak your answers clearly — take your time, be specific</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold mt-0.5">3.</span>
                  <span>After all questions, Taliq will complete the interview and you&apos;ll see your results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold mt-0.5">4.</span>
                  <span>If you pass (60%+), you&apos;ll advance to the offer stage</span>
                </li>
              </ul>
            </div>

            {/* LiveKit connection info */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-700 font-medium">
                Voice interview room is ready. Open the Taliq voice widget to begin speaking with your AI interviewer.
              </p>
              <p className="text-[10px] text-emerald-500 mt-1">Room: {sessionStorage.getItem("interview_room") || "connecting..."}</p>
            </div>

            {/* End interview */}
            <button onClick={() => { setStatus("complete"); onComplete(); }}
              className="w-full py-2 rounded-xl border border-slate-200 text-slate-500 text-xs hover:bg-slate-50 transition">
              End Interview & Return
            </button>
          </div>
        )}

        {status === "complete" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
            </div>
            <h4 className="font-bold text-slate-800 text-lg">Interview Complete!</h4>
            <p className="text-sm text-slate-500 mt-1">Your responses have been recorded and scored. Results will appear shortly.</p>
            <button onClick={onComplete} className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition">
              Back to Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
