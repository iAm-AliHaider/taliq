import pathlib
f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\candidate\voice-interview.tsx")
src = f.read_text("utf-8")
src = src.replace(
    "const timerRef = useRef<ReturnType<typeof setInterval>>();",
    "const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);"
)
# Remove unused refs to avoid warnings
src = src.replace("  const audioRef = useRef<HTMLAudioElement>(null);\n", "")
src = src.replace("  const wsRef = useRef<WebSocket | null>(null);\n", "")
src = src.replace("  const pcRef = useRef<RTCPeerConnection | null>(null);\n", "")
src = src.replace("  const mediaRef = useRef<MediaStream | null>(null);\n", "")
# Remove unused state
src = src.replace("  const [isSpeaking, setIsSpeaking] = useState(false);\n", "")
src = src.replace("  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([]);\n", "")
f.write_text(src, "utf-8")
print("Fixed TypeScript issues")
