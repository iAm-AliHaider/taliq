"use client";

import { useRoomContext, useConnectionState, useVoiceAssistant } from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";
import { useState, useEffect, useCallback, useRef } from "react";

interface Props {
  onQuickAction?: (text: string) => void;
}

function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function MicOffIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .49-.05.97-.16 1.43" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function SpeakerIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChatIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const QUICK_ACTIONS = [
  { label: "Leave", color: "text-emerald-600 bg-emerald-50 border-emerald-100", letter: "L", prompt: "Show me my leave balance" },
  { label: "Profile", color: "text-blue-600 bg-blue-50 border-blue-100", letter: "P", prompt: "Show my profile" },
  { label: "Pay Slip", color: "text-amber-600 bg-amber-50 border-amber-100", letter: "$", prompt: "Show my pay slip" },
  { label: "Team", color: "text-purple-600 bg-purple-50 border-purple-100", letter: "T", prompt: "Show team attendance" },
  { label: "Loans", color: "text-indigo-600 bg-indigo-50 border-indigo-100", letter: "B", prompt: "Show my loan balance" },
  { label: "Approvals", color: "text-teal-600 bg-teal-50 border-teal-100", letter: "A", prompt: "Show pending approvals" },
  { label: "Docs", color: "text-orange-600 bg-orange-50 border-orange-100", letter: "D", prompt: "Show my documents" },
  { label: "News", color: "text-pink-600 bg-pink-50 border-pink-100", letter: "N", prompt: "Show announcements" },
  { label: "Travel", color: "text-sky-600 bg-sky-50 border-sky-100", letter: "F", prompt: "Calculate travel allowance for Dubai 3 days" },
];

