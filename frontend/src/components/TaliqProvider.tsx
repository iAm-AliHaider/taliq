"use client";

import { ReactNode, useState, useCallback, useEffect, useRef } from "react";
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
    const newItem: ComponentItem = {
      id,
      component: msg.component,
      props: msg.props,
      category,
      timestamp: Date.now(),
    };

    setComponents(prev => {
      // Replace existing cards of same category (default behavior)
      // This keeps the view clean — only latest card per category
      const filtered = prev.filter(c => c.category !== category);
      return [...filtered, newItem];
    });
  }, []);

  const handleDataReceived = createDataChannelHandler(handleMessage);

  return (
    <LiveKitRoom token={token} serverUrl={getLiveKitUrl()} connect={true} audio={true} className="h-full w-full">
      <RoomAudioRenderer />
      <DataChannelListener onDataReceived={(p, part, k, t) => handleDataReceived(p, part, k, t)} />
      <ActionProvider>
        {(sendAction) => (
          <div className="h-full w-full flex flex-col">
            {children(components, { sendAction })}
          </div>
        )}
      </ActionProvider>
    </LiveKitRoom>
  );
}

/** Sends user actions (button clicks) back to the agent via data channel */
function ActionProvider({ children }: { children: (sendAction: TaliqActions["sendAction"]) => ReactNode }) {
  const room = useRoomContext();

  const sendAction = useCallback(async (action: string, payload: Record<string, unknown>) => {
    if (!room?.localParticipant) return;
    try {
      const msg = JSON.stringify({ type: "user_action", action, ...payload });
      await room.localParticipant.publishData(new TextEncoder().encode(msg), { topic: "user_action", reliable: true });
      console.log("[Taliq] Action sent:", action, payload);
    } catch (e) {
      console.error("[Taliq] Failed to send action:", e);
    }
  }, [room]);

  return <>{children(sendAction)}</>;
}

function DataChannelListener({ onDataReceived }: { onDataReceived: (payload: Uint8Array, participant: unknown, kind: any, topic?: string) => void }) {
  const room = useRoomContext();
  useEffect(() => {
    if (!room) return;
    const handleData = (payload: Uint8Array, participant: unknown, kind: any, topic?: string) => {
      onDataReceived(payload, participant, kind, topic);
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => { room.off(RoomEvent.DataReceived, handleData); };
  }, [room, onDataReceived]);
  return null;
}
