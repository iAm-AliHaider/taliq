"use client";

import { ReactNode, useState, useCallback, useEffect } from "react";
import { RoomEvent } from "livekit-client";
import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { getLiveKitUrl } from "@/lib/livekit-config";
import { TamboRenderMessage, createDataChannelHandler } from "@/lib/data-channel";

export interface ComponentItem {
  id: string;
  component: string;
  props: Record<string, unknown>;
  category?: string;
  timestamp: number;
}

export interface TaliqActions {
  sendAction: (action: string, payload: Record<string, unknown>) => void;
}

interface TaliqProviderProps {
  children: (components: ComponentItem[], actions: TaliqActions) => ReactNode;
  token: string;
}

export function TaliqProvider({ children, token }: TaliqProviderProps) {
  const [components, setComponents] = useState<ComponentItem[]>([]);

  const handleMessage = useCallback((msg: TamboRenderMessage) => {
    const id = msg.id || `${msg.component}-${Date.now()}`;
    const category = msg.category || msg.component;
    const newItem: ComponentItem = { id, component: msg.component, props: msg.props, category, timestamp: Date.now() };
    
    // ONLY keep the new card — clears everything else
    // Each new agent response replaces all previous cards
    setComponents([newItem]);
  }, []);

  const handleDataReceived = createDataChannelHandler(handleMessage);

  return (
    <LiveKitRoom token={token} serverUrl={getLiveKitUrl()} connect={true} audio={true} className="h-full w-full">
      <RoomAudioRenderer />
      <Inner onDataReceived={handleDataReceived} components={components}>
        {children}
      </Inner>
    </LiveKitRoom>
  );
}

function Inner({ onDataReceived, components, children }: {
  onDataReceived: (p: Uint8Array, part: unknown, k: any, t?: string) => void;
  components: ComponentItem[];
  children: (components: ComponentItem[], actions: TaliqActions) => ReactNode;
}) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;
    const handler = (payload: Uint8Array, participant: unknown, kind: any, topic?: string) => {
      onDataReceived(payload, participant, kind, topic);
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => { room.off(RoomEvent.DataReceived, handler); };
  }, [room, onDataReceived]);

  const sendAction = useCallback(async (action: string, payload: Record<string, unknown>) => {
    if (!room?.localParticipant) return;
    try {
      const msg = JSON.stringify({ type: "user_action", action, ...payload });
      await room.localParticipant.publishData(new TextEncoder().encode(msg), { topic: "user_action", reliable: true });
    } catch (e) {
      console.error("[Taliq] Action failed:", e);
    }
  }, [room]);

  return <div className="h-full w-full flex flex-col">{children(components, { sendAction })}</div>;
}
