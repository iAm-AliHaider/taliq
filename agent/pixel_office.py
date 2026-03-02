"""
Pixel Office State Helper
Shared utility for voice agents to update their status in the Pixel Office.

Usage:
    from tools.pixel_office import PixelOffice
    po = PixelOffice("taliq")   # or "maya"

    po.online("Waiting for calls...")
    po.busy("Active session: Ahmed - Leave request")
    po.offline()
"""
import threading
import logging

logger = logging.getLogger(__name__)

PIXEL_OFFICE_URL = "http://127.0.0.1:19500"

def _post_async(url: str, payload: dict):
    """Fire-and-forget HTTP POST — never blocks the agent."""
    def _send():
        try:
            import urllib.request, json
            data = json.dumps(payload).encode()
            req = urllib.request.Request(
                url, data=data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            urllib.request.urlopen(req, timeout=2)
        except Exception:
            pass  # silently ignore — pixel office might not be running
    threading.Thread(target=_send, daemon=True).start()


class PixelOffice:
    def __init__(self, agent_id: str):
        """agent_id: 'maya' or 'taliq'"""
        self.agent_id = agent_id

    def set(self, status: str, detail: str = ""):
        _post_async(
            f"{PIXEL_OFFICE_URL}/voice-agents/set",
            {"id": self.agent_id, "status": status, "detail": detail}
        )

    def online(self, detail: str = "Waiting for calls..."):
        logger.info(f"[PixelOffice] {self.agent_id} -> online")
        self.set("online", detail)

    def busy(self, detail: str = "Active call"):
        logger.info(f"[PixelOffice] {self.agent_id} -> busy")
        self.set("busy", detail)

    def offline(self):
        logger.info(f"[PixelOffice] {self.agent_id} -> offline")
        self.set("offline", "")
