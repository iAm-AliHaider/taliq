"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrackPublication,
  RemoteParticipant,
  ConnectionState,
  DataPacket_Kind,
} from "livekit-client";

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
  const [interviewResult, setInterviewResult] = useState<any>(null);
  const [duration, setDuration] = useState(0);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Timer
  useEffect(() => {
    if (status === "interviewing" || status === "connected") {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Connect to LiveKit
  const startInterview = useCallback(async () => {
    try {
      setStatus("connecting");

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

      // Create and connect room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      roomRef.current = room;

      // Handle agent audio
      room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          el.id = "agent-audio";
          document.body.appendChild(el);
          setAgentSpeaking(true);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          track.detach().forEach(el => el.remove());
          setAgentSpeaking(false);
        }
      });

      // Handle agent speaking state
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const agentIsSpeaking = speakers.some(s => s.isAgent);
        setAgentSpeaking(agentIsSpeaking);
        const userIsSpeaking = speakers.some(s => !s.isAgent);
        setMicActive(userIsSpeaking);
      });

      // Handle data messages (UI cards from agent)
      room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload));
          if (msg.type === "ui_update") {
            const data = msg.data || {};
            if (msg.component === "InterviewQuestion") {
              setCurrentQuestion(data);
            } else if (msg.component === "InterviewComplete") {
              setInterviewResult(data);
              setStatus("complete");
            }
          }
        } catch {}
      });

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        if (state === ConnectionState.Connected) {
          setStatus("interviewing");
        } else if (state === ConnectionState.Disconnected) {
          if (status !== "complete") setStatus("complete");
        }
      });

      // Connect with mic enabled
      await room.connect(tokenRes.serverUrl, tokenRes.token);
      await room.localParticipant.setMicrophoneEnabled(true);
      setStatus("interviewing");

    } catch (e: any) {
      setError(e.message || "Connection failed");
      setStatus("error");
    }
  }, [applicationRef, applicationId, candidateName, position, status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      document.querySelectorAll("#agent-audio").forEach(el => el.remove());
    };
  }, []);

  useEffect(() => {
    startInterview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endInterview = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setStatus("complete");
  };

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
              {status === "connecting" ? "Connecting..." : status === "interviewing" ? "In Progress" : status === "complete" ? "Complete" : "Error"}
            </div>
          </div>
        </div>
      </div>

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
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm text-red-600 font-semibold">{error}</p>
            <button onClick={() => { setError(""); startInterview(); }} className="mt-3 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">
              Retry
            </button>
          </div>
        )}

        {status === "interviewing" && (
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

              {/* Center waves */}
              <div className="flex items-center gap-1 h-16">
                {[0.2, 0.4, 0.6, 0.9, 1, 0.9, 0.6, 0.4, 0.2].map((h, i) => (
                  <div key={i}
                    className={`w-1.5 rounded-full transition-all duration-300 ${agentSpeaking ? "bg-amber-400 animate-pulse" : micActive ? "bg-blue-400 animate-pulse" : "bg-slate-200"}`}
                    style={{ height: `${h * 48}px`, animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>

              {/* User avatar */}
              <div className="relative">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg transition-all ${micActive ? "ring-4 ring-blue-200 scale-105" : ""}`}>
                  <span className="text-xl font-bold text-white">{candidateName.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                </div>
                {micActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {[0.3, 0.6, 1, 0.6, 0.3].map((h, i) => (
                      <div key={i} className="w-1 bg-blue-400 rounded-full animate-pulse" style={{ height: `${h * 12}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Current question */}
            {currentQuestion && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Q{currentQuestion.questionNumber}/{currentQuestion.totalQuestions}</span>
                  <span className="text-xs text-amber-600 font-medium">{currentQuestion.category}</span>
                  <div className="flex-1" />
                  <span className="text-xs text-amber-400">{currentQuestion.progress}%</span>
                </div>
                <div className="w-full bg-amber-100 rounded-full h-1.5 mb-2">
                  <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${currentQuestion.progress}%` }} />
                </div>
                <p className="text-sm font-medium text-amber-800">{currentQuestion.question}</p>
              </div>
            )}

            {!currentQuestion && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-sm text-emerald-700 font-medium">Taliq is preparing your interview...</p>
                <p className="text-xs text-emerald-500 mt-1">Listen carefully and speak when ready</p>
              </div>
            )}

            {/* Mic indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <div className={`w-2 h-2 rounded-full ${micActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
              <span>{micActive ? "Microphone active" : "Microphone on — speak when ready"}</span>
            </div>

            {/* End button */}
            <button onClick={endInterview}
              className="w-full py-2 rounded-xl border border-red-200 text-red-500 text-xs hover:bg-red-50 transition">
              End Interview Early
            </button>
          </div>
        )}

        {status === "complete" && (
          <div className="text-center py-6 space-y-4">
            {interviewResult ? (
              <>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${interviewResult.passed ? "bg-emerald-100" : "bg-amber-100"}`}>
                  {interviewResult.passed ? (
                    <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">Interview Complete</h4>
                  <p className="text-3xl font-black mt-2" style={{ color: interviewResult.passed ? "#059669" : "#d97706" }}>{interviewResult.score}%</p>
                  <p className="text-sm text-slate-500">{interviewResult.passed ? "Congratulations! You passed the interview." : "Thank you for completing the interview."}</p>
                </div>
                {/* Score breakdown */}
                {interviewResult.breakdown && interviewResult.breakdown.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3 text-left space-y-2">
                    <h5 className="text-xs font-bold text-slate-500 uppercase">Question Scores</h5>
                    {(interviewResult.breakdown as Array<{ question: string; score: number; category: string }>).map((q, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">Q{i + 1}</span>
                        <span className="flex-1 text-slate-600 truncate">{q.question}</span>
                        <span className={`font-bold ${q.score >= 7 ? "text-emerald-600" : q.score >= 5 ? "text-amber-600" : "text-red-600"}`}>{q.score}/10</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h4 className="font-bold text-slate-800">Interview Ended</h4>
                <p className="text-sm text-slate-500">Your responses have been recorded. Results will be processed shortly.</p>
              </>
            )}
            <button onClick={onComplete} className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition">
              Back to Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
