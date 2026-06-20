from datetime import datetime
from typing import Optional

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.serializers import user_to_out

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def search(
    bloodGroup: Optional[str] = Query(default=None),
    division: Optional[str] = Query(default=None),
    district: Optional[str] = Query(default=None),
    upazila: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    # bloodGroup arrives in DB display format ("A+", "O-", ...) — the frontend
    # sends it as-is here, matching User.BloodGroup.fromString() in the Java app.
    donors = (
        db.query(User)
        .filter(
            User.blood_group == bloodGroup,
            User.division == division,
            User.district == district,
            User.upazila == upazila,
            User.is_active == True,  # noqa: E712
            User.is_verified == True,  # noqa: E712
        )
        .all()
    )

    now = datetime.now()
    eligible = [
        d
        for d in donors
        if d.last_donation_date is None
        or now > d.last_donation_date + relativedelta(months=4)
    ]

    return [jsonable_encoder(user_to_out(d)) for d in eligible]
