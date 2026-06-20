from fastapi import APIRouter, Depends, Response
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app import security
from app.database import get_db
from app.models import DonationRecord, User
from app.schemas import DonationIn
from app.serializers import donation_to_out

router = APIRouter(prefix="/donations", tags=["donations"])


@router.post("")
def add_donation(record_in: DonationIn, db: Session = Depends(get_db)):
    donor = db.query(User).filter(User.id == record_in.donor.id).first()
    if donor is None:
        # mirrors the unhandled IllegalArgumentException in DonationService.java -> 500
        return Response(status_code=500)

    record = DonationRecord(
        donor_id=donor.id,
        recipient_contact=record_in.recipientContact,
        donation_date=record_in.donationDate,
        location=record_in.location,
        notes=record_in.notes,
    )
    db.add(record)

    donor.last_donation_date = record_in.donationDate
    donor.total_donations = donor.total_donations + 1

    db.commit()
    return Response(status_code=204)


@router.get("/{donor_id}")
def get_donations(
    donor_id: int, db: Session = Depends(get_db), claims=Depends(security.require_auth)
):
    records = db.query(DonationRecord).filter(DonationRecord.donor_id == donor_id).all()
    return [jsonable_encoder(donation_to_out(r)) for r in records]
