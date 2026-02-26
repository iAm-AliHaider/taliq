"use client";

import { useState, useEffect, useMemo } from "react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

export function VoiceAgent() {
  const room = useRoomContext();
  const localParticipant = useLocalParticipant();
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [micError, setMicError] = useState("");

  const barHeights = useMemo(() => [12, 20, 8, 16, 24, 10, 18, 14, 22], []);

  useEffect(() => {
    if (!room) return;
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    room.on(RoomEvent.Connected, onConnect);
    room.on(RoomEvent.Disconnected, onDisconnect);
    if (room.state === "connected") setIsConnected(true);
    return () => { room.off(RoomEvent.Connected, onConnect); room.off(RoomEvent.Disconnected, onDisconnect); };
  }, [room]);

  useEffect(() => {
    setIsMicEnabled(localParticipant?.isMicrophoneEnabled ?? false);
  }, [localParticipant?.isMicrophoneEnabled]);

  const toggleMic = async () => {
    if (!localParticipant?.localParticipant) return;
    if (!navigator?.mediaDevices?.getUserMedia) {
      setMicError("Mic requires HTTPS");
      return;
    }
    try {
      setMicError("");
      const next = !isMicEnabled;
      await localParticipant.localParticipant.setMicrophoneEnabled(next);
      setIsMicEnabled(next);
    } catch {
      setMicError("Mic access denied");
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Taliq Logo */}
      <div className="flex flex-col items-center gap-1 mb-2">
        <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
          تَلِيق
        </span>
        <span className="text-[10px] text-zinc-500 tracking-widest uppercase">Taliq HR</span>
      </div>

      {/* Mic Button */}
      <div className="relative">
        {isMicEnabled && (
          <>
            <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
            <span className="absolute -inset-3 rounded-full bg-emerald-500/10 animate-pulse" />
          </>
        )}
        <button
          onClick={toggleMic}
          disabled={!isConnected}
          className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            isMicEnabled
              ? "bg-gradient-to-br from-emerald-500 to-amber-500 shadow-xl shadow-emerald-500/40"
              : "bg-zinc-800/80 border-2 border-zinc-700 hover:border-emerald-500/50"
          } ${!isConnected ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-90"}`}
        >
          <svg className={`w-8 h-8 md:w-10 md:h-10 ${isMicEnabled ? "text-white" : "text-zinc-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>

      {/* Audio Bars */}
      {isMicEnabled && (
        <div className="flex items-end gap-[3px] h-7">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-gradient-to-t from-emerald-500 to-amber-400 animate-pulse"
              style={{ height: `${h}px`, animationDelay: `${i * 70}ms` }}
            />
          ))}
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-zinc-600"}`} />
        <span className="text-xs font-medium text-zinc-400">
          {!isConnected ? "Connecting..." : isMicEnabled ? "Listening..." : "Tap to speak"}
        </span>
      </div>

      {micError && <p className="text-[10px] text-red-400">{micError}</p>}
    </div>
  );
}
