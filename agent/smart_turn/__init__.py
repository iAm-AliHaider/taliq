"""Smart Turn v3.2 — intelligent turn detection for voice agents.
Runs alongside Silero VAD. When VAD detects silence, Smart Turn analyzes
the full audio segment to determine if the user is actually done speaking.

Usage in agent.py:
    from smart_turn import SmartTurnDetector
    smart_turn = SmartTurnDetector()
    # In your AgentSession:
    session = AgentSession(
        turn_detection=smart_turn,  # if supported, else use manually
        ...
    )
"""
from .detector import SmartTurnDetector

__all__ = ["SmartTurnDetector"]
