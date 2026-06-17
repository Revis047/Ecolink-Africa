from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.schemas.chat import MessageSend, MessageResponse, ConversationResponse
from app.services.chat_service import (
    send_message, get_conversations_for_user,
    get_messages, mark_messages_read,
)
from app.services.auth_service import get_current_user
from app.ai.translation import translation_service

router = APIRouter()


@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convs = get_conversations_for_user(db, current_user.id)
    return [ConversationResponse(**c) for c in convs]


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def list_messages(
    conversation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = get_messages(db, conversation_id, current_user.id, skip, limit)
    result = []
    for msg in messages:
        sender = msg.sender
        result.append(MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_id=msg.sender_id,
            sender_name=sender.full_name or sender.username,
            receiver_id=msg.receiver_id,
            content=msg.content,
            content_original=msg.content_original,
            source_language=msg.source_language,
            target_language=msg.target_language,
            audio_url=msg.audio_url,
            is_read=msg.is_read,
            created_at=msg.created_at,
        ))
    return result


@router.post("/messages", response_model=MessageResponse)
def send_new_message(
    payload: MessageSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id == payload.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot send message to yourself")

    source_lang = payload.source_language or current_user.language
    target_lang = payload.target_language

    receiver = db.query(User).filter(User.id == payload.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    if not target_lang:
        target_lang = receiver.language

    if source_lang != "en" and target_lang != "en":
        translation = translation_service.translate(
            payload.content, source_lang, target_lang
        )
        translated_content = translation["translated_text"]
    else:
        translated_content = payload.content

    msg = send_message(
        db=db,
        sender_id=current_user.id,
        receiver_id=payload.receiver_id,
        content=translated_content,
        source_language=source_lang,
        target_language=target_lang,
        conversation_id=payload.conversation_id,
        listing_id=payload.listing_id,
    )

    msg.content_original = payload.content
    db.commit()
    db.refresh(msg)

    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        sender_name=current_user.full_name or current_user.username,
        receiver_id=msg.receiver_id,
        content=msg.content,
        content_original=msg.content_original,
        source_language=msg.source_language,
        target_language=msg.target_language,
        audio_url=msg.audio_url,
        is_read=msg.is_read,
        created_at=msg.created_at,
    )


@router.post("/conversations/{conversation_id}/read")
def mark_read(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mark_messages_read(db, conversation_id, current_user.id)
    return {"message": "Messages marked as read"}
