"""Core shared state and utilities for all tool modules."""

import json
import logging
import os

logger = logging.getLogger("taliq-agent")

DEFAULT_EMPLOYEE_ID = os.getenv("TALIQ_EMPLOYEE_ID", "E001")

# Global refs set by entrypoint
_room_ref = None
_session_ref = None
_current_employee_id = None


def get_current_employee_id_from_context() -> str:
    global _current_employee_id
    if _current_employee_id:
        return _current_employee_id
    return DEFAULT_EMPLOYEE_ID


def set_current_employee_id(emp_id: str):
    global _current_employee_id
    _current_employee_id = emp_id


def set_room_ref(room):
    global _room_ref
    _room_ref = room


def get_room_ref():
    return _room_ref


def set_session_ref(session):
    global _session_ref
    _session_ref = session


def get_session_ref():
    return _session_ref


async def _send_ui(component: str, props: dict, category: str | None = None):
    global _room_ref
    if not _room_ref or not _room_ref.local_participant:
        return
    try:
        payload = json.dumps(
            {
                "type": "tambo_render",
                "component": component,
                "props": props,
                "category": category or component,
            },
            default=str,
        ).encode("utf-8")
        await _room_ref.local_participant.publish_data(
            payload, topic="ui_sync", reliable=True
        )
        logger.info(f"UI: {component}")
    except Exception as e:
        logger.error(f"UI error: {e}")
