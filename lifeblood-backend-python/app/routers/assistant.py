import jwt
from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.assistant.rag import get_answer
from app.config import JWT_ALGORITHM, JWT_SECRET

router = APIRouter(tags=["assistant"])


class ChatTurn(BaseModel):
    role: str
    content: str


class AssistantChatRequest(BaseModel):
    message: str
    history: list[ChatTurn] = []
    profile: dict[str, str] | None = None


def _optional_claims(authorization: str | None) -> dict | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[len("Bearer "):]
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


@router.post("/assistant/chat")
def assistant_chat(body: AssistantChatRequest, authorization: str | None = Header(default=None)):
    message = body.message.strip()
    if not message:
        return JSONResponse(status_code=400, content={"error": "message is required"})

    claims = _optional_claims(authorization)
    profile = dict(body.profile or {})
    if claims and claims.get("role"):
        profile.setdefault("accountRole", claims["role"])

    try:
        answer = get_answer(
            message,
            profile=profile,
            history=[turn.model_dump() for turn in body.history[-8:]],
        )
    except RuntimeError as exc:
        return JSONResponse(status_code=503, content={"error": str(exc)})

    return {"answer": answer}
