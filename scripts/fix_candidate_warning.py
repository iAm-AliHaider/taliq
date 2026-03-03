"""Add warning to candidate portal about closing other Taliq tabs"""
import pathlib

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\candidate\page.tsx")
src = f.read_text("utf-8")

# Add a warning banner before the voice interview component
OLD = '''        {/* ── VOICE INTERVIEW ────────────────────────────────────────── */}
        {showVoiceInterview && app.stage === "interview" && (
          <VoiceInterview'''

NEW = '''        {/* ── VOICE INTERVIEW ────────────────────────────────────────── */}
        {showVoiceInterview && app.stage === "interview" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            <p className="text-xs text-amber-700">Please close all other Taliq tabs before starting the voice interview. Having the employee portal open in another tab may interfere with your interview audio.</p>
          </div>
        )}
        {showVoiceInterview && app.stage === "interview" && (
          <VoiceInterview'''

if "Please close all other Taliq tabs" not in src:
    src = src.replace(OLD, NEW)
    print("Added warning banner")
else:
    print("Warning already present")

f.write_text(src, "utf-8")
