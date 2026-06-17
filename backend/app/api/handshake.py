from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, TransactionStatus
from app.services.digital_handshake import (
    create_digital_handshake,
    confirm_handshake,
    get_transactions_for_user,
)
from app.services.auth_service import get_current_user
from pydantic import BaseModel

router = APIRouter()


class HandshakeCreate(BaseModel):
    listing_id: int
    quantity: float
    unit_price: float
    currency: str = "USD"
    terms: Optional[str] = None


class HandshakeConfirm(BaseModel):
    transaction_id: int


@router.post("/create", status_code=201)
def create_handshake(
    payload: HandshakeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        transaction = create_digital_handshake(
            db=db,
            listing_id=payload.listing_id,
            buyer_id=current_user.id,
            quantity=payload.quantity,
            unit_price=payload.unit_price,
            currency=payload.currency,
            terms=payload.terms,
        )
        return {
            "transaction_id": transaction.id,
            "contract_hash": transaction.contract_hash,
            "status": transaction.status.value,
            "message": "Digital Handshake initiated. Waiting for confirmation.",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/confirm")
def confirm(
    payload: HandshakeConfirm,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        transaction = confirm_handshake(db, payload.transaction_id, current_user.id)
        return {
            "transaction_id": transaction.id,
            "contract_hash": transaction.contract_hash,
            "status": transaction.status.value,
            "message": "Digital Handshake confirmed! Trade agreement is active.",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transactions")
def list_transactions(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txn_status = None
    if status:
        try:
            txn_status = TransactionStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")

    transactions = get_transactions_for_user(db, current_user.id, txn_status)
    return {"transactions": transactions}
