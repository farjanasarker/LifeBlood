from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Header, HTTPException, status

from app.config import (
    BCRYPT_ROUNDS,
    JWT_ALGORITHM,
    JWT_EXPIRATION_SECONDS,
    JWT_SECRET,
)


def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt(BCRYPT_ROUNDS)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def check_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except ValueError:
        return False


def generate_token(user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + timedelta(seconds=JWT_EXPIRATION_SECONDS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def require_auth(authorization: str | None = Header(default=None)) -> dict:
    """Mirrors AuthFilter.java: only checks the bearer token is present and valid.
    Role is decoded but not enforced, matching existing (lax) Java behavior."""
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )

    token = authorization[len("Bearer "):]
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return claims
