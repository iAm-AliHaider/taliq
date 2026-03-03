"""Fix interview flow - let LLM drive naturally instead of manual say+generate_reply"""
import pathlib

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\agent\agent.py")
src = f.read_text("utf-8")

# Replace the interview branch with a cleaner approach
OLD = '''    # Branch based on mode
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
        
        # Let the LLM greet + ask Q1 naturally via generate_reply
        logger.info(f"Interview mode active for {cand_name}, {len(questions)} questions")
        await asyncio.sleep(2)
        session.say("Welcome " + cand_name + "! I am Taliq, your AI interviewer today for the " + cand_position + " role. Let us begin with the first question.")
        return'''

src = src.replace(OLD, NEW)

f.write_text(src, "utf-8")
print("Fixed interview flow")
