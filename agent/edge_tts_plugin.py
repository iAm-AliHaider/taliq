"""Edge TTS plugin for LiveKit Agents - Arabic voice support."""

import asyncio
import io
import logging
import struct
from typing import Optional

import edge_tts
from livekit import rtc
from livekit.agents import tts

logger = logging.getLogger("edge-tts-plugin")


class EdgeTTS(tts.TTS):
    """LiveKit-compatible Edge TTS for Arabic and other Microsoft voices."""
    
    def __init__(
        self,
        voice: str = "ar-SA-HamedNeural",
        rate: str = "+0%",
        volume: str = "+0%",
    ):
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=24000,
            num_channels=1,
        )
        self._voice = voice
        self._rate = rate
        self._volume = volume
    
    def synthesize(
        self,
        text: str,
        *,
        conn_options=None,
    ) -> "EdgeChunkedStream":
        return EdgeChunkedStream(
            tts=self,
            input_text=text,
            voice=self._voice,
            rate=self._rate,
            volume=self._volume,
        )


class EdgeChunkedStream(tts.ChunkedStream):
    def __init__(
        self,
        *,
        tts: EdgeTTS,
        input_text: str,
        voice: str,
        rate: str,
        volume: str,
    ):
        super().__init__(tts=tts, input_text=input_text)
        self._voice = voice
        self._rate = rate
        self._volume = volume
    
    async def _run(self, output_emitter):
        """Generate audio using Edge TTS and emit frames."""
        try:
            communicate = edge_tts.Communicate(
                self._input_text,
                self._voice,
                rate=self._rate,
                volume=self._volume,
            )
            
            # Collect all MP3 audio data
            mp3_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    mp3_data += chunk["data"]
            
            if not mp3_data:
                logger.warning("Edge TTS returned no audio")
                return
            
            # Decode MP3 to PCM using pydub or ffmpeg
            try:
                import subprocess
                process = await asyncio.create_subprocess_exec(
                    "ffmpeg", "-i", "pipe:0",
                    "-f", "s16le",
                    "-ar", "24000",
                    "-ac", "1",
                    "-acodec", "pcm_s16le",
                    "pipe:1",
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                pcm_data, stderr = await process.communicate(input=mp3_data)
                
                if not pcm_data:
                    logger.error(f"ffmpeg decode failed: {stderr.decode()[:200]}")
                    return
                
                # Create audio frame and push
                SAMPLES_PER_FRAME = 480  # 20ms at 24kHz
                BYTES_PER_FRAME = SAMPLES_PER_FRAME * 2  # 16-bit = 2 bytes per sample
                
                for i in range(0, len(pcm_data), BYTES_PER_FRAME):
                    frame_data = pcm_data[i:i + BYTES_PER_FRAME]
                    if len(frame_data) < BYTES_PER_FRAME:
                        # Pad last frame
                        frame_data += b'\x00' * (BYTES_PER_FRAME - len(frame_data))
                    
                    frame = rtc.AudioFrame(
                        data=frame_data,
                        sample_rate=24000,
                        num_channels=1,
                        samples_per_channel=SAMPLES_PER_FRAME,
                    )
                    output_emitter.push(frame)
                    
            except FileNotFoundError:
                logger.error("ffmpeg not found - required for Edge TTS MP3 decoding")
                raise
                
        except Exception as e:
            logger.error(f"Edge TTS synthesis error: {e}")
            raise
