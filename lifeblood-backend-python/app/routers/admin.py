from fastapi import APIRouter, Depends, Response
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app import security
from app.database import get_db
from app.models import User
from app.serializers import user_to_out

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [jsonable_encoder(user_to_out(u)) for u in users]


@router.put("/verify/{user_id}")
def verify_user(
    user_id: int, db: Session = Depends(get_db), claims=Depends(security.require_auth)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is not None:
        user.is_verified = True
        db.commit()
    return Response(status_code=204)


@router.put("/disable/{user_id}")
def disable_user(
    user_id: int, db: Session = Depends(get_db), claims=Depends(security.require_auth)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is not None:
        user.is_active = False
        db.commit()
    return Response(status_code=204)


@router.put("/reactive/{user_id}")
def reactive_user(
    user_id: int, db: Session = Depends(get_db), claims=Depends(security.require_auth)
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is not None:
        user.is_active = True
        db.commit()
    return Response(status_code=204)
