import base64
import json
import io
import re
from typing import Optional
from openai import OpenAI

from app.config import OPENAI_API_KEY, OPENAI_BASE_URL, PLANTVILLAGE_CLASSES, SUPPORTED_LANGUAGES

LOCALIZED_DISEASES = {
    "rw": {
        "Bacterial_Blight": "Umugwe wa Bagiteri", "Brown_Streak_Disease": "Indwara y'Imirongo y'Umukara",
        "Mosaic_Disease": "Indwara ya Mozayiki", "Cercospora_Leaf_Spot": "Amabara y'Amababi ya Cercospora",
        "Common_Rust": "Ubutare rusange", "Northern_Leaf_Blight": "Umusenyi w'Amababi y'Amajyaruguru",
        "Bacterial_Spot": "Ibarabara ry'Indwara ya Bagiteri", "Early_Blight": "Umusenyi wa Mbere",
        "Late_Blight": "Umusenyi wa Nyuma", "Leaf_Mold": "Agahomoka k'Amababi",
        "Septoria_Leaf_Spot": "Amabara y'Amababi ya Septoria", "Spider_Mites": "Utuntu duto tutembera",
        "Target_Spot": "Ibarabara ry'Intego", "Yellow_Leaf_Curl_Virus": "Virusi y'Amababi y'Umuhondo",
        "Healthy": "Muzima",
    },
    "ln": {
        "Bacterial_Blight": "Kosɛkɛ ya Bakteri", "Brown_Streak_Disease": "Maladi ya Milangi ya Mayi",
        "Mosaic_Disease": "Maladi ya Mozaiki", "Cercospora_Leaf_Spot": "Matɔnɛ ma Nkasa ya Cercospora",
        "Common_Rust": "Ndundu ya Koze", "Bacterial_Spot": "Matɔnɛ ya Bakteri",
        "Early_Blight": "Kosɛkɛ ya Libosɔ", "Late_Blight": "Kosɛkɛ ya Sima",
        "Leaf_Mold": "Pɔlɔ́ na Nkasa", "Healthy": "Kolɔngɔ",
    },
    "sw": {
        "Bacterial_Blight": "Mnyauko wa Bakteria", "Brown_Streak_Disease": "Ugonjwa wa Mistari ya Kahawia",
        "Green_Mottle": "Ugonjwa wa Mabaka ya Kijani", "Mosaic_Disease": "Ugonjwa wa Mosaiki",
        "Cercospora_Leaf_Spot": "Madoa ya Majani ya Cercospora", "Common_Rust": "Kutu ya Kawaida",
        "Northern_Leaf_Blight": "Mnyauko wa Majani Kaskazini", "Bacterial_Spot": "Madoa ya Bakteria",
        "Early_Blight": "Mnyauko wa Mapema", "Late_Blight": "Mnyauko wa Marehemu",
        "Leaf_Mold": "Kuvu ya Majani", "Septoria_Leaf_Spot": "Madoa ya Majani ya Septoria",
        "Spider_Mites": "Utitiri wa Buibui", "Target_Spot": "Madoa Lengwa",
        "Yellow_Leaf_Curl_Virus": "Virusi vya Majani ya Njano", "Healthy": "Afya",
    },
    "ha": {
        "Bacterial_Blight": "Cutar Kwayoyin cuta", "Mosaic_Disease": "Cutar Mosaic",
        "Common_Rust": "Tsatsa", "Bacterial_Spot": "Tabo na Kwayoyin cuta",
        "Early_Blight": "Lalacewar farko", "Late_Blight": "Lalacewar marigayi",
        "Leaf_Mold": "Ruwan ganye", "Healthy": "Lafiya",
    },
    "yo": {
        "Bacterial_Blight": "Àrùn Kókòrò", "Mosaic_Disease": "Àrùn Mosaic",
        "Common_Rust": "Ipata", "Bacterial_Spot": "Àbààwọn Kókòrò",
        "Early_Blight": "Ìbàjẹ́ Tí ó tètè dé", "Late_Blight": "Ìbàjẹ́ Tí ó pẹ́",
        "Leaf_Mold": "Kíwú ewé", "Healthy": "Alára",
    },
    "ig": {
        "Bacterial_Blight": "Ọrịa nje", "Mosaic_Disease": "Ọrịa Mosaic",
        "Common_Rust": "Nchara", "Bacterial_Spot": "Ọkpu nje",
        "Early_Blight": "Mbibi mbido", "Late_Blight": "Mbibi oge",
        "Leaf_Mold": "Ahịhịa akwụkwọ", "Healthy": "Ahụike",
    },
    "am": {
        "Bacterial_Blight": "የባክቴሪያ በሽታ", "Mosaic_Disease": "የሞዛይክ በሽታ",
        "Common_Rust": "ዝገት", "Bacterial_Spot": "የባክቴሪያ ነጠብጣብ",
        "Early_Blight": "ቅድመ ማድረቅ", "Late_Blight": "ዘግይቶ ማድረቅ",
        "Leaf_Mold": "የቅጠል ሻጋታ", "Healthy": "ጤነኛ",
    },
    "zu": {
        "Bacterial_Blight": "Isifo samagciwane", "Mosaic_Disease": "Isifo se-Mosaic",
        "Common_Rust": "Ukugqwala", "Bacterial_Spot": "Ichashazi lamagciwane",
        "Early_Blight": "Ukubuna kwasekuqaleni", "Late_Blight": "Ukubuna sekwephuzile",
        "Leaf_Mold": "Isikhunta samaqabunga", "Healthy": "Inempilo",
    },
    "rn": {
        "Bacterial_Blight": "Umugwe wa bagiteri", "Mosaic_Disease": "Indwara ya mozayiki",
        "Common_Rust": "Ubutare", "Bacterial_Spot": "Ibarabara rya bagiteri",
        "Early_Blight": "Umwe mukeya", "Late_Blight": "Umwe w'inyuma",
        "Leaf_Mold": "Akagomoka k'amababi", "Healthy": "Muzima",
    },
}

