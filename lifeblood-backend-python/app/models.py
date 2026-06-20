from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    blood_group = Column(String(3), nullable=False)  # stored as "A+", "O-", etc.
    division = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    upazila = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    role = Column(String(20), nullable=False, default="donor")
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=True)
    last_donation_date = Column(DateTime, nullable=True)
    total_donations = Column(Integer, nullable=False, default=0)
    chat_enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    donations = relationship("DonationRecord", back_populates="donor")


class DonationRecord(Base):
    __tablename__ = "donation_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    donor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    recipient_contact = Column(String(20), nullable=True)
    donation_date = Column(DateTime, nullable=False)
    location = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    donor = relationship("User", back_populates="donations")


class DonationRequest(Base):
    __tablename__ = "donation_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    seeker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    blood_group = Column(String(3), nullable=False)  # stored as "A+", "O-", etc.
    division = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    upazila = Column(String(100), nullable=False)
    deadline = Column(DateTime, nullable=False)
    status = Column(String(20), nullable=False, default="open")  # open, fulfilled, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    seeker = relationship("User", foreign_keys=[seeker_id])
    notifications = relationship(
        "RequestNotification", back_populates="request", cascade="all, delete-orphan"
    )


class RequestNotification(Base):
    __tablename__ = "request_notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("donation_requests.id"), nullable=False)
    donor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, accepted, declined
    created_at = Column(DateTime, server_default=func.now())
    responded_at = Column(DateTime, nullable=True)

    request = relationship("DonationRequest", back_populates="notifications")
    donor = relationship("User", foreign_keys=[donor_id])


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message_type = Column(String(20), nullable=False, default="text")  # text, location
    content = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])


class BlockedUser(Base):
    __tablename__ = "blocked_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    blocker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    blocked_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    blocker = relationship("User", foreign_keys=[blocker_id])
    blocked = relationship("User", foreign_keys=[blocked_id])
