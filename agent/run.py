"""Simple runner — use 'dev' mode which runs in-process (no multiprocessing)."""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
os.environ["PYTHONUNBUFFERED"] = "1"
# Disable file watcher in dev mode
os.environ["LIVEKIT_AGENTS_NO_WATCH"] = "1"

from dotenv import load_dotenv
load_dotenv()

import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s", stream=sys.stderr)

from agent import entrypoint
from livekit.agents import WorkerOptions, cli

if __name__ == "__main__":
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        agent_name="taliq",
    ))
