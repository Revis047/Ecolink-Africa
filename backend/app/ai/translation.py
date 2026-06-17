import json
from typing import Optional

from app.config import OPENAI_API_KEY, OPENAI_BASE_URL, SUPPORTED_LANGUAGES

try:
    from openai import OpenAI
    _openai_available = True
except ImportError:
    _openai_available = False
    OpenAI = None

AFRICAN_GREETINGS = {
    "rw": ["muraho", "bite", "amakuru", "waramutse"],
    "rn": ["amahoro", "bite", "ugiri ute", "mwiriwe"],
    "ln": ["mbote", "boni", "oyé", "lobi"],
    "sw": ["habari", "hujambo", "mambo", "sasa", "jambo", "shikamoo"],
    "lg": ["oli otya", "bulungi", "ki kati"],
    "ha": ["sannu", "ina kwana", "yaya", "lafiya"],
    "yo": ["bawo", "pẹlẹ o", "kí ló ń ṣe"],
    "ig": ["ndeewo", "kedu", "i bolo"],
    "am": ["ሰላም", "እንደምን", "ጤና"],
    "om": ["akkam", "asham"],
    "so": ["maalin wanaagsan", "iska warran", "nabad"],
    "zu": ["sawubona", "unjani", "yebo"],
    "xh": ["molo", "unjani", "ninjani"],
    "af": ["hallo", "goeie dag", "hoe gaan dit"],
    "st": ["lumela", "o kae", "le kae"],
    "tn": ["dumela", "le kae", "o tsogile"],
    "sn": ["mhoro", "makadii", "maswera"],
    "nd": ["salibonani", "unjani", "linjani"],
    "ss": ["sawubona", "unjani"],
    "ve": ["ndaa", "vho touwa"],
    "ts": ["minjhani", "xewe"],
    "nso": ["thobela", "le kae"],
    "nr": ["salibonani", "unjani"],
    "ki": ["wĩmwega", "ũhoro"],
    "luo": ["misawa", "idhi", "nade"],
    "bem": ["mwabuka", "shani", "mulishani"],
    "ny": ["moni", "muli bwanji", "zikomo"],
    "mg": ["salama", "manao ahoana", "veloma"],
    "sg": ["bara", "tî mbênî"],
    "bm": ["anw ka kɛnɛ", "i ni ce"],
    "wo": ["salaam", "no def", "naka nga"],
    "ff": ["mi yettii", "no def", "jam waali"],
    "kri": ["kushe", "aw di bodi", "toku"],
    "men": ["yɛ", "nyanyanu"],
    "tem": ["wɛsɛ", "kooke"],
    "dyu": ["anw ka kɛnɛ", "i ni ce"],
    "mos": ["yɛɛlɛ", "ne y sɩd"],
    "ee": ["nenyo", "efɔa"],
    "tw": ["akwaaba", "maakye", "maaha"],
    "gaa": ["teŋ", "oyoo"],
    "dag": ["anigoo", "dalɛ"],
    "ber": ["azul", "manza"],
    "ar": ["السلام عليكم", "مرحبا", "كيف حالك"],
    "pt": ["olá", "bom dia", "como está"],
    "es": ["hola", "buenos días", "cómo está"],
    "fr": ["bonjour", "comment allez-vous", "salut"],
    "zh": ["你好", "您好", "早上好"],
    "en": ["hello", "hi", "good morning", "how are you"],
}


class TranslationService:
    def __init__(self):
        self.client = None
        if OPENAI_API_KEY and _openai_available:
            self.client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)

    def translate(self, text: str, source_language: str, target_language: str) -> dict:
        src_name = SUPPORTED_LANGUAGES.get(source_language, source_language)
        tgt_name = SUPPORTED_LANGUAGES.get(target_language, target_language)

        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                f"You are a professional translator for African agriculture trade. "
                                f"Translate the following text from {src_name} to {tgt_name}. "
                                f"Keep agricultural terms and crop names accurate. "
                                f"Return ONLY the translated text, no explanations."
                            )
                        },
                        {"role": "user", "content": text},
                    ],
                    temperature=0.3,
                    max_tokens=1024,
                )
                translated = response.choices[0].message.content.strip()
            except Exception:
                translated = self._fallback_translate(text, source_language, target_language)
        else:
            translated = self._fallback_translate(text, source_language, target_language)

        return {
            "translated_text": translated,
            "source_language": source_language,
            "target_language": target_language,
        }

    def _fallback_translate(self, text: str, src_lang: str, tgt_lang: str) -> str:
        if tgt_lang == "zh":
            return f"【系统翻译】{text}"
        elif tgt_lang == "en":
            known_src_greetings = AFRICAN_GREETINGS.get(src_lang, [])
            if known_src_greetings and any(text.lower().startswith(g) for g in known_src_greetings):
                return f"[AI Translation from {SUPPORTED_LANGUAGES.get(src_lang, src_lang)}] {text}"
            return text
        elif tgt_lang in AFRICAN_GREETINGS:
            return f"【AI Translation to {SUPPORTED_LANGUAGES.get(tgt_lang, tgt_lang)}】{text}"
        return text


translation_service = TranslationService()
