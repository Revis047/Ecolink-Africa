from typing import Optional
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, UserRole
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import (
    register_user, authenticate_user, create_access_token, get_current_user
)
from app.services.location_service import resolve_location
from app.config import DEFAULT_FARMER_LANG, DEFAULT_BUYER_LANG

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    detected_language = payload.language

    if not detected_language:
        client_ip = request.client.host if request.client else None
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        result = resolve_location(
            latitude=payload.latitude,
            longitude=payload.longitude,
            ip_address=client_ip,
        )
        detected_language = result["language"]
        if not payload.country and result["country"] != "Unknown":
            payload.country = result["country"]

    if not detected_language:
        role_default = DEFAULT_FARMER_LANG if payload.role == UserRole.FARMER else DEFAULT_BUYER_LANG
        detected_language = role_default

    user = register_user(
        db=db,
        username=payload.username,
        email=payload.email,
        password=payload.password,
        role=payload.role.value if hasattr(payload.role, 'value') else payload.role,
        language=detected_language,
        full_name=payload.full_name,
        country=payload.country,
        phone=payload.phone,
        farm_name=payload.farm_name,
        company_name=payload.company_name,
    )
    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/language", response_model=UserResponse)
def update_language(
    language: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.language = language
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
