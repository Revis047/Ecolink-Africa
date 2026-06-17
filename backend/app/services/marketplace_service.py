import random
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import Listing, ListingStatus, User, UserRole


def create_listing(
    db: Session, farmer_id: int, crop_name: str, quantity: float, price: float,
    category: Optional[str] = None, grade: Optional[str] = None,
    unit: str = "kg", currency: str = "KES", description: Optional[str] = None,
    location: Optional[str] = None, country: Optional[str] = None,
    images: Optional[List[str]] = None, harvest_date=None,
) -> Listing:
    price_usd = convert_to_usd(price, currency)
    listing = Listing(
        farmer_id=farmer_id,
        crop_name=crop_name,
        category=category,
        grade=grade,
        quantity=quantity,
        unit=unit,
        price=price,
        currency=currency,
        price_usd=price_usd,
        description=description,
        images=images or [],
        location=location,
        country=country,
        harvest_date=harvest_date,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


def get_listings(
    db: Session, skip: int = 0, limit: int = 20,
    category: Optional[str] = None, country: Optional[str] = None,
    crop_name: Optional[str] = None, min_price: Optional[float] = None,
    max_price: Optional[float] = None, farmer_id: Optional[int] = None,
    sort_by: str = "created_at", sort_desc: bool = True,
) -> List[Listing]:
    query = db.query(Listing).filter(Listing.status == ListingStatus.ACTIVE)

    if category:
        query = query.filter(Listing.category == category)
    if country:
        query = query.filter(Listing.country == country)
    if crop_name:
        query = query.filter(Listing.crop_name.ilike(f"%{crop_name}%"))
    if min_price is not None:
        query = query.filter(Listing.price_usd >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price_usd <= max_price)
    if farmer_id:
        query = query.filter(Listing.farmer_id == farmer_id)

    sort_column = getattr(Listing, sort_by, Listing.created_at)
    if sort_desc:
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)

    return query.offset(skip).limit(limit).all()


def get_listing_by_id(db: Session, listing_id: int) -> Optional[Listing]:
    return db.query(Listing).filter(Listing.id == listing_id).first()


def update_listing(db: Session, listing_id: int, farmer_id: int, **kwargs) -> Optional[Listing]:
    listing = db.query(Listing).filter(
        Listing.id == listing_id, Listing.farmer_id == farmer_id
    ).first()
    if not listing:
        return None
    for key, value in kwargs.items():
        if value is not None and hasattr(listing, key):
            setattr(listing, key, value)
    if "price" in kwargs and kwargs["price"] is not None:
        listing.price_usd = convert_to_usd(kwargs["price"], listing.currency)
    db.commit()
    db.refresh(listing)
    return listing


def delete_listing(db: Session, listing_id: int, farmer_id: int) -> bool:
    listing = db.query(Listing).filter(
        Listing.id == listing_id, Listing.farmer_id == farmer_id
    ).first()
    if not listing:
        return False
    listing.status = ListingStatus.CANCELLED
    db.commit()
    return True


def get_market_prices(crop_name: str, grade: Optional[str] = None) -> dict:
    base_prices = {
        "avocado": {"kes": 180, "usd": 1.50, "cny": 10.80},
        "maize": {"kes": 45, "usd": 0.38, "cny": 2.70},
        "coffee": {"kes": 600, "usd": 5.00, "cny": 36.00},
        "tea": {"kes": 350, "usd": 2.90, "cny": 21.00},
        "cassava": {"kes": 30, "usd": 0.25, "cny": 1.80},
        "mango": {"kes": 80, "usd": 0.67, "cny": 4.80},
        "cashew": {"kes": 400, "usd": 3.33, "cny": 24.00},
        "sesame": {"kes": 250, "usd": 2.08, "cny": 15.00},
    }
    prices = base_prices.get(crop_name.lower(), {"kes": 100, "usd": 0.83, "cny": 6.00})
    change = random.uniform(-8, 12)
    trend = "up" if change > 0 else "down"
    grade_multiplier = {"A": 1.3, "B": 1.0, "C": 0.7}.get(grade or "B", 1.0)

    return {
        "crop_name": crop_name,
        "grade": grade,
        "price_kes": round(prices["kes"] * grade_multiplier, 2),
        "price_usd": round(prices["usd"] * grade_multiplier, 2),
        "price_cny": round(prices["cny"] * grade_multiplier, 2),
        "trend": trend,
        "percentage_change": round(change, 1),
        "source": "China-Africa Trade Data Exchange",
    }


def convert_to_usd(amount: float, currency: str) -> float:
    rates = {
        "KES": 0.0083, "NGN": 0.0022, "TZS": 0.00039,
        "UGX": 0.00026, "RWF": 0.00076, "ETB": 0.018,
        "GHS": 0.077, "ZAR": 0.053, "USD": 1.0,
        "CNY": 0.14, "EUR": 1.08,
    }
    rate = rates.get(currency.upper(), 0.0083)
    return round(amount * rate, 2)
