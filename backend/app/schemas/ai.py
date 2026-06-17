from pydantic import BaseModel
from typing import Optional


class STTRequest(BaseModel):
    audio_base64: str
    language: Optional[str] = None


class STTResponse(BaseModel):
    text: str
    detected_language: str
    confidence: float


class TTSRequest(BaseModel):
    text: str
    language: str
    voice: Optional[str] = "default"


class TTSResponse(BaseModel):
    audio_base64: str
    duration_seconds: float


class TranslateRequest(BaseModel):
    text: str
    source_language: str
    target_language: str


class TranslateResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str


class CropScanRequest(BaseModel):
    image_base64: str
    language: Optional[str] = "rw"


class CropScanResponse(BaseModel):
    crop_type: str
    disease_name: str
    disease_name_local: str
    confidence: float
    treatment_plan: str
    treatment_plan_local: str
    is_healthy: bool


class VoiceInquiryRequest(BaseModel):
    audio_base64: str
    source_language: str
    target_language: Optional[str] = None
    conversation_id: Optional[str] = None


class VoiceInquiryResponse(BaseModel):
    transcribed_text: str
    response_text: str
    response_audio_base64: str
    source_language: str
    target_language: str
    conversation_id: str = ""


class TextChatRequest(BaseModel):
    text: str
    source_language: str
    target_language: Optional[str] = None
    conversation_id: Optional[str] = None
    model: Optional[str] = "openai/gpt-4o"


class TextChatResponse(BaseModel):
    response_text: str
    response_audio_base64: str
    conversation_id: str
    source_language: str
    target_language: str


class ConversationSummary(BaseModel):
    id: str
    language: str
    model: str
    message_count: int
    preview: str
    created_at: float
    updated_at: float


class MessageItem(BaseModel):
    role: str
    content: str
    timestamp: float
