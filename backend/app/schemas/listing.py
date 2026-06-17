from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.db.models import ListingStatus


class ListingCreate(BaseModel):
    crop_name: str
    category: Optional[str] = None
    grade: Optional[str] = None
    quantity: float
    unit: Optional[str] = "kg"
    price: float
    currency: Optional[str] = "KES"
    description: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    images: Optional[List[str]] = None
    harvest_date: Optional[datetime] = None


class ListingUpdate(BaseModel):
    crop_name: Optional[str] = None
    grade: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    description: Optional[str] = None
    status: Optional[ListingStatus] = None


class ListingResponse(BaseModel):
    id: int
    farmer_id: int
    farmer_name: Optional[str] = None
    farm_name: Optional[str] = None
    farmer_country: Optional[str] = None
    crop_name: str
    crop_name_zh: Optional[str] = None
    category: Optional[str] = None
    grade: Optional[str] = None
    quantity: float
    unit: str
    price: float
    currency: str
    price_usd: Optional[float] = None
    description: Optional[str] = None
    description_zh: Optional[str] = None
    images: Optional[List[str]] = None
    location: Optional[str] = None
    country: Optional[str] = None
    status: ListingStatus
    quality_score: Optional[float] = None
    harvest_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PriceCheckRequest(BaseModel):
    crop_name: str
    grade: Optional[str] = None
    country: Optional[str] = None


class PriceCheckResponse(BaseModel):
    crop_name: str
    grade: Optional[str] = None
    price_kes: float
    price_usd: float
    price_cny: float
    trend: str
    percentage_change: float
    source: str
