from typing import Dict, Optional
import socketio
from sqlalchemy.orm import Session

from app.db.database import get_session_local
from app.db.models import User
from app.services.chat_service import send_message, mark_messages_read
from app.ai.translation import translation_service

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
)


class SocketManager:
    def __init__(self):
        self.user_sessions: Dict[int, str] = {}

    def get_db(self) -> Session:
        return get_session_local()()

    async def register_user(self, sid: str, user_id: int):
        self.user_sessions[user_id] = sid
        await sio.enter_room(sid, f"user_{user_id}")

    async def send_to_user(self, user_id: int, event: str, data: dict):
        sid = self.user_sessions.get(user_id)
        if sid:
            await sio.emit(event, data, to=sid)

    def get_user_id_from_sid(self, sid: str) -> Optional[int]:
        for uid, s in self.user_sessions.items():
            if s == sid:
                return uid
        return None


manager = SocketManager()


@sio.event
async def connect(sid, environ):
    pass


@sio.event
async def authenticate(sid, data):
    from app.services.auth_service import get_current_user
    from fastapi import Depends
    from jose import JWTError, jwt
    from app.config import SECRET_KEY, ALGORITHM

    token = data.get("token")
    if not token:
        await sio.emit("error", {"message": "Token required"}, to=sid)
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            await manager.register_user(sid, user_id)
            await sio.emit("authenticated", {"user_id": user_id}, to=sid)
    except JWTError:
        await sio.emit("error", {"message": "Invalid token"}, to=sid)


@sio.event
async def join_conversation(sid, data):
    conversation_id = data.get("conversation_id")
    if conversation_id:
        await sio.enter_room(sid, f"conversation_{conversation_id}")


@sio.event
async def leave_conversation(sid, data):
    conversation_id = data.get("conversation_id")
    if conversation_id:
        await sio.leave_room(sid, f"conversation_{conversation_id}")


@sio.event
async def send_message(sid, data):
    user_id = manager.get_user_id_from_sid(sid)
    if not user_id:
        await sio.emit("error", {"message": "Not authenticated"}, to=sid)
        return

    db = manager.get_db()
    try:
        receiver_id = data["receiver_id"]
        content = data["content"]
        source_lang = data.get("source_language", "rw")
        target_lang = data.get("target_language", "zh")
        conversation_id = data.get("conversation_id")
        listing_id = data.get("listing_id")

        receiver = db.query(User).filter(User.id == receiver_id).first()
        if not receiver:
            await sio.emit("error", {"message": "Receiver not found"}, to=sid)
            return

        if not target_lang:
            target_lang = receiver.language

        translated_content = content
        if source_lang != "en" and target_lang != "en":
            translation = translation_service.translate(content, source_lang, target_lang)
            translated_content = translation["translated_text"]

        msg = send_message(
            db=db,
            sender_id=user_id,
            receiver_id=receiver_id,
            content=translated_content,
            source_language=source_lang,
            target_language=target_lang,
            conversation_id=conversation_id,
            listing_id=listing_id,
        )

        msg.content_original = content
        db.commit()
        db.refresh(msg)

        sender = db.query(User).filter(User.id == user_id).first()
        message_data = {
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "sender_name": sender.full_name or sender.username,
            "receiver_id": msg.receiver_id,
            "content": msg.content,
            "content_original": msg.content_original,
            "source_language": msg.source_language,
            "target_language": msg.target_language,
            "created_at": msg.created_at.isoformat(),
        }

        await sio.emit(
            "new_message",
            message_data,
            to=f"conversation_{msg.conversation_id}",
        )

        await manager.send_to_user(receiver_id, "new_message", message_data)

    except Exception as e:
        await sio.emit("error", {"message": str(e)}, to=sid)
    finally:
        db.close()


@sio.event
async def mark_read(sid, data):
    user_id = manager.get_user_id_from_sid(sid)
    if not user_id:
        return

    conversation_id = data.get("conversation_id")
    if conversation_id:
        db = manager.get_db()
        try:
            mark_messages_read(db, conversation_id, user_id)
            await sio.emit(
                "messages_read",
                {"conversation_id": conversation_id, "user_id": user_id},
                to=f"conversation_{conversation_id}",
            )
        finally:
            db.close()


@sio.event
async def disconnect(sid):
    user_id = manager.get_user_id_from_sid(sid)
    if user_id:
        del manager.user_sessions[user_id]
