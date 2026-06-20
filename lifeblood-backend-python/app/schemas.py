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
    badge: Optional[str] = None
    chatEnabled: bool
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


class DonationRequestIn(BaseModel):
    bloodGroup: str
    division: str
    district: str
    upazila: str
    deadline: datetime
    notes: Optional[str] = None


class DonationRequestOut(BaseModel):
    id: int
    seeker: DonorRef
    bloodGroup: str
    division: str
    district: str
    upazila: str
    deadline: datetime
    status: str
    notes: Optional[str] = None
    createdAt: Optional[datetime] = None
    notifiedDonorCount: int


class NotificationRespond(BaseModel):
    status: str  # "accepted" or "declined"


class NotificationOut(BaseModel):
    id: int
    request: DonationRequestOut
    donor: DonorRef
    status: str
    createdAt: Optional[datetime] = None
    respondedAt: Optional[datetime] = None


class ChatSettingsUpdate(BaseModel):
    chatEnabled: bool


class MessageIn(BaseModel):
    receiverId: int
    type: str = "text"  # "text" or "location"
    content: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class MessageOut(BaseModel):
    id: int
    senderId: int
    receiverId: int
    type: str
    content: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    isRead: bool
    createdAt: Optional[datetime] = None


class ConversationUserRef(BaseModel):
    id: int
    name: str
    bloodGroup: str
    role: str


class ConversationOut(BaseModel):
    otherUser: ConversationUserRef
    lastMessage: MessageOut
    unreadCount: int
    blockedByMe: bool
    blockedMe: bool


class BlockedUserOut(BaseModel):
    id: int
    blockedUser: ConversationUserRef
    createdAt: Optional[datetime] = None
