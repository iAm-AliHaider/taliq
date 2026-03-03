import pathlib
f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\candidate\voice-interview.tsx")
src = f.read_text("utf-8")
# Replace isSpeaking references with static class
src = src.replace(
    '${isSpeaking ? "ring-4 ring-amber-200 animate-pulse" : ""}',
    ''
)
# Remove currentQuestion state if unused in props
# Actually currentQuestion is used in the render
f.write_text(src, "utf-8")
print("Fixed isSpeaking reference")
