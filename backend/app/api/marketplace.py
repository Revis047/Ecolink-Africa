from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, UserRole, Listing, ListingStatus
from app.schemas.listing import (
    ListingCreate, ListingUpdate, ListingResponse,
    PriceCheckRequest, PriceCheckResponse,
)
from app.services.marketplace_service import (
    create_listing, get_listings, get_listing_by_id,
    update_listing, delete_listing, get_market_prices,
)
from app.services.auth_service import get_current_user
from app.ai.translation import translation_service

router = APIRouter()


@router.get("/listings", response_model=List[ListingResponse])
def list_listings(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    country: Optional[str] = None,
    crop_name: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = "created_at",
    sort_desc: bool = True,
    db: Session = Depends(get_db),
):
    listings = get_listings(
        db, skip=skip, limit=limit,
        category=category, country=country,
        crop_name=crop_name, min_price=min_price,
        max_price=max_price, sort_by=sort_by, sort_desc=sort_desc,
    )
    result = []
    for listing in listings:
        listing_resp = ListingResponse.model_validate(listing)
        farmer = listing.farmer
        listing_resp.farmer_name = farmer.full_name or farmer.username
        listing_resp.farm_name = farmer.farm_name
        listing_resp.farmer_country = farmer.country
        result.append(listing_resp)
    return result


@router.get("/listings/{listing_id}", response_model=ListingResponse)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = get_listing_by_id(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing_resp = ListingResponse.model_validate(listing)
    farmer = listing.farmer
    listing_resp.farmer_name = farmer.full_name or farmer.username
    listing_resp.farm_name = farmer.farm_name
    listing_resp.farmer_country = farmer.country
    return listing_resp


@router.post("/listings", response_model=ListingResponse, status_code=201)
def create_new_listing(
    payload: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.FARMER:
        raise HTTPException(status_code=403, detail="Only farmers can create listings")

    listing = create_listing(
        db=db, farmer_id=current_user.id,
        crop_name=payload.crop_name,
        category=payload.category,
        grade=payload.grade,
        quantity=payload.quantity,
        unit=payload.unit,
        price=payload.price,
        currency=payload.currency,
        description=payload.description,
        location=payload.location,
        country=payload.country or current_user.country,
        images=payload.images,
        harvest_date=payload.harvest_date,
    )

    if payload.description:
        translation = translation_service.translate(
            payload.description, "en", "zh"
        )
        listing.description_zh = translation["translated_text"]
    translation = translation_service.translate(payload.crop_name, "en", "zh")
    listing.crop_name_zh = translation["translated_text"]
    db.commit()
    db.refresh(listing)

    listing_resp = ListingResponse.model_validate(listing)
    listing_resp.farmer_name = current_user.full_name or current_user.username
    listing_resp.farm_name = current_user.farm_name
    listing_resp.farmer_country = current_user.country
    return listing_resp


@router.put("/listings/{listing_id}", response_model=ListingResponse)
def update_existing_listing(
    listing_id: int,
    payload: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = update_listing(
        db, listing_id, current_user.id,
        **payload.model_dump(exclude_none=True),
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Listing not found or not authorized")
    listing_resp = ListingResponse.model_validate(updated)
    listing_resp.farmer_name = current_user.full_name or current_user.username
    return listing_resp


@router.delete("/listings/{listing_id}")
def delete_existing_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = delete_listing(db, listing_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Listing not found or not authorized")
    return {"message": "Listing cancelled successfully"}


@router.post("/price-check", response_model=PriceCheckResponse)
def check_price(payload: PriceCheckRequest):
    return get_market_prices(payload.crop_name, payload.grade)


@router.get("/my-listings", response_model=List[ListingResponse])
def my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listings = db.query(Listing).filter(
        Listing.farmer_id == current_user.id
    ).order_by(Listing.created_at.desc()).all()
    result = []
    for listing in listings:
        listing_resp = ListingResponse.model_validate(listing)
        listing_resp.farmer_name = current_user.full_name or current_user.username
        result.append(listing_resp)
    return result
