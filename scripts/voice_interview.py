"""Patch token API to support interview mode metadata"""
import pathlib

# ─── Patch token/route.ts to accept interview metadata ───────────────────────
f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\api\token\route.ts")
src = f.read_text("utf-8")

# Replace the destructuring to include interview fields
OLD = '    const { roomName, participantName, employeeId, lang } = await request.json();'
NEW = '    const { roomName, participantName, employeeId, lang, mode, applicationRef, applicationId, candidateName, position } = await request.json();'
src = src.replace(OLD, NEW)

# Replace metadata to include interview info
OLD_META = '      metadata: JSON.stringify({ employee_id: employeeId || "", lang: lang || "en" }),'
NEW_META = '      metadata: JSON.stringify({ employee_id: employeeId || "", lang: lang || "en", mode: mode || "employee", application_ref: applicationRef || "", application_id: applicationId || "", candidate_name: candidateName || "", position: position || "" }),'
src = src.replace(OLD_META, NEW_META, 1)  # First occurrence (token metadata)

# Also update room metadata
OLD_ROOM_META = '        metadata: JSON.stringify({ employee_id: employeeId || "", lang: lang || "en" }),'
NEW_ROOM_META = '        metadata: JSON.stringify({ employee_id: employeeId || "", lang: lang || "en", mode: mode || "employee", application_ref: applicationRef || "", application_id: applicationId || "", candidate_name: candidateName || "", position: position || "" }),'
src = src.replace(OLD_ROOM_META, NEW_ROOM_META)

f.write_text(src, "utf-8")
print("Patched token/route.ts for interview mode")
