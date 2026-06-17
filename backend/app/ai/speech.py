import io
import base64
import tempfile
import os
import subprocess
import asyncio
import shutil
from typing import Optional

import speech_recognition as sr
import edge_tts
import wave

from app.config import SUPPORTED_LANGUAGES

FFMPEG_PATH = shutil.which("ffmpeg") or os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "mobile", "node_modules", "ffmpeg-static", "ffmpeg.exe"
)
if not os.path.exists(FFMPEG_PATH):
    FFMPEG_PATH = None

TTS_VOICE_MAP = {
    "rw": "sw-TZ-RehemaNeural",
    "rn": "sw-TZ-RehemaNeural",
    "ln": "sw-TZ-RehemaNeural",
    "lg": "sw-KE-ZuriNeural",
    "sw": "sw-TZ-RehemaNeural",
    "ki": "sw-KE-ZuriNeural",
    "luo": "sw-KE-ZuriNeural",
    "bem": "en-ZA-LeahNeural",
    "ny": "en-ZA-LeahNeural",
    "ha": "en-NG-EzinneNeural",
    "yo": "en-NG-EzinneNeural",
    "ig": "en-NG-EzinneNeural",
    "ff": "en-NG-EzinneNeural",
    "ee": "en-NG-EzinneNeural",
    "tw": "en-NG-EzinneNeural",
    "gaa": "en-NG-EzinneNeural",
    "dag": "en-NG-EzinneNeural",
    "kri": "en-NG-EzinneNeural",
    "men": "en-NG-EzinneNeural",
    "tem": "en-NG-EzinneNeural",
    "am": "am-ET-MekdesNeural",
    "om": "am-ET-MekdesNeural",
    "ti": "am-ET-MekdesNeural",
    "so": "so-SO-UbaxNeural",
    "zu": "zu-ZA-ThandoNeural",
    "xh": "zu-ZA-ThandoNeural",
    "af": "af-ZA-AdriNeural",
    "st": "zu-ZA-ThandoNeural",
    "tn": "zu-ZA-ThandoNeural",
    "sn": "en-ZA-LeahNeural",
    "nd": "en-ZA-LeahNeural",
    "ss": "zu-ZA-ThandoNeural",
    "ve": "zu-ZA-ThandoNeural",
    "ts": "zu-ZA-ThandoNeural",
    "nr": "zu-ZA-ThandoNeural",
    "nso": "zu-ZA-ThandoNeural",
    "mg": "fr-FR-DeniseNeural",
    "sg": "fr-FR-DeniseNeural",
    "bm": "fr-FR-DeniseNeural",
    "wo": "fr-FR-DeniseNeural",
    "dyu": "fr-FR-DeniseNeural",
    "mos": "fr-FR-DeniseNeural",
    "kbp": "fr-FR-DeniseNeural",
    "kdh": "fr-FR-DeniseNeural",
    "ber": "fr-FR-DeniseNeural",
    "ar": "ar-SA-ZariyahNeural",
    "pt": "pt-BR-FranciscaNeural",
    "es": "es-ES-ElviraNeural",
    "fr": "fr-FR-DeniseNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "en": "en-US-AriaNeural",
}

STT_LANG_MAP = {
    "rw": "rw-RW", "rn": "rn-BI", "sw": "sw-TZ", "ha": "ha-NG",
    "yo": "yo-NG", "ig": "ig-NG", "am": "am-ET", "so": "so-SO",
    "zu": "zu-ZA", "xh": "xh-ZA", "af": "af-ZA", "st": "st-ZA",
    "tn": "tn-ZA", "sn": "sn-ZW", "ln": "ln-CD", "lg": "lg-UG",
    "ki": "ki-KE", "om": "om-ET", "ti": "ti-ET", "fr": "fr-FR",
    "pt": "pt-PT", "es": "es-ES", "ar": "ar-SA", "en": "en-US",
}


def _is_wav(data: bytes) -> bool:
    return data[:4] == b"RIFF" and data[8:12] == b"WAVE"


def _convert_to_wav(input_bytes: bytes) -> Optional[bytes]:
    if _is_wav(input_bytes):
        return input_bytes
    if not FFMPEG_PATH:
        return None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".audio") as tmp_in:
            tmp_in.write(input_bytes)
            tmp_in_path = tmp_in.name

        tmp_out_path = tempfile.mktemp(suffix=".wav")

        subprocess.run(
            [FFMPEG_PATH, "-y", "-i", tmp_in_path, "-acodec", "pcm_s16le",
             "-ar", "16000", "-ac", "1", tmp_out_path],
            capture_output=True, timeout=30,
        )

        with open(tmp_out_path, "rb") as f:
            wav_bytes = f.read()

        os.unlink(tmp_in_path)
        os.unlink(tmp_out_path)
        return wav_bytes
    except Exception:
        return None


class SpeechService:
    def __init__(self):
        self._recognizer = sr.Recognizer()

    def speech_to_text(self, audio_base64: str, language: Optional[str] = None) -> dict:
        try:
            audio_bytes = base64.b64decode(audio_base64)

            if not _is_wav(audio_bytes):
                converted = _convert_to_wav(audio_bytes)
                if converted:
                    audio_bytes = converted

            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            try:
                with sr.AudioFile(tmp_path) as source:
                    audio_data = self._recognizer.record(source)
            except ValueError:
                if FFMPEG_PATH:
                    converted = _convert_to_wav(base64.b64decode(audio_base64))
                    if converted:
                        audio_bytes = converted
                        with open(tmp_path, "wb") as f:
                            f.write(audio_bytes)
                        with sr.AudioFile(tmp_path) as source:
                            audio_data = self._recognizer.record(source)
                    else:
                        raise
                else:
                    raise

            os.unlink(tmp_path)

            recognizer_lang = STT_LANG_MAP.get(language or "en", "en-US")

            try:
                text = self._recognizer.recognize_google(audio_data, language=recognizer_lang)
                detected = language or "en"
                confidence = 0.92
            except sr.UnknownValueError:
                text = ""
                detected = language or "en"
                confidence = 0.0
            except sr.RequestError:
                text = ""
                detected = language or "en"
                confidence = 0.0

            if not text:
                return {
                    "text": "Sorry, I didn't catch that. Please try again.",
                    "detected_language": detected,
                    "confidence": 0.0,
                }

            return {
                "text": text.strip(),
                "detected_language": detected,
                "confidence": confidence,
            }

        except Exception as e:
            return {
                "text": f"Audio processing error: {str(e)}",
                "detected_language": language or "en",
                "confidence": 0.0,
            }

    def text_to_speech(self, text: str, language: str, voice: str = "default") -> dict:
        try:
            voice_name = voice if voice != "default" else TTS_VOICE_MAP.get(language, "en-US-AriaNeural")

            buf = io.BytesIO()

            async def _run():
                communicate = edge_tts.Communicate(text, voice_name)
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        buf.write(chunk["data"])

            asyncio.run(_run())
            buf.seek(0)
            audio_data = buf.read()

            if not audio_data:
                return {"audio_base64": "", "duration_seconds": 0.0}

            audio_base64_str = base64.b64encode(audio_data).decode("utf-8")
            duration = len(text) / 10

            return {
                "audio_base64": audio_base64_str,
                "duration_seconds": round(duration, 2),
            }

        except Exception as e:
            return {
                "audio_base64": "",
                "duration_seconds": 0.0,
            }


speech_service = SpeechService()
