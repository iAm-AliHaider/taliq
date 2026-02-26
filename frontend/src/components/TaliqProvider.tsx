"use client";

import { ReactNode, useState, useCallback, useEffect } from "react";
import { RoomEvent } from "livekit-client";
import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { getLiveKitUrl } from "@/lib/livekit-config";
import { createDataChannelHandler } from "@/lib/data-channel";

interface ComponentItem {
  id: string;
  component: string;
  props: Record<string, unknown>;
}

interface TaliqProviderProps {
  children: (components: ComponentItem[], setComponents: React.Dispatch<React.SetStateAction<ComponentItem[]>>) => ReactNode;
  token: string;
}

export function TaliqProvider({ children, token }: TaliqProviderProps) {
  const [components, setComponents] = useState<ComponentItem[]>([]);

  const handleComponent = useCallback((component: string, props: Record<string, unknown>) => {
    const id = `${component}-${Date.now()}`;
    setComponents(prev => [...prev, { id, component, props }]);
  }, []);

  const handleDataReceived = createDataChannelHandler(handleComponent);

  return (
    <LiveKitRoom token={token} serverUrl={getLiveKitUrl()} connect={true} className="h-full w-full">
      <RoomAudioRenderer />
      <DataChannelListener onDataReceived={(p, part, k, t) => handleDataReceived(p, part, k, t)} />
      <div className="h-full w-full flex flex-col">{children(components, setComponents)}</div>
    </LiveKitRoom>
  );
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
