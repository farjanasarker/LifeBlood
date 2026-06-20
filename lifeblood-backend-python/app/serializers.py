from app import blood_group
from app.models import DonationRecord, User
from app.schemas import DonationOut, DonorRef, UserOut


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
        createdAt=user.created_at,
        updatedAt=user.updated_at,
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
