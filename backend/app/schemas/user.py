from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.models import UserRole


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: UserRole
    language: Optional[str] = None
    full_name: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    farm_name: Optional[str] = None
    company_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    language: str
    full_name: Optional[str]
    country: Optional[str]
    phone: Optional[str]
    farm_name: Optional[str]
    company_name: Optional[str]
    is_verified: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
