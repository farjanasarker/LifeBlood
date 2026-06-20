from app import blood_group
from app.badges import get_badge
from app.models import (
    BlockedUser,
    DonationRecord,
    DonationRequest,
    Message,
    RequestNotification,
    User,
)
from app.schemas import (
    BlockedUserOut,
    ConversationUserRef,
    DonationOut,
    DonationRequestOut,
    DonorRef,
    MessageOut,
    NotificationOut,
    UserOut,
)


def user_to_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        bloodGroup=blood_group.to_api(user.blood_group),
        division=user.division,
        district=user.district,
        upazila=user.upazila,
        address=user.address,
        role=user.role,
        isActive=user.is_active,
        isVerified=user.is_verified,
        lastDonationDate=user.last_donation_date,
        totalDonations=user.total_donations,
        badge=get_badge(user.total_donations),
        chatEnabled=user.chat_enabled,
        createdAt=user.created_at,
        updatedAt=user.updated_at,
    )


def user_to_ref(user: User) -> ConversationUserRef:
    return ConversationUserRef(
        id=user.id,
        name=user.name,
        bloodGroup=blood_group.to_api(user.blood_group),
        role=user.role,
    )


def donation_to_out(record: DonationRecord) -> DonationOut:
    return DonationOut(
        id=record.id,
        donor=DonorRef(id=record.donor_id),
        recipientContact=record.recipient_contact,
        donationDate=record.donation_date,
        location=record.location,
        notes=record.notes,
        createdAt=record.created_at,
    )


def donation_request_to_out(request: DonationRequest) -> DonationRequestOut:
    return DonationRequestOut(
        id=request.id,
        seeker=DonorRef(id=request.seeker_id),
        bloodGroup=blood_group.to_api(request.blood_group),
        division=request.division,
        district=request.district,
        upazila=request.upazila,
        deadline=request.deadline,
        status=request.status,
        notes=request.notes,
        createdAt=request.created_at,
        notifiedDonorCount=len(request.notifications),
    )


def notification_to_out(notification: RequestNotification) -> NotificationOut:
    return NotificationOut(
        id=notification.id,
        request=donation_request_to_out(notification.request),
        donor=DonorRef(id=notification.donor_id),
        status=notification.status,
        createdAt=notification.created_at,
        respondedAt=notification.responded_at,
    )


def message_to_out(message: Message) -> MessageOut:
    return MessageOut(
        id=message.id,
        senderId=message.sender_id,
        receiverId=message.receiver_id,
        type=message.message_type,
        content=message.content,
        latitude=message.latitude,
        longitude=message.longitude,
        isRead=message.is_read,
        createdAt=message.created_at,
    )


def blocked_user_to_out(block: BlockedUser) -> BlockedUserOut:
    return BlockedUserOut(
        id=block.id,
        blockedUser=user_to_ref(block.blocked),
        createdAt=block.created_at,
    )
