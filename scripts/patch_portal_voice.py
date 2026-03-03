"""Patch candidate portal to use VoiceInterview component"""
import pathlib

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\candidate\page.tsx")
src = f.read_text("utf-8")

# 1. Add import for VoiceInterview
if "VoiceInterview" not in src:
    src = src.replace(
        '"use client";',
        '"use client";\nimport VoiceInterview from "./voice-interview";'
    )
    print("Added VoiceInterview import")

# 2. Add voiceInterview state
if "showVoiceInterview" not in src:
    src = src.replace(
        "  const [interviewStarted, setInterviewStarted] = useState(false);",
        "  const [interviewStarted, setInterviewStarted] = useState(false);\n  const [showVoiceInterview, setShowVoiceInterview] = useState(false);"
    )
    print("Added showVoiceInterview state")

# 3. Replace the interview stage section to add voice option
# Find the interview stage block and add a voice interview button
OLD_INTERVIEW_BTN = '''                <button onClick={startInterview}
                  className="px-8 py-3 rounded-xl bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition">
                  Start Interview
                </button>'''

NEW_INTERVIEW_BTN = '''                <div className="flex flex-col gap-3">
                  <button onClick={() => setShowVoiceInterview(true)}
                    className="px-8 py-3 rounded-xl bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                    Start Voice Interview
                  </button>
                  <button onClick={startInterview}
                    className="px-8 py-2 rounded-xl border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-50 transition">
                    Use Text Interview Instead
                  </button>
                </div>'''

if OLD_INTERVIEW_BTN in src:
    src = src.replace(OLD_INTERVIEW_BTN, NEW_INTERVIEW_BTN)
    print("Added voice interview button")

# 4. Add the VoiceInterview component render (before the text interview section)
VOICE_SECTION = '''        {/* ── VOICE INTERVIEW ────────────────────────────────────────── */}
        {showVoiceInterview && app.stage === "interview" && (
          <VoiceInterview
            applicationRef={ref}
            applicationId={app.id}
            candidateName={app.candidate_name}
            position={app.job_title || "General Position"}
            pin={pin}
            onComplete={() => { setShowVoiceInterview(false); loadStatus(ref, pin); }}
          />
        )}

'''

if "VOICE INTERVIEW" not in src:
    # Insert before the text interview section
    target = '        {/* ── INTERVIEW STAGE'
    if target in src:
        src = src.replace(target, VOICE_SECTION + target)
        print("Added VoiceInterview component section")
    else:
        print("WARNING: Could not find interview section anchor")

f.write_text(src, "utf-8")
print("Portal patched for voice interview")
