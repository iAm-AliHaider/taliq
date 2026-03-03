import { NextRequest, NextResponse } from "next/server";
import { AccessToken, RoomServiceClient, AgentDispatchClient } from "livekit-server-sdk";

export async function POST(request: NextRequest) {
  try {
    const { roomName, participantName, employeeId, lang, mode, applicationRef, applicationId, candidateName, position } = await request.json();
    if (!roomName || !participantName) {
      return NextResponse.json({ error: "roomName and participantName required" }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY!;
    const apiSecret = process.env.LIVEKIT_API_SECRET!;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: participantName,
      metadata: JSON.stringify({ employee_id: employeeId || "", lang: lang || "en", mode: mode || "employee", application_ref: applicationRef || "", application_id: applicationId || "", candidate_name: candidateName || "", position: position || "" }),
    });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const token = await at.toJwt();

    const httpUrl = livekitUrl.replace("wss://", "https://");
    const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);
    try {
      await roomService.createRoom({ 
        name: roomName, 
        emptyTimeout: 300, 
        maxParticipants: 5,
        metadata: JSON.stringify({ employee_id: employeeId || "", lang: lang || "en", mode: mode || "employee", application_ref: applicationRef || "", application_id: applicationId || "", candidate_name: candidateName || "", position: position || "" }),
      });
    } catch (e) {
      console.log("Room create:", e instanceof Error ? e.message : "ok");
    }

    try {
      const agentDispatch = new AgentDispatchClient(httpUrl, apiKey, apiSecret);
      await agentDispatch.createDispatch(roomName, "taliq");
      console.log("Taliq agent dispatched to:", roomName);
    } catch (e) {
      console.error("Agent dispatch failed:", e instanceof Error ? e.message : e);
    }

    return NextResponse.json({ token, serverUrl: livekitUrl });
  } catch (error) {
    console.error("Token error:", error);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