TREATMENTS_LOCALIZED = {
    "rw": (
        "Uvuzo: 1. Kuramo no gutanya amababi yanduye. "
        "2. Koresha umuti wica agahomoka cyangwa bagiteri. "
        "3. Wongere urwunge rw'umwuka utanze umwanya ukwiye. "
        "4. Hindagura ibihingwa. "
        "5. Koresha imboga zihangana n'indwara mu gihe gitaha."
    ),
    "ln": (
        "Bokɔsi: 1. Longola mpe tia móto na nkasa oyo ezali na maladi. "
        "2. Tia nkisi ya koboma ba fongisi to ba bakteri. "
        "3. Bongisa ezali ya mopepe ya kopɛsa esika ya malamu. "
        "4. Zóngisa bilanga. "
        "5. Salelaka mbuma oyo ezangi maladi na eleko ezali koya."
    ),
    "sw": (
        "Matibabu: 1. Ondoa na kuharibu majani yaliyoathirika. "
        "2. Paka dawa ya kuua kuvu au bakteria inayofaa. "
        "3. Boresha mzunguko wa hewa kwa nafasi sahihi. "
        "4. Zungusha mazao. "
        "5. Tumia aina sugu za magonjwa msimu ujao."
    ),
    "ha": (
        "Magani: 1. Cire ganyen da aka shafa. "
        "2. Shafa maganin kashe naman gwari ko ƙwayoyin cuta da ya dace. "
        "3. Inganta zagayawar iska ta wurin tazara mai kyau. "
        "4. Juya amfanin gona. "
        "5. Yi amfani da nau'in da ke jure cututtuka a gaba."
    ),
    "yo": (
        "Itọju: 1. Yọ ati pa awọn ewe ti o ni arun run. "
        "2. Lo oogun apakokoro tabi apakokoro ti o yẹ. "
        "3. Mu alekun afefe to dara nipa aaye to dara. "
        "4. Yi irugbin po. "
        "5. Lo awọn oriṣi ti o ni agbara arun ni akoko to nbo."
    ),
    "ig": (
        "Ọgwụ: 1. Wepụ ma bibie akwụkwọ ndị ọrịa. "
        "2. Tinye ọgwụ fungicide ma ọ bụ bactericide kwesịrị ekwesị. "
        "3. Mee ka ikuku na-ekesa nke ọma site na oghere kwesịrị ekwesị. "
        "4. Tụgharịa ihe ọkụkụ. "
        "5. Jiri ụdị ndị na-eguzogide ọrịa n'oge na-abịa."
    ),
    "fr": (
        "Traitement: 1. Retirez et détruisez les feuilles infectées. "
        "2. Appliquez un fongicide ou bactéricide approprié. "
        "3. Améliorez la circulation d'air par un espacement adéquat. "
        "4. Pratiquez la rotation des cultures. "
        "5. Utilisez des variétés résistantes aux maladies la saison prochaine."
    ),
    "pt": (
        "Tratamento: 1. Remova e destrua as folhas infectadas. "
        "2. Aplique fungicida ou bactericida apropriado. "
        "3. Melhore a circulação de ar com espaçamento adequado. "
        "4. Pratique rotação de culturas. "
        "5. Use variedades resistentes a doenças na próxima safra."
    ),
}


