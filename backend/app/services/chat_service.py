from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_

from app.db.models import Conversation, Message, User, Listing


def get_or_create_conversation(
    db: Session, buyer_id: int, farmer_id: int, listing_id: Optional[int] = None
) -> Conversation:
    conv = db.query(Conversation).filter(
        ((Conversation.buyer_id == buyer_id) & (Conversation.farmer_id == farmer_id)) |
        ((Conversation.buyer_id == farmer_id) & (Conversation.farmer_id == buyer_id))
    ).first()

    if conv:
        return conv

    conv = Conversation(
        buyer_id=buyer_id,
        farmer_id=farmer_id,
        listing_id=listing_id,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def send_message(
    db: Session, sender_id: int, receiver_id: int, content: str,
    source_language: Optional[str] = None, target_language: Optional[str] = None,
    conversation_id: Optional[int] = None, listing_id: Optional[int] = None,
) -> Message:
    if conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            raise ValueError("Conversation not found")
    else:
        conv = get_or_create_conversation(db, sender_id, receiver_id, listing_id)

    msg = Message(
        conversation_id=conv.id,
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content,
        content_original=content,
        source_language=source_language,
        target_language=target_language,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_conversations_for_user(db: Session, user_id: int) -> list:
    convs = db.query(Conversation).filter(
        (Conversation.buyer_id == user_id) | (Conversation.farmer_id == user_id)
    ).order_by(desc(Conversation.id)).all()

    result = []
    for conv in convs:
        last_msg = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(desc(Message.created_at)).first()

        unread = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.receiver_id == user_id,
            Message.is_read == False,
        ).count()

        buyer = db.query(User).filter(User.id == conv.buyer_id).first()
        farmer = db.query(User).filter(User.id == conv.farmer_id).first()
        listing = None
        if conv.listing_id:
            listing = db.query(Listing).filter(Listing.id == conv.listing_id).first()

        result.append({
            "id": conv.id,
            "buyer_id": conv.buyer_id,
            "buyer_name": buyer.full_name or buyer.username if buyer else "Unknown",
            "farmer_id": conv.farmer_id,
            "farmer_name": farmer.full_name or farmer.username if farmer else "Unknown",
            "listing_id": conv.listing_id,
            "listing_title": listing.crop_name if listing else None,
            "last_message": last_msg.content[:100] if last_msg else None,
            "last_message_time": last_msg.created_at if last_msg else None,
            "unread_count": unread,
            "created_at": conv.created_at,
        })
    return result


def get_messages(db: Session, conversation_id: int, user_id: int,
                 skip: int = 0, limit: int = 50) -> List[Message]:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        return []
    if conv.buyer_id != user_id and conv.farmer_id != user_id:
        return []

    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.receiver_id == user_id,
        Message.is_read == False,
    ).update({"is_read": True})
    db.commit()

    return db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at).offset(skip).limit(limit).all()


def mark_messages_read(db: Session, conversation_id: int, user_id: int):
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.receiver_id == user_id,
        Message.is_read == False,
    ).update({"is_read": True})
    db.commit()
