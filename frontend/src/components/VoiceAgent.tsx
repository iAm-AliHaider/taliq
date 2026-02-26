"use client";

import { useState, useEffect, useRef } from "react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

export function VoiceAgent() {
  const room = useRoomContext();
  const localParticipant = useLocalParticipant();
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [micError, setMicError] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);

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

  // Real audio level visualization
  useEffect(() => {
    if (!isMicEnabled) {
      setAudioLevel(0);
      return;
    }
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        src.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!active) return;
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setAudioLevel(avg / 255);
          animRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {}
    })();
    return () => {
      active = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [isMicEnabled]);

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

  const ringScale = 1 + audioLevel * 0.3;
  const outerRingScale = 1 + audioLevel * 0.5;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Taliq Identity */}
      <div className="flex flex-col items-center gap-2 animate-float">
        <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-400 bg-clip-text text-transparent">
          تَلِيق
        </span>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${isConnected ? "bg-emerald-400" : "bg-zinc-600"}`} />
          <span className="text-[10px] text-zinc-600 tracking-[0.2em] uppercase">
            {isConnected ? "Ready" : "Connecting"}
          </span>
        </div>
      </div>

      {/* Mic Button with Living Rings */}
      <div className="relative flex items-center justify-center" style={{ width: "160px", height: "160px" }}>
        {/* Outer reactive ring */}
        {isMicEnabled && (
          <div
            className="absolute rounded-full border border-emerald-500/10 transition-transform duration-100"
            style={{
              width: "160px", height: "160px",
              transform: `scale(${outerRingScale})`,
            }}
          />
        )}
        {/* Middle reactive ring */}
        {isMicEnabled && (
          <div
            className="absolute rounded-full border border-emerald-500/20 transition-transform duration-100"
            style={{
              width: "130px", height: "130px",
              transform: `scale(${ringScale})`,
            }}
          />
        )}
        {/* Idle breathing rings */}
        {!isMicEnabled && isConnected && (
          <>
            <div className="absolute w-[130px] h-[130px] rounded-full border border-emerald-500/10 animate-breathe" />
            <div className="absolute w-[110px] h-[110px] rounded-full border border-emerald-500/10 animate-breathe" style={{ animationDelay: "-2s" }} />
          </>
        )}
        {/* Ripple on active */}
        {isMicEnabled && (
          <div className="absolute w-24 h-24 rounded-full border border-emerald-400/20 animate-ripple" />
        )}
        {/* Button */}
        <button
          onClick={toggleMic}
          disabled={!isConnected}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
            isMicEnabled
              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 glow-emerald"
              : isConnected
                ? "bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 hover:glow-emerald"
                : "bg-white/[0.02] border border-white/5 opacity-40 cursor-not-allowed"
          } ${isConnected && !isMicEnabled ? "cursor-pointer active:scale-90" : ""}`}
        >
          <svg
            className={`w-9 h-9 transition-all duration-500 ${isMicEnabled ? "text-white scale-110" : "text-zinc-500"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>

      {/* Audio Wave */}
      {isMicEnabled && (
        <div className="flex items-end gap-[2px] h-6">
          {Array.from({ length: 12 }).map((_, i) => {
            const h = 4 + audioLevel * 20 * Math.sin((Date.now() / 200 + i) * 0.5) + audioLevel * 8;
            return (
              <div
                key={i}
                className="w-[2px] rounded-full bg-gradient-to-t from-emerald-500/60 to-emerald-300/80 transition-all duration-75"
                style={{ height: `${Math.max(3, h)}px` }}
              />
            );
          })}
        </div>
      )}

      {/* Status */}
      <p className={`text-xs transition-all duration-500 ${
        isMicEnabled ? "text-emerald-400/80" : "text-zinc-600"
      }`}>
        {!isConnected ? "Connecting..." : isMicEnabled ? "Listening..." : "Tap to speak with Taliq"}
      </p>

      {micError && (
        <p className="text-[10px] text-red-400/80 bg-red-400/5 px-3 py-1 rounded-full">{micError}</p>
      )}
    </div>
  );
}
