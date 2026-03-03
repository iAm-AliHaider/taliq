"""Gap #4: Wire audit logging into all admin POST actions"""
import pathlib

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\api\admin\route.ts")
src = f.read_text("utf-8")

# Remove any previous bad injection
if "async function audit(" in src:
    # Find and remove the bad helper
    start = src.index("async function audit(")
    # Find the closing }
    end = src.index("\n}\n", start) + 3
    src = src[:start] + src[end:]
    print("Removed previous bad audit helper")

# Also remove any injected audit calls from previous run
import re
src = re.sub(r'\s*await audit\([^)]+\);\s*', '\n      ', src)

BT = chr(96)  # backtick

audit_helper = f"""
async function audit(actor: string, action: string, entity_type: string, entity_id: string, details: string) {{
  try {{
    await sql{BT}INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details) VALUES (${{actor}}, ${{action}}, ${{entity_type}}, ${{entity_id}}, ${{details}}){BT};
  }} catch (e) {{ console.error("audit log error:", e); }}
}}

"""

src = src.replace(
    "export async function GET(request: NextRequest) {",
    audit_helper + "export async function GET(request: NextRequest) {"
)
print("Added audit() helper")

ACTIONS = [
    ("approve", "approve", "body.type", "body.ref", f"{BT}${{body.type}} ${{body.decision}}: ${{body.ref}}{BT}"),
    ("reassign", "reassign", "leave", "body.ref", f"{BT}reassign leave ${{body.ref}}{BT}"),
    ("policy", "update_policy", "policy", "body.category", f"{BT}policy: ${{body.category}}{BT}"),
    ("create_announcement", "create", "announcement", "''", f"{BT}announcement: ${{body.title}}{BT}"),
    ("resolve_grievance", "resolve", "grievance", "body.id", f"{BT}grievance resolved{BT}"),
    ("delete_announcement", "delete", "announcement", "body.id", f"{BT}announcement deleted{BT}"),
    ("create_employee", "create", "employee", "''", f"{BT}employee: ${{body.name}}{BT}"),
    ("update_clearance", "update", "clearance", "body.employee_id", f"{BT}clearance: ${{body.department}}{BT}"),
    ("create_job", "create", "job", "''", f"{BT}job: ${{body.title}}{BT}"),
    ("update_job_status", "update", "job", "body.id", f"{BT}job status: ${{body.status}}{BT}"),
    ("create_interview", "create", "interview", "''", f"{BT}interview: ${{body.candidate_name}}{BT}"),
    ("create_asset", "create", "asset", "''", f"{BT}asset: ${{body.asset_name}}{BT}"),
    ("return_asset", "return", "asset", "body.id", f"{BT}asset returned{BT}"),
    ("create_shift", "create", "shift", "''", f"{BT}shift: ${{body.name}}{BT}"),
    ("assign_shift", "assign", "shift", "body.shift_id", f"{BT}shift assigned{BT}"),
    ("create_contract", "create", "contract", "''", f"{BT}contract: ${{body.employee_id}}{BT}"),
    ("approve_exit", "approve", "exit", "body.id", f"{BT}exit approved{BT}"),
    ("renew_iqama", "renew", "iqama", "body.employee_id", f"{BT}iqama renewed{BT}"),
    ("create_exam", "create", "exam", "''", f"{BT}exam: ${{body.title}}{BT}"),
    ("delete_exam", "delete", "exam", "body.id", f"{BT}exam deleted{BT}"),
    ("create_course", "create", "course", "''", f"{BT}course: ${{body.name}}{BT}"),
    ("delete_course", "delete", "course", "body.id", f"{BT}course deleted{BT}"),
    ("enroll_employee", "enroll", "training", "body.course_id", f"{BT}enroll: ${{body.employee_id}}{BT}"),
]

count = 0
for action_name, audit_action, entity_type, entity_id, details in ACTIONS:
    marker = f'if (action === "{action_name}")'
    if marker in src:
        idx = src.index(marker)
        ret_idx = src.index("return NextResponse.json", idx)
        audit_call = f'    await audit(body.actor_id || "system", "{audit_action}", "{entity_type}", String({entity_id}), {details});\n      '
        src = src[:ret_idx] + audit_call + src[ret_idx:]
        count += 1

f.write_text(src, "utf-8")
print(f"Injected audit logging into {count} actions")
print("Gap #4 DONE")
