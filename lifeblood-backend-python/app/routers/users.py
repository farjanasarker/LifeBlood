from fastapi import APIRouter, Depends
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app import security
from app.database import get_db
from app.models import User
from app.schemas import UserUpdate
from app.serializers import user_to_out

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db), claims=Depends(security.require_auth)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            return JSONResponse(status_code=404, content={"error": "User not found"})
        return jsonable_encoder(user_to_out(user))
    except Exception as e:
        return JSONResponse(
            status_code=500, content={"error": f"Failed to fetch user: {e}"}
        )


@router.put("/{user_id}")
def update_user(
    user_id: int,
    updated: UserUpdate,
    db: Session = Depends(get_db),
    claims=Depends(security.require_auth),
):
    try:
        if updated.name is None or not updated.name.strip():
            return JSONResponse(status_code=400, content={"error": "Name is required"})
        if updated.email is None or not updated.email.strip():
            return JSONResponse(status_code=400, content={"error": "Email is required"})

        existing = db.query(User).filter(User.id == user_id).first()
        if existing is None:
            return JSONResponse(status_code=404, content={"error": "User not found"})

        existing.name = updated.name.strip()
        existing.email = updated.email.strip()

        if updated.phone is not None:
            existing.phone = updated.phone.strip()
        if updated.division is not None:
            existing.division = updated.division.strip()
        if updated.district is not None:
            existing.district = updated.district.strip()
        if updated.upazila is not None:
            existing.upazila = updated.upazila.strip()
        if updated.address is not None:
            existing.address = updated.address.strip()

        if updated.passwordHash is not None and updated.passwordHash.strip():
            if updated.passwordHash != existing.password_hash:
                existing.password_hash = security.hash_password(updated.passwordHash)

        db.commit()
        return {"message": "Profile updated successfully", "success": True}
    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=500, content={"error": f"Failed to update profile: {e}"}
        )
