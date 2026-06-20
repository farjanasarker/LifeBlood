from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    phone: str
    bloodGroup: str
    division: str
    district: str
    upazila: str
    address: str
    role: str
    isActive: bool
    isVerified: bool
    lastDonationDate: Optional[datetime] = None
    totalDonations: int
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class UserCreate(BaseModel):
    name: str
    email: str
    passwordHash: str  # plaintext password, matches existing frontend field name
    phone: str
    division: str
    district: str
    upazila: str
    address: Optional[str] = ""
    bloodGroup: str


class UserLogin(BaseModel):
    email: str
    passwordHash: str  # plaintext password


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    division: Optional[str] = None
    district: Optional[str] = None
    upazila: Optional[str] = None
    address: Optional[str] = None
    passwordHash: Optional[str] = None

    class Config:
        extra = "ignore"  # bloodGroup/role/isActive/isVerified etc. are silently ignored, matching Java


class DonorRef(BaseModel):
    id: int


class DonationIn(BaseModel):
    donationDate: datetime
    location: str
    recipientContact: Optional[str] = None
    notes: Optional[str] = None
    donor: DonorRef


class DonationOut(BaseModel):
    id: int
    donor: DonorRef
    recipientContact: Optional[str] = None
    donationDate: datetime
    location: str
    notes: Optional[str] = None
    createdAt: Optional[datetime] = None
