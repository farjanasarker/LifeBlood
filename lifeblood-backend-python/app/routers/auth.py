from fastapi import APIRouter, Depends, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import blood_group, security
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin
from app.serializers import user_to_out

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        user = User(
            email=user_data.email,
            password_hash=security.hash_password(user_data.passwordHash),
            name=user_data.name,
            phone=user_data.phone,
            blood_group=blood_group.to_db(user_data.bloodGroup),
            division=user_data.division,
            district=user_data.district,
            upazila=user_data.upazila,
            address=user_data.address or "",
            role="donor",
            is_active=True,
            is_verified=True,
            total_donations=0,
        )
        db.add(user)
        db.commit()
        return Response(status_code=200)
    except IntegrityError:
        db.rollback()
        return Response(status_code=409)
    except Exception as e:
        db.rollback()
        print(f"Registration error: {e}")
        return Response(status_code=500)


@router.post("/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == login_data.email).first()
        if user is None or not security.check_password(
            login_data.passwordHash, user.password_hash
        ):
            return Response(status_code=401)

        token = security.generate_token(str(user.id), user.role)
        body = jsonable_encoder(user_to_out(user))
        return JSONResponse(
            content=body,
            headers={"Authorization": f"Bearer {token}"},
        )
    except Exception as e:
        print(f"Login error: {e}")
        return Response(status_code=500)