class CropVisionService:
    def __init__(self):
        self._client = OpenAI(
            api_key=OPENAI_API_KEY,
            base_url=OPENAI_BASE_URL,
        )

    def _localize_disease(self, disease_name: str, language: str) -> str:
        if language == "en":
            return disease_name
        lang_dict = LOCALIZED_DISEASES.get(language, {})
        if lang_dict:
            for eng, localized in lang_dict.items():
                if eng.replace("_", " ") in disease_name.replace("_", " ") or eng in disease_name:
                    return localized
        return disease_name

    def _localize_treatment(self, treatment: str, language: str) -> str:
        if language == "en":
            return treatment
        return TREATMENTS_LOCALIZED.get(language, treatment)

    def scan_crop(self, image_base64: str, language: str = "rw") -> dict:
        try:
            image_data_url = f"data:image/jpeg;base64,{image_base64}"

            known_crops = "Cassava, Maize, Tomato, Coffee, Rice, Beans, Plantain, Groundnut, Yam, Sorghum, Millet, Cocoa, Sweet Potato, Irish Potato, Banana, Mango, Avocado, Citrus, Sugarcane, Pineapple"
            known_diseases = [
                "Bacterial Blight", "Brown Streak Disease", "Mosaic Disease",
                "Cercospora Leaf Spot", "Common Rust", "Northern Leaf Blight",
                "Bacterial Spot", "Early Blight", "Late Blight", "Leaf Mold",
                "Septoria Leaf Spot", "Target Spot", "Yellow Leaf Curl Virus",
                "Spider Mites", "Green Mottle", "Healthy",
            ]

            prompt = (
                "You are an expert African crop disease diagnostician. Analyze this crop leaf image.\n"
                "First, visually inspect the leaf for symptoms: spots, discoloration, wilting, mold, or damage.\n"
                "Then respond ONLY with valid JSON, no other text.\n"
                f"Likely crops: {known_crops}\n"
                f"Likely diseases: {', '.join(known_diseases)}\n"
                "Identify: crop_type (the plant species), disease_name (the disease or 'Healthy'), "
                "confidence (0.0-1.0 based on visual evidence), is_healthy (bool), "
                "treatment_plan (2-4 actionable steps)\n"
                '{"crop_type": "Unknown", "disease_name": "Unknown", "confidence": 0.0, "is_healthy": false, "treatment_plan": "No treatment available."}'
            )

            response = self._client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_data_url}},
                        ],
                    }
                ],
                temperature=0.2,
                max_tokens=512,
            )

            content = response.choices[0].message.content.strip()
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                result = {
                    "crop_type": "Unknown",
                    "disease_name": "Could not analyze",
                    "confidence": 0.0,
                    "is_healthy": None,
                    "treatment_plan": "No treatment available.",
                }

            crop_type = result.get("crop_type", "Unknown")
            disease_name = result.get("disease_name", "Unknown")
            confidence = float(result.get("confidence", 0.0))
            is_healthy = bool(result.get("is_healthy", False))
            treatment = result.get("treatment_plan", "No treatment plan available.")

            disease_name_local = self._localize_disease(disease_name, language)
            treatment_local = self._localize_treatment(treatment, language)

            return {
                "crop_type": crop_type,
                "disease_name": disease_name,
                "disease_name_local": disease_name_local,
                "confidence": round(confidence, 4),
                "treatment_plan": treatment,
                "treatment_plan_local": treatment_local,
                "is_healthy": is_healthy,
            }

        except Exception as e:
            return {
                "crop_type": "unknown",
                "disease_name": "Analysis unavailable",
                "disease_name_local": "Kubisanzwe ntiboneka" if language == "rw"
                    else "Uchambuzi haupatikani" if language == "sw"
                    else "Analyse indisponible" if language == "fr"
                    else "Analysis unavailable",
                "confidence": 0.0,
                "treatment_plan": f"Could not analyze image.",
                "treatment_plan_local": "Picha haikuweza kuchambuliwa. Tafadhali jaribu tena." if language == "sw"
                    else "Ifoto ntiyashoboye gusesengurwa. Ongera ugerageze." if language == "rw"
                    else "Image could not be analyzed. Please try again.",
                "is_healthy": False,
            }


crop_vision_service = CropVisionService()
