from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, CropScan
from app.schemas.ai import (
    STTRequest, STTResponse,
    TTSRequest, TTSResponse,
    TranslateRequest, TranslateResponse,
    CropScanRequest, CropScanResponse,
    VoiceInquiryRequest, VoiceInquiryResponse,
    TextChatRequest, TextChatResponse,
    ConversationSummary, MessageItem,
)
from app.services.auth_service import get_current_user
from app.services.marketplace_service import get_market_prices
from app.ai.speech import speech_service
from app.ai.translation import translation_service
from app.ai.vision import crop_vision_service
from app.ai.chat import chat_service, conversation_store, AVAILABLE_MODELS

router = APIRouter()


@router.post("/stt", response_model=STTResponse)
def speech_to_text(payload: STTRequest):
    result = speech_service.speech_to_text(payload.audio_base64, payload.language)
    return STTResponse(**result)


@router.post("/tts", response_model=TTSResponse)
def text_to_speech(payload: TTSRequest):
    result = speech_service.text_to_speech(payload.text, payload.language, payload.voice)
    return TTSResponse(**result)


@router.post("/translate", response_model=TranslateResponse)
def translate(payload: TranslateRequest):
    result = translation_service.translate(
        payload.text, payload.source_language, payload.target_language
    )
    return TranslateResponse(**result)


@router.post("/crop-scan", response_model=CropScanResponse)
def scan_crop(
    payload: CropScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = crop_vision_service.scan_crop(payload.image_base64, payload.language)

    scan = CropScan(
        farmer_id=current_user.id,
        image_url="",
        crop_type=result["crop_type"],
        disease_name=result["disease_name"],
        disease_name_local=result["disease_name_local"],
        confidence=result["confidence"],
        treatment_plan=result["treatment_plan"],
        treatment_plan_local=result["treatment_plan_local"],
        is_healthy=result["is_healthy"],
    )
    db.add(scan)
    db.commit()

    return CropScanResponse(**result)


@router.post("/voice-inquiry", response_model=VoiceInquiryResponse)
def voice_inquiry(
    payload: VoiceInquiryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stt_result = speech_service.speech_to_text(
        payload.audio_base64, payload.source_language
    )
    transcribed_text = stt_result["text"]

    tgt_lang = payload.target_language or payload.source_language

    chat_result = chat_service.chat(
        transcribed_text,
        payload.source_language,
        tgt_lang,
        conversation_id=payload.conversation_id,
        user_id=current_user.id,
    )

    tts_result = speech_service.text_to_speech(
        chat_result["response_text"], tgt_lang
    )

    return VoiceInquiryResponse(
        transcribed_text=transcribed_text,
        response_text=chat_result["response_text"],
        response_audio_base64=tts_result.get("audio_base64", ""),
        source_language=payload.source_language,
        target_language=tgt_lang,
        conversation_id=chat_result.get("conversation_id", ""),
    )


@router.post("/chat", response_model=TextChatResponse)
def text_chat(
    payload: TextChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tgt_lang = payload.target_language or payload.source_language

    chat_result = chat_service.chat(
        payload.text,
        payload.source_language,
        tgt_lang,
        conversation_id=payload.conversation_id,
        user_id=current_user.id,
        model=payload.model or "openai/gpt-4o",
    )

    tts_result = speech_service.text_to_speech(
        chat_result["response_text"], tgt_lang
    )

    return TextChatResponse(
        response_text=chat_result["response_text"],
        response_audio_base64=tts_result.get("audio_base64", ""),
        conversation_id=chat_result.get("conversation_id", ""),
        source_language=payload.source_language,
        target_language=tgt_lang,
    )


@router.get("/conversations", response_model=list[ConversationSummary])
def list_conversations(
    current_user: User = Depends(get_current_user),
):
    return conversation_store.get_user_conversations(current_user.id)


@router.get("/conversations/{conv_id}", response_model=list[MessageItem])
def get_conversation_messages(
    conv_id: str,
    current_user: User = Depends(get_current_user),
):
    conv = conversation_store.get(conv_id)
    if not conv or conv["user_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation_store.get_messages(conv_id)


@router.delete("/conversations/{conv_id}")
def delete_conversation(
    conv_id: str,
    current_user: User = Depends(get_current_user),
):
    conv = conversation_store.get(conv_id)
    if not conv or conv["user_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conversation_store.delete(conv_id)
    return {"ok": True}


@router.get("/models")
def list_models():
    return {"models": AVAILABLE_MODELS}


@router.get("/scan-history")
def get_scan_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scans = db.query(CropScan).filter(
        CropScan.farmer_id == current_user.id
    ).order_by(CropScan.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": s.id,
            "crop_type": s.crop_type,
            "disease_name": s.disease_name,
            "disease_name_local": s.disease_name_local,
            "confidence": s.confidence,
            "is_healthy": s.is_healthy,
            "created_at": s.created_at.isoformat(),
        }
        for s in scans
    ]
