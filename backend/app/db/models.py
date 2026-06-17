import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, Enum, ForeignKey, JSON, Boolean
)
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class UserRole(str, enum.Enum):
    FARMER = "farmer"
    BUYER = "buyer"
    ADMIN = "admin"


class ListingStatus(str, enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    SOLD = "sold"
    CANCELLED = "cancelled"


class TransactionStatus(str, enum.Enum):
    NEGOTIATING = "negotiating"
    AGREED = "agreed"
    SHIPPING = "shipping"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    language = Column(String(10), default="rw")
    full_name = Column(String(200))
    country = Column(String(100))
    phone = Column(String(30))
    farm_name = Column(String(200))
    farm_size = Column(String(50))
    company_name = Column(String(200))
    avatar_url = Column(String(500))
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    listings = relationship("Listing", back_populates="farmer")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    transactions_as_buyer = relationship("Transaction", foreign_keys="Transaction.buyer_id", back_populates="buyer")
    transactions_as_farmer = relationship("Transaction", foreign_keys="Transaction.farmer_id", back_populates="farmer")


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    crop_name = Column(String(100), nullable=False)
    crop_name_zh = Column(String(100))
    category = Column(String(50))
    grade = Column(String(20))
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), default="kg")
    price = Column(Float, nullable=False)
    currency = Column(String(10), default="KES")
    price_usd = Column(Float)
    description = Column(Text)
    description_zh = Column(Text)
    images = Column(JSON, default=list)
    location = Column(String(200))
    country = Column(String(100))
    status = Column(Enum(ListingStatus), default=ListingStatus.ACTIVE)
    quality_score = Column(Float)
    certification = Column(String(100))
    harvest_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    farmer = relationship("User", back_populates="listings")
    transactions = relationship("Transaction", back_populates="listing")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    currency = Column(String(10))
    status = Column(Enum(TransactionStatus), default=TransactionStatus.NEGOTIATING)
    shipping_date = Column(DateTime)
    delivery_date = Column(DateTime)
    terms = Column(Text)
    terms_zh = Column(Text)
    contract_hash = Column(String(255))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    listing = relationship("Listing", back_populates="transactions")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="transactions_as_buyer")
    farmer = relationship("User", foreign_keys=[farmer_id], back_populates="transactions_as_farmer")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    content_original = Column(Text)
    source_language = Column(String(10))
    target_language = Column(String(10))
    message_type = Column(String(20), default="text")
    audio_url = Column(String(500))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")


class CropScan(Base):
    __tablename__ = "crop_scans"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    crop_type = Column(String(100))
    disease_name = Column(String(200))
    disease_name_local = Column(String(200))
    confidence = Column(Float)
    treatment_plan = Column(Text)
    treatment_plan_local = Column(Text)
    is_healthy = Column(Boolean)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
