import uuid
import time
import logging
from typing import Optional

from app.config import OPENAI_API_KEY, OPENAI_BASE_URL, SUPPORTED_LANGUAGES

logger = logging.getLogger(__name__)

try:
    from openai import OpenAI
    _openai_available = bool(OPENAI_API_KEY)
except ImportError:
    _openai_available = False
    OpenAI = None


SYSTEM_PROMPT = """You are EcoLink AI, a helpful agricultural assistant for smallholder farmers in Africa.

Your role:
- Answer questions about farming, crops, livestock, weather, market prices, and agricultural best practices
- Provide practical, actionable advice suitable for local farmers with limited resources
- Be friendly, encouraging, and use simple language
- When asked about market prices, give realistic estimates based on common regional prices
- When asked about crop diseases, suggest organic/low-cost treatments first
- Keep responses concise (2-4 sentences max) and directly answer the question
- Remember the conversation history and refer back to it naturally
- If the farmer asks a follow-up question, connect it to what was discussed before
- Never mention that you were instructed to be concise or follow guidelines
- If you don't know something, say so honestly rather than making up information"""


AVAILABLE_MODELS = [
    {"id": "openai/gpt-4o", "name": "GPT-4o", "provider": "OpenAI"},
    {"id": "google/gemini-2.0-flash-001", "name": "Gemini 2.0 Flash", "provider": "Google"},
    {"id": "deepseek/deepseek-chat", "name": "DeepSeek V3", "provider": "DeepSeek"},
    {"id": "meta-llama/llama-3.3-70b-instruct", "name": "Llama 3.3 70B", "provider": "Meta"},
    {"id": "mistralai/mistral-large-2411", "name": "Mistral Large", "provider": "Mistral"},
    {"id": "qwen/qwen-2.5-72b-instruct", "name": "Qwen 2.5 72B", "provider": "Qwen"},
    {"id": "anthropic/claude-3.5-haiku", "name": "Claude 3.5 Haiku", "provider": "Anthropic"},
]


class ConversationStore:
    def __init__(self):
        self._conversations: dict = {}

    def create(self, user_id: int, language: str, model: str = "openai/gpt-4o") -> dict:
        conv_id = str(uuid.uuid4())
        conv = {
            "id": conv_id,
            "user_id": user_id,
            "language": language,
            "model": model,
            "messages": [],
            "created_at": time.time(),
            "updated_at": time.time(),
        }
        self._conversations[conv_id] = conv
        return conv

    def get(self, conv_id: str) -> Optional[dict]:
        return self._conversations.get(conv_id)

    def get_user_conversations(self, user_id: int) -> list:
        return [
            {
                "id": c["id"],
                "language": c["language"],
                "model": c["model"],
                "message_count": len(c["messages"]),
                "preview": c["messages"][0]["content"][:80] if c["messages"] else "",
                "created_at": c["created_at"],
                "updated_at": c["updated_at"],
            }
            for c in sorted(
                self._conversations.values(),
                key=lambda x: x["updated_at"],
                reverse=True,
            )
            if c["user_id"] == user_id
        ]

    def add_message(self, conv_id: str, role: str, content: str):
        conv = self._conversations.get(conv_id)
        if not conv:
            return
        conv["messages"].append({
            "role": role,
            "content": content,
            "timestamp": time.time(),
        })
        conv["updated_at"] = time.time()

    def get_messages(self, conv_id: str) -> list:
        conv = self._conversations.get(conv_id)
        return conv["messages"] if conv else []

    def delete(self, conv_id: str):
        self._conversations.pop(conv_id, None)

    def set_model(self, conv_id: str, model: str):
        conv = self._conversations.get(conv_id)
        if conv:
            conv["model"] = model


conversation_store = ConversationStore()


class ChatService:
    def __init__(self):
        self.client = None
        if _openai_available and OpenAI:
            logger.info(f"Initializing OpenAI client with base_url={OPENAI_BASE_URL}, key_present={bool(OPENAI_API_KEY)}")
            self.client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)

    def chat(
        self,
        query: str,
        source_language: str,
        target_language: str,
        conversation_id: Optional[str] = None,
        user_id: Optional[int] = None,
        model: str = "openai/gpt-4o",
    ) -> dict:
        lang_name = SUPPORTED_LANGUAGES.get(source_language, source_language)

        if user_id and not conversation_id:
            conv = conversation_store.create(user_id, source_language, model)
            conversation_id = conv["id"]
        elif conversation_id:
            existing = conversation_store.get(conversation_id)
            if not existing and user_id:
                conv = conversation_store.create(user_id, source_language, model)
                conversation_id = conv["id"]
            elif existing:
                conversation_store.set_model(conversation_id, model)

        if conversation_id:
            conversation_store.add_message(conversation_id, "user", query)

        if self.client:
            try:
                messages = [{"role": "system", "content": SYSTEM_PROMPT}]

                if conversation_id:
                    history = conversation_store.get_messages(conversation_id)[:-1]
                    for msg in history:
                        messages.append({
                            "role": msg["role"],
                            "content": msg["content"],
                        })

                messages.append({
                    "role": "user",
                    "content": (
                        f"[The farmer speaks {lang_name}. "
                        f"Respond in {lang_name} directly, do NOT use English.]\n\n"
                        f"{query}"
                    ),
                })

                response = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1024,
                )
                answer = response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"OpenAI API call failed: {e}", exc_info=True)
                answer = self._fallback(query, lang_name)
        else:
            answer = self._fallback(query, lang_name)

        if conversation_id:
            conversation_store.add_message(conversation_id, "assistant", answer)

        return {
            "response_text": answer,
            "conversation_id": conversation_id or "",
            "source_language": source_language,
            "target_language": target_language,
        }

    def _fallback(self, query: str, lang: str) -> str:
        return "I'm sorry, I'm having trouble connecting right now. Please try again."


chat_service = ChatService()
