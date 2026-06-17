from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MessageSend(BaseModel):
    conversation_id: Optional[int] = None
    receiver_id: int
    content: str
    source_language: Optional[str] = None
    target_language: Optional[str] = None
    listing_id: Optional[int] = None


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str
    receiver_id: int
    content: str
    content_original: Optional[str] = None
    source_language: Optional[str] = None
    target_language: Optional[str] = None
    audio_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    buyer_id: int
    buyer_name: str
    farmer_id: int
    farmer_name: str
    listing_id: Optional[int] = None
    listing_title: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
