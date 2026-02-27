export interface TamboRenderMessage {
  type: "tambo_render";
  component: string;
  props: Record<string, unknown>;
  replace?: boolean;      // true = replace existing card of same component type
  category?: string;      // group cards — replacing within category
  id?: string;            // unique card id for targeted updates
}

export type UiSyncCallback = (msg: TamboRenderMessage) => void;

export function createDataChannelHandler(onMessage: UiSyncCallback) {
  return (payload: Uint8Array, _participant: unknown, _kind: unknown, topic?: string) => {
    if (topic !== "ui_sync") return;
    try {
      const text = new TextDecoder().decode(payload);
      console.log("[Taliq] Data received:", text);
      const msg: TamboRenderMessage = JSON.parse(text);
      if (msg.type === "tambo_render" && msg.component && msg.props) {
        console.log("[Taliq] Rendering:", msg.component, "replace:", msg.replace, "category:", msg.category);
        onMessage(msg);
      }
    } catch (error) {
      console.error("[Taliq] Parse error:", error);
    }
  };
}
