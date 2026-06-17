from typing import Optional
from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.services.location_service import resolve_location, detect_country_by_ip
from app.config import SUPPORTED_LANGUAGES

router = APIRouter()


class DetectLanguageRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_language: Optional[str] = None


class LanguageOption(BaseModel):
    code: str
    name: str


class DetectLanguageResponse(BaseModel):
    country: str
    language: str
    language_name: str
    all_languages: list[LanguageOption]


@router.post("/detect-language", response_model=DetectLanguageResponse)
def detect_language(payload: DetectLanguageRequest, request: Request):
    client_ip = request.client.host if request.client else None
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    result = resolve_location(
        latitude=payload.latitude,
        longitude=payload.longitude,
        ip_address=client_ip,
        preferred_lang=payload.preferred_language,
    )

    all_langs = [
        LanguageOption(code=l["code"], name=l["name"])
        for l in result.get("all_languages", [])
    ]
    if not all_langs:
        all_langs = [
            LanguageOption(code=k, name=v) for k, v in SUPPORTED_LANGUAGES.items()
        ]

    return DetectLanguageResponse(
        country=result["country"],
        language=result["language"],
        language_name=result["language_name"],
        all_languages=all_langs[:20],
    )


@router.get("/languages")
def list_languages():
    return {
        "languages": [
            {"code": k, "name": v} for k, v in SUPPORTED_LANGUAGES.items()
        ]
    }
