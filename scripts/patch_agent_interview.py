"""Patch agent.py to support candidate interview mode"""
import pathlib

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\agent\agent.py")
src = f.read_text("utf-8")

# 1. Add import for candidate_interview tools
IMPORT = """from tools.candidate_interview import (
    init_candidate_interview, get_interview_system_prompt,
    next_interview_question, score_candidate_answer, complete_candidate_interview,
)
"""
if "candidate_interview" not in src:
    # Insert after the payroll imports
    src = src.replace(
        "from tools.payroll import (",
        IMPORT + "from tools.payroll import ("
    )
    print("Added candidate_interview import")

# 2. Add interview tools list
INTERVIEW_TOOLS = """
# Candidate interview tools (used in interview mode only)
INTERVIEW_TOOLS = [
    next_interview_question,
    score_candidate_answer,
    complete_candidate_interview,
]
"""
if "INTERVIEW_TOOLS" not in src:
    src = src.replace(
        "MANAGER_ONLY_TOOLS = {",
        INTERVIEW_TOOLS + "\nMANAGER_ONLY_TOOLS = {"
    )
    print("Added INTERVIEW_TOOLS list")

# 3. Add InterviewAgent class
INTERVIEW_AGENT = '''
class InterviewAgent(Agent):
    """Agent in candidate interview mode — uses interview-specific prompt and tools."""
    def __init__(self, candidate_name: str, position: str, questions: list):
        super().__init__(
            instructions=get_interview_system_prompt(candidate_name, position, questions),
            tools=INTERVIEW_TOOLS,
        )
'''
if "class InterviewAgent" not in src:
    src = src.replace(
        "class TaliqAgent(Agent):",
        INTERVIEW_AGENT + "\nclass TaliqAgent(Agent):"
    )
    print("Added InterviewAgent class")

# 4. Patch entrypoint to detect interview mode and branch
# Find where metadata is parsed and add mode detection
OLD_SET_EMP = '    set_current_employee_id(employee_id)'
NEW_SET_EMP = '''    # Detect interview mode
    interview_mode = False
    interview_meta = {}
    for meta_str in meta_sources:
        if not meta_str:
            continue
        try:
            m = json.loads(meta_str)
            if m.get("mode") == "interview":
                interview_mode = True
                interview_meta = m
                logger.info(f"INTERVIEW MODE: candidate={m.get('candidate_name')}, app_ref={m.get('application_ref')}")
                break
        except (json.JSONDecodeError, TypeError):
            continue

    set_current_employee_id(employee_id)'''

if "interview_mode" not in src:
    src = src.replace(OLD_SET_EMP, NEW_SET_EMP)
    print("Added interview mode detection")

# 5. Branch the agent creation based on mode
OLD_AGENT_START = '    await session.start(room=ctx.room, agent=TaliqAgent())'
NEW_AGENT_START = '''    # Branch based on mode
    if interview_mode:
        cand_name = interview_meta.get("candidate_name", "Candidate")
        cand_position = interview_meta.get("position", "General Position")
        app_id = interview_meta.get("application_id", 0)
        
        # Initialize interview state
        state = init_candidate_interview(int(app_id) if app_id else 0, cand_name, cand_position)
        questions = state.get("questions", [])
        
        await session.start(room=ctx.room, agent=InterviewAgent(cand_name, cand_position, questions))
        
        # Interview greeting — agent will follow the system prompt
        greeting = f"Welcome {cand_name}! I am Taliq, your AI interviewer. We will go through a few questions for the {cand_position} role. Take your time with each answer. Let me start with the first question."
        await session.say(greeting, allow_interruptions=False)
        
        # Trigger first question
        await asyncio.sleep(1)
        try:
            session.generate_reply(user_input="Please ask the first interview question now.")
        except Exception as e:
            logger.error(f"First question trigger failed: {e}")
        
        logger.info("Interview mode active — waiting for candidate responses")
        return
    
    await session.start(room=ctx.room, agent=TaliqAgent())'''

if "interview_mode:" not in src:
    src = src.replace(OLD_AGENT_START, NEW_AGENT_START)
    print("Added interview mode branching")

f.write_text(src, "utf-8")
print("Agent patched for interview mode")
