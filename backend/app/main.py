import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, marketplace, ai, chat, handshake, location
from app.db.database import init_db, get_engine, Base
from app.services.socket_manager import sio

app = FastAPI(
    title="EcoLink Africa API",
    description="AI-powered platform connecting African farmers to Chinese markets",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["Marketplace"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI Services"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(handshake.router, prefix="/api/v1/handshake", tags=["Digital Handshake"])
app.include_router(location.router, prefix="/api/v1/location", tags=["Location & Language"])


@app.on_event("startup")
def on_startup():
    import threading
    def _init_db():
        try:
            Base.metadata.create_all(bind=get_engine())
        except Exception:
            pass
    threading.Thread(target=_init_db, daemon=True).start()


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "EcoLink Africa",
        "version": "1.0.0",
    }


ASGI_APP = socketio.ASGIApp(
    socketio_server=sio,
    other_asgi_app=app,
)