export function VoiceAgent({ onQuickAction }: Props) {
  const room = useRoomContext();
  const connectionState = useConnectionState(room);
  const { state: agentState } = useVoiceAssistant();
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<Array<{ role: "user" | "agent"; text: string; ts: number }>>([]);
  const [expanded, setExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const touchActiveRef = useRef(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const isConnected = connectionState === ConnectionState.Connected;
  const isListening = agentState === "listening" && !isMuted;
  const isSpeaking = agentState === "speaking";
  const isThinking = agentState === "thinking";

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Mute mic on connect (push-to-talk default)
  useEffect(() => {
    if (isConnected && room?.localParticipant) {
      room.localParticipant.setMicrophoneEnabled(true).then(() => {
        const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
        if (micPub?.track) {
          micPub.mute();
          setIsMuted(true);
        }
      });
    }
  }, [isConnected, room]);

  // Auto-scroll transcript
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [transcript]);

  // Transcription events
  useEffect(() => {
    if (!room) return;
    const handleTranscription = (segments: any[], participant: any) => {
      for (const seg of segments) {
        if (!seg.final || !seg.text?.trim()) continue;
        const isAgentSpeaker = participant?.identity?.startsWith("agent") || participant?.identity === "taliq";
        const role: "user" | "agent" = isAgentSpeaker ? "agent" : "user";
        setTranscript(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === role && Date.now() - last.ts < 3000) {
            return [...prev.slice(0, -1), { role: last.role, text: last.text + " " + seg.text.trim(), ts: Date.now() }];
          }
          return [...prev, { role, text: seg.text.trim(), ts: Date.now() }].slice(-20);
        });
      }
    };
    room.on("transcriptionReceived", handleTranscription);
    return () => { room.off("transcriptionReceived", handleTranscription); };
  }, [room]);

  const unmuteMic = useCallback(() => {
    if (!room?.localParticipant) return;
    const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
    if (micPub) { micPub.unmute(); setIsMuted(false); }
  }, [room]);

  const muteMic = useCallback(() => {
    if (!room?.localParticipant) return;
    // Small delay so VAD catches the last words
    setTimeout(() => {
      const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (micPub) { micPub.mute(); setIsMuted(true); }
    }, 400);
  }, [room]);

  // Touch handlers (push-to-talk: hold to speak)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    touchActiveRef.current = true;
    unmuteMic();
  }, [unmuteMic]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    touchActiveRef.current = false;
    muteMic();
  }, [muteMic]);

  // Click handler (desktop: toggle mic)
  const handleClick = useCallback(() => {
    // On touch devices, touch events handle it — skip click
    if (isTouchDevice) return;
    if (isMuted) unmuteMic(); else muteMic();
  }, [isTouchDevice, isMuted, unmuteMic, muteMic]);

  const sendTextToAgent = useCallback(async (text: string) => {
    if (!room?.localParticipant) return;
    try {
      const payload = new TextEncoder().encode(JSON.stringify({ type: "user_text", text }));
      await room.localParticipant.publishData(payload, { topic: "lk-chat", reliable: true });
      setTranscript(prev => [...prev, { role: "user" as const, text, ts: Date.now() }].slice(-20));
    } catch (e) {
      console.error("Failed to send text:", e);
    }
  }, [room]);

  // Audio level animation
  useEffect(() => {
    if (!isSpeaking && !isListening) { setAudioLevel(0); return; }
    const interval = setInterval(() => {
      setAudioLevel(isSpeaking ? 0.4 + Math.random() * 0.6 : 0.1 + Math.random() * 0.3);
    }, 100);
    return () => clearInterval(interval);
  }, [isSpeaking, isListening]);

  const ringScale = 1 + audioLevel * 0.4;

  const orbBg = isSpeaking
    ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30"
    : isListening
    ? "bg-gradient-to-br from-red-400 to-red-500 shadow-red-500/30"
    : isThinking
    ? "bg-gradient-to-br from-blue-400 to-blue-500 shadow-blue-500/30"
    : "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20";

  const statusText = !isConnected
    ? "Connecting..."
    : isSpeaking
    ? "Speaking..."
    : isListening
    ? isTouchDevice ? "Release to send" : "Listening - click to stop"
    : isThinking
    ? "Thinking..."
    : isTouchDevice ? "Hold to speak" : "Click to speak";

  return (
    <>
      {/* Expanded panel */}
      {expanded && (
        <div className="fixed inset-0 z-40 flex items-end justify-end p-4 pb-24">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setExpanded(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden animate-slide-up" style={{ maxHeight: "70vh" }}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Taliq Assistant</p>
                  <p className="text-[10px] text-gray-400">{statusText}</p>
                </div>
              </div>
              <button onClick={() => setExpanded(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                <XIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Transcript */}
            <div ref={chatRef} className="p-3 space-y-2 overflow-y-auto scrollbar-hide" style={{ maxHeight: "40vh" }}>
              {transcript.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-8">Start speaking or tap a quick action</p>
              )}
              {transcript.slice(-12).map((t, i) => (
                <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] ${
                    t.role === "user"
                      ? "bg-emerald-500 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-700 rounded-bl-sm"
                  }`}>
                    {t.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-100 p-3">
              <p className="text-[10px] text-gray-400 font-medium mb-2 uppercase tracking-wider">Quick Actions</p>
              <div className="grid grid-cols-3 gap-1.5">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      sendTextToAgent(action.prompt);
                      onQuickAction?.(action.prompt);
                    }}
                    disabled={!isConnected}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all group disabled:opacity-40 ${action.color}`}
                  >
                    <span className="text-sm font-bold">{action.letter}</span>
                    <span className="text-[9px] font-medium leading-tight text-center">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Orb - bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Status pill */}
        {isConnected && (isSpeaking || isListening || isThinking) && (
          <div className="px-3 py-1.5 rounded-full bg-white shadow-lg border border-gray-100 animate-slide-up">
            <p className={`text-[11px] font-medium ${
              isSpeaking ? "text-emerald-600" : isListening ? "text-red-500" : "text-blue-500"
            }`}>
              {statusText}
            </p>
          </div>
        )}

        {/* Hint on first load */}
        {isConnected && !isSpeaking && !isListening && !isThinking && transcript.length === 0 && (
          <div className="px-3 py-1.5 rounded-full bg-white shadow-lg border border-gray-100 animate-slide-up">
            <p className="text-[11px] text-gray-500">{isTouchDevice ? "Hold to speak" : "Click to speak"}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Expand button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
          >
            {expanded
              ? <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              : <ChatIcon className="w-4 h-4 text-gray-500" />
            }
          </button>

          {/* Main orb - push to talk */}
          <button
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            disabled={!isConnected}
            className={`relative w-16 h-16 rounded-full ${orbBg} shadow-xl flex items-center justify-center transition-all duration-300 active:scale-95 disabled:opacity-50 select-none touch-none`}
          >
            {/* Pulse rings when active */}
            {(isListening || isSpeaking) && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ripple" />
                <div className="absolute -inset-1 rounded-full border border-white/10 animate-ripple" style={{ animationDelay: "0.5s" }} />
              </>
            )}

            {/* Ring scale effect */}
            <div
              className="absolute inset-0 rounded-full transition-transform duration-150"
              style={{
                transform: `scale(${ringScale})`,
                background: isListening
                  ? "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)"
                  : isSpeaking
                  ? "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)"
                  : "transparent",
              }}
            />

            {/* Icon */}
            <div className="relative z-10">
              {isSpeaking
                ? <SpeakerIcon className="w-6 h-6 text-white" />
                : isMuted
                ? <MicOffIcon className="w-6 h-6 text-white" />
                : <MicIcon className="w-6 h-6 text-white" />
              }
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
