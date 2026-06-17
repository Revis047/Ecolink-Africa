import hashlib
import json
import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.db.models import Transaction, TransactionStatus, Listing, ListingStatus, User


def create_digital_handshake(
    db: Session,
    listing_id: int,
    buyer_id: int,
    quantity: float,
    unit_price: float,
    currency: str = "USD",
    terms: Optional[str] = None,
) -> Transaction:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise ValueError("Listing not found")
    if listing.status != ListingStatus.ACTIVE:
        raise ValueError("Listing is not active")
    if listing.farmer_id == buyer_id:
        raise ValueError("Cannot buy your own listing")

    total_price = round(quantity * unit_price, 2)

    transaction = Transaction(
        listing_id=listing_id,
        buyer_id=buyer_id,
        farmer_id=listing.farmer_id,
        quantity=quantity,
        unit_price=unit_price,
        total_price=total_price,
        currency=currency,
        status=TransactionStatus.NEGOTIATING,
        terms=terms,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    contract_data = {
        "transaction_id": transaction.id,
        "listing_id": listing_id,
        "farmer_id": listing.farmer_id,
        "buyer_id": buyer_id,
        "crop": listing.crop_name,
        "quantity": quantity,
        "unit_price": unit_price,
        "total_price": total_price,
        "currency": currency,
        "terms": terms or "Standard trade agreement",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }
    contract_hash = hashlib.sha256(
        json.dumps(contract_data, sort_keys=True).encode()
    ).hexdigest()
    transaction.contract_hash = contract_hash
    db.commit()
    db.refresh(transaction)

    return transaction


def confirm_handshake(db: Session, transaction_id: int, user_id: int) -> Transaction:
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.status == TransactionStatus.NEGOTIATING,
    ).first()

    if not transaction:
        raise ValueError("Transaction not found or already finalized")

    if transaction.farmer_id != user_id and transaction.buyer_id != user_id:
        raise ValueError("Not authorized to confirm this transaction")

    transaction.status = TransactionStatus.AGREED
    listing = db.query(Listing).filter(Listing.id == transaction.listing_id).first()
    if listing:
        listing.status = ListingStatus.SOLD

    db.commit()
    db.refresh(transaction)
    return transaction


def get_transactions_for_user(
    db: Session, user_id: int, status: Optional[TransactionStatus] = None
) -> list:
    query = db.query(Transaction).filter(
        (Transaction.buyer_id == user_id) | (Transaction.farmer_id == user_id)
    )

    if status:
        query = query.filter(Transaction.status == status)

    transactions = query.order_by(Transaction.created_at.desc()).all()

    result = []
    for t in transactions:
        listing = db.query(Listing).filter(Listing.id == t.listing_id).first()
        buyer = db.query(User).filter(User.id == t.buyer_id).first()
        farmer = db.query(User).filter(User.id == t.farmer_id).first()

        result.append({
            "id": t.id,
            "listing_id": t.listing_id,
            "crop_name": listing.crop_name if listing else "Unknown",
            "buyer_id": t.buyer_id,
            "buyer_name": buyer.full_name or buyer.username if buyer else "Unknown",
            "farmer_id": t.farmer_id,
            "farmer_name": farmer.full_name or farmer.username if farmer else "Unknown",
            "quantity": t.quantity,
            "unit_price": t.unit_price,
            "total_price": t.total_price,
            "currency": t.currency,
            "status": t.status.value,
            "contract_hash": t.contract_hash,
            "terms": t.terms,
            "created_at": t.created_at.isoformat(),
        })
    return result
