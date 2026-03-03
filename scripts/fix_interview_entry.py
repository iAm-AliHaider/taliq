"""Simplify interview entrypoint - let LLM drive everything"""
import pathlib

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\agent\agent.py")
src = f.read_text("utf-8")

OLD = '''    # Branch based on mode
    if interview_mode:
        cand_name = interview_meta.get("candidate_name", "Candidate")
        cand_position = interview_meta.get("position", "General Position")
        app_id = interview_meta.get("application_id", 0)
        
        # Initialize interview state
        state = init_candidate_interview(int(app_id) if app_id else 0, cand_name, cand_position)
        questions = state.get("questions", [])
        
        await session.start(room=ctx.room, agent=InterviewAgent(cand_name, cand_position, questions))
        
        # Let the LLM greet + ask Q1 naturally via generate_reply
        logger.info(f"Interview mode active for {cand_name}, {len(questions)} questions")
        await asyncio.sleep(2)
        session.say("Welcome " + cand_name + "! I am Taliq, your AI interviewer today for the " + cand_position + " role. Let us begin with the first question.")
        return'''

NEW = '''    # Branch based on mode
    if interview_mode:
        cand_name = interview_meta.get("candidate_name", "Candidate")
        cand_position = interview_meta.get("position", "General Position")
        app_id = interview_meta.get("application_id", 0)
        
        # Initialize interview state
        state = init_candidate_interview(int(app_id) if app_id else 0, cand_name, cand_position)
        questions = state.get("questions", [])
        
        await session.start(room=ctx.room, agent=InterviewAgent(cand_name, cand_position, questions))
        logger.info(f"Interview mode active for {cand_name}, {len(questions)} questions — LLM will drive")
        return'''

src = src.replace(OLD, NEW)
f.write_text(src, "utf-8")
print("Simplified interview entrypoint")
