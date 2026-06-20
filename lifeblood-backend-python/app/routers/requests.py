from datetime import datetime

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app import blood_group, security
from app.database import get_db
from app.models import DonationRequest, RequestNotification, User
from app.schemas import DonationRequestIn, NotificationRespond
from app.serializers import donation_request_to_out, notification_to_out

router = APIRouter(prefix="/requests", tags=["requests"])


def _find_eligible_donors(db: Session, request: DonationRequest) -> list[User]:
    donors = (
        db.query(User)
        .filter(
            User.id != request.seeker_id,
            User.blood_group == request.blood_group,
            User.division == request.division,
            User.district == request.district,
            User.upazila == request.upazila,
            User.is_active == True,  # noqa: E712
            User.is_verified == True,  # noqa: E712
        )
        .all()
    )

    now = datetime.now()
    return [
        d
        for d in donors
        if d.last_donation_date is None
        or now > d.last_donation_date + relativedelta(months=4)
    ]


@router.post("")
def create_request(
    request_in: DonationRequestIn,
    db: Session = Depends(get_db),
    claims=Depends(security.require_auth),
):
    seeker_id = int(claims["sub"])

    request = DonationRequest(
        seeker_id=seeker_id,
        blood_group=blood_group.to_db(request_in.bloodGroup),
        division=request_in.division,
        district=request_in.district,
        upazila=request_in.upazila,
        deadline=request_in.deadline,
        status="open",
        notes=request_in.notes,
    )
    db.add(request)
    db.flush()

    for donor in _find_eligible_donors(db, request):
        db.add(RequestNotification(request_id=request.id, donor_id=donor.id, status="pending"))

    db.commit()
    return jsonable_encoder(donation_request_to_out(request))


@router.get("/mine")
def get_my_requests(db: Session = Depends(get_db), claims=Depends(security.require_auth)):
    seeker_id = int(claims["sub"])
    requests = (
        db.query(DonationRequest)
        .filter(DonationRequest.seeker_id == seeker_id)
        .order_by(DonationRequest.created_at.desc())
        .all()
    )
    return [jsonable_encoder(donation_request_to_out(r)) for r in requests]


@router.get("/notifications/mine")
def get_my_notifications(db: Session = Depends(get_db), claims=Depends(security.require_auth)):
    donor_id = int(claims["sub"])
    notifications = (
        db.query(RequestNotification)
        .filter(RequestNotification.donor_id == donor_id)
        .order_by(RequestNotification.created_at.desc())
        .all()
    )
    return [jsonable_encoder(notification_to_out(n)) for n in notifications]


@router.put("/notifications/{notification_id}/respond")
def respond_to_notification(
    notification_id: int,
    body: NotificationRespond,
    db: Session = Depends(get_db),
    claims=Depends(security.require_auth),
):
    if body.status not in ("accepted", "declined"):
        return JSONResponse(status_code=400, content={"error": "status must be 'accepted' or 'declined'"})

    notification = (
        db.query(RequestNotification).filter(RequestNotification.id == notification_id).first()
    )
    if notification is None:
        return JSONResponse(status_code=404, content={"error": "Notification not found"})
    if notification.donor_id != int(claims["sub"]):
        return JSONResponse(status_code=403, content={"error": "Not your notification"})

    notification.status = body.status
    notification.responded_at = datetime.now()

    if body.status == "accepted":
        request = db.query(DonationRequest).filter(DonationRequest.id == notification.request_id).first()
        if request is not None and request.status == "open":
            request.status = "fulfilled"

    db.commit()
    return jsonable_encoder(notification_to_out(notification))
