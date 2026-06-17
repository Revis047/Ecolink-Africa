import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:voltage@127.0.0.1:3306/ecolink")
SECRET_KEY = os.getenv("SECRET_KEY", "ecolink-africa-dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

OPENAI_API_KEY = (os.getenv("OPENAI_API_KEY") or "").strip()
OPENAI_BASE_URL = (os.getenv("OPENAI_BASE_URL") or "https://api.openai.com/v1").strip()
FIREBASE_CREDENTIALS = os.getenv("FIREBASE_CREDENTIALS", "")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
CROP_MODEL_PATH = os.getenv("CROP_MODEL_PATH", "models/crop_disease.pth")
PLANTVILLAGE_CLASSES = [
    "Cassava__Bacterial_Blight", "Cassava__Brown_Streak_Disease",
    "Cassava__Green_Mottle", "Cassava__Mosaic_Disease",
    "Cassava__Healthy", "Maize__Cercospora_Leaf_Spot",
    "Maize__Common_Rust", "Maize__Northern_Leaf_Blight", "Maize__Healthy",
    "Tomato__Bacterial_Spot", "Tomato__Early_Blight", "Tomato__Healthy",
    "Tomato__Late_Blight", "Tomato__Leaf_Mold", "Tomato__Septoria_Leaf_Spot",
    "Tomato__Spider_Mites", "Tomato__Target_Spot", "Tomato__Yellow_Leaf_Curl_Virus",
]

SUPPORTED_LANGUAGES = {
    "rw": "Kinyarwanda", "rn": "Kirundi", "ln": "Lingala",
    "sw": "Swahili", "lg": "Luganda", "ha": "Hausa",
    "yo": "Yoruba", "ig": "Igbo", "am": "Amharic",
    "om": "Oromo", "ti": "Tigrinya", "so": "Somali",
    "zu": "Zulu", "xh": "Xhosa", "af": "Afrikaans",
    "st": "Sesotho", "tn": "Tswana", "sn": "Shona",
    "nd": "Ndebele", "ss": "Swati", "ve": "Venda",
    "ts": "Tsonga", "nr": "Southern Ndebele", "nso": "Pedi",
    "ki": "Kikuyu", "luo": "Luo", "bem": "Bemba",
    "ny": "Chichewa", "mg": "Malagasy", "sg": "Sango",
    "bm": "Bambara", "wo": "Wolof", "ff": "Fulfulde",
    "kri": "Krio", "men": "Mende", "tem": "Temne",
    "dyu": "Dioula", "mos": "Mooré", "ee": "Ewe",
    "tw": "Twi", "gaa": "Ga", "dag": "Dagbani",
    "kbp": "Kabiyé", "kdh": "Tem (Kotokoli)",
    "ber": "Berber", "ar": "Arabic",
    "pt": "Portuguese", "es": "Spanish", "fr": "French",
    "zh": "Mandarin Chinese", "en": "English",
}

LANGUAGES_BY_COUNTRY = {
    "Rwanda": {"primary": "rw", "others": ["en", "fr", "sw"]},
    "Burundi": {"primary": "rn", "others": ["fr", "sw"]},
    "DRC": {"primary": "ln", "others": ["sw", "kg", "lua", "fr"]},
    "Congo": {"primary": "ln", "others": ["kg", "fr"]},
    "Uganda": {"primary": "lg", "others": ["sw", "en", "nyn", "teo", "ach"]},
    "Kenya": {"primary": "sw", "others": ["ki", "luo", "luy", "kam", "en"]},
    "Tanzania": {"primary": "sw", "others": ["en", "suk"]},
    "Nigeria": {"primary": "ha", "others": ["yo", "ig", "ff", "en", "ibb", "tiv"]},
    "Ghana": {"primary": "tw", "others": ["ee", "gaa", "dag", "en"]},
    "South Africa": {"primary": "zu", "others": ["xh", "af", "tn", "st", "ts", "ss", "ve", "nr", "nso", "en"]},
    "Ethiopia": {"primary": "am", "others": ["om", "ti", "so"]},
    "Somalia": {"primary": "so", "others": ["ar"]},
    "Senegal": {"primary": "wo", "others": ["ff", "srr", "dyo", "mnk", "fr"]},
    "Mali": {"primary": "bm", "others": ["ff", "snk", "fr"]},
    "Botswana": {"primary": "tn", "others": ["en"]},
    "Zimbabwe": {"primary": "sn", "others": ["nd", "ve", "toi", "en"]},
    "Zambia": {"primary": "bem", "others": ["ny", "toi", "loz", "lun", "en"]},
    "Malawi": {"primary": "ny", "others": ["yao", "tum", "en"]},
    "Madagascar": {"primary": "mg", "others": ["fr"]},
    "Cameroon": {"primary": "ff", "others": ["en", "fr", "ewo", "dua"]},
    "Côte d'Ivoire": {"primary": "dyu", "others": ["bci", "any", "fr"]},
    "Burkina Faso": {"primary": "mos", "others": ["dyu", "ff", "fr"]},
    "Niger": {"primary": "ha", "others": ["dje", "ff", "fr"]},
    "Togo": {"primary": "ee", "others": ["kbp", "kdh", "fr"]},
    "Sierra Leone": {"primary": "kri", "others": ["men", "tem", "en"]},
    "Angola": {"primary": "pt", "others": ["umb", "kmb", "kg"]},
    "Mozambique": {"primary": "pt", "others": ["vmw", "ts", "ngl"]},
    "Guinea": {"primary": "ff", "others": ["man", "sus", "fr"]},
    "Liberia": {"primary": "en", "others": ["kpe", "bas"]},
    "Gambia": {"primary": "mnk", "others": ["ff", "wo", "en"]},
    "Lesotho": {"primary": "st", "others": ["en"]},
    "Eswatini": {"primary": "ss", "others": ["en"]},
    "Namibia": {"primary": "ng", "others": ["hz", "af", "de", "en"]},
    "CAR": {"primary": "sg", "others": ["fr"]},
    "Chad": {"primary": "ar", "others": ["fr", "sra"]},
    "South Sudan": {"primary": "en", "others": ["din", "nus", "bfa"]},
    "Sudan": {"primary": "ar", "others": ["nub", "bej"]},
    "Mauritania": {"primary": "ar", "others": ["ff", "wo", "snk"]},
    "Morocco": {"primary": "ar", "others": ["ber", "fr"]},
    "Algeria": {"primary": "ar", "others": ["ber", "fr"]},
    "Tunisia": {"primary": "ar", "others": ["fr", "ber"]},
    "Libya": {"primary": "ar", "others": ["ber"]},
    "Egypt": {"primary": "ar", "others": ["arz"]},
    "Djibouti": {"primary": "so", "others": ["aa", "ar", "fr"]},
    "Eritrea": {"primary": "ti", "others": ["ar", "tig", "aa", "bej"]},
    "Gabon": {"primary": "fr", "others": ["fan", "mye"]},
    "Equatorial Guinea": {"primary": "es", "others": ["fr", "fan"]},
    "Comoros": {"primary": "swb", "others": ["ar", "fr"]},
    "Mauritius": {"primary": "mfe", "others": ["fr", "en"]},
    "Seychelles": {"primary": "crs", "others": ["fr", "en"]},
    "Cape Verde": {"primary": "kea", "others": ["pt"]},
    "São Tomé and Príncipe": {"primary": "pt", "others": ["fro"]},
    "Guinea-Bissau": {"primary": "pt", "others": ["pov", "ff"]},
}

DEFAULT_FARMER_LANG = "rw"
DEFAULT_BUYER_LANG = "zh"
