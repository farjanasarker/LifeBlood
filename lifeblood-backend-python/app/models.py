from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
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
