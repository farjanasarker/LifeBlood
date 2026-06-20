from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app import security
from app.database import get_db
from app.models import BlockedUser, Message, User
from app.schemas import ChatSettingsUpdate, MessageIn
from app.serializers import blocked_user_to_out, message_to_out, user_to_ref

router = APIRouter(tags=["chat"])


def _is_blocked(db: Session, a_id: int, b_id: int) -> bool:
    return (
        db.query(BlockedUser)
        .filter(
            or_(
                and_(BlockedUser.blocker_id == a_id, BlockedUser.blocked_id == b_id),
                and_(BlockedUser.blocker_id == b_id, BlockedUser.blocked_id == a_id),
            )
        )
        .first()
        is not None
    )


@router.put("/chat/settings")
def update_chat_settings(
    body: ChatSettingsUpdate,
    db: Session = Depends(get_db),
    claims=Depends(security.require_auth),
):
    user = db.query(User).filter(User.id == int(claims["sub"])).first()
    if user is None:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    user.chat_enabled = body.chatEnabled
    db.commit()
    return {"chatEnabled": user.chat_enabled}


@router.post("/messages")
def send_message(
    message_in: MessageIn,
    db: Session = Depends(get_db),
    claims=Depends(security.require_auth),
):
    sender_id = int(claims["sub"])

    if message_in.type not in ("text", "location"):
        return JSONResponse(status_code=400, content={"error": "type must be 'text' or 'location'"})
    if message_in.type == "text" and not message_in.content:
        return JSONResponse(status_code=400, content={"error": "content is required for text messages"})
    if message_in.type == "location" and (message_in.latitude is None or message_in.longitude is None):
        return JSONResponse(
            status_code=400, content={"error": "latitude and longitude are required for location messages"}
        )

    receiver = db.query(User).filter(User.id == message_in.receiverId).first()
    if receiver is None:
        return JSONResponse(status_code=404, content={"error": "Recipient not found"})
    if not receiver.chat_enabled:
        return JSONResponse(status_code=403, content={"error": "This user has turned off chat"})
    if _is_blocked(db, sender_id, receiver.id):
        return JSONResponse(status_code=403, content={"error": "You cannot message this user"})

    message = Message(
        sender_id=sender_id,
        receiver_id=receiver.id,
        message_type=message_in.type,
        content=message_in.content,
        latitude=message_in.latitude,
        longitude=message_in.longitude,
    )
    db.add(message)
    db.commit()
    return jsonable_encoder(message_to_out(message))


@router.get("/messages/conversations")
def get_conversations(db: Session = Depends(get_db), claims=Depends(security.require_auth)):
    me = int(claims["sub"])
    messages = (
        db.query(Message)
        .filter(or_(Message.sender_id == me, Message.receiver_id == me))
        .order_by(Message.created_at.desc())
        .all()
    )

    conversations = []
    seen_user_ids: set[int] = set()
    for message in messages:
        other_id = message.receiver_id if message.sender_id == me else message.sender_id
        if other_id in seen_user_ids:
            continue
        seen_user_ids.add(other_id)

        other_user = db.query(User).filter(User.id == other_id).first()
        if other_user is None:
            continue

        unread_count = (
            db.query(Message)
            .filter(Message.sender_id == other_id, Message.receiver_id == me, Message.is_read == False)  # noqa: E712
            .count()
        )

        blocked_by_me = (
            db.query(BlockedUser)
            .filter(BlockedUser.blocker_id == me, BlockedUser.blocked_id == other_id)
            .first()
            is not None
        )
        blocked_me = (
            db.query(BlockedUser)
            .filter(BlockedUser.blocker_id == other_id, BlockedUser.blocked_id == me)
            .first()
            is not None
        )

        conversations.append(
            {
                "otherUser": jsonable_encoder(user_to_ref(other_user)),
                "lastMessage": jsonable_encoder(message_to_out(message)),
                "unreadCount": unread_count,
                "blockedByMe": blocked_by_me,
                "blockedMe": blocked_me,
            }
        )

    return conversations


@router.get("/messages/{other_user_id}")
def get_conversation(
    other_user_id: int,
    db: Session = Depends(get_db),
    claims=Depends(security.require_auth),
):
    me = int(claims["sub"])
    thread = (
        db.query(Message)
        .filter(
            or_(
                and_(Message.sender_id == me, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == me),
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    unread = [m for m in thread if m.receiver_id == me and not m.is_read]
    for message in unread:
        message.is_read = True
    if unread:
        db.commit()

    return [jsonable_encoder(message_to_out(m)) for m in thread]


@router.post("/blocks/{user_id}")
def block_user(
    user_id: int, db: Session = Depends(get_db), claims=Depends(security.require_auth)
):
    me = int(claims["sub"])
    if user_id == me:
        return JSONResponse(status_code=400, content={"error": "You cannot block yourself"})

    existing = (
        db.query(BlockedUser)
        .filter(BlockedUser.blocker_id == me, BlockedUser.blocked_id == user_id)
        .first()
    )
    if existing is not None:
        return jsonable_encoder(blocked_user_to_out(existing))

    blocked_user = db.query(User).filter(User.id == user_id).first()
    if blocked_user is None:
        return JSONResponse(status_code=404, content={"error": "User not found"})

    block = BlockedUser(blocker_id=me, blocked_id=user_id)
    db.add(block)
    db.commit()
    return jsonable_encoder(blocked_user_to_out(block))


@router.delete("/blocks/{user_id}")
def unblock_user(
    user_id: int, db: Session = Depends(get_db), claims=Depends(security.require_auth)
):
    me = int(claims["sub"])
    block = (
        db.query(BlockedUser)
        .filter(BlockedUser.blocker_id == me, BlockedUser.blocked_id == user_id)
        .first()
    )
    if block is not None:
        db.delete(block)
        db.commit()
    return {"success": True}


@router.get("/blocks")
def get_blocked_users(db: Session = Depends(get_db), claims=Depends(security.require_auth)):
    me = int(claims["sub"])
    blocks = db.query(BlockedUser).filter(BlockedUser.blocker_id == me).all()
    return [jsonable_encoder(blocked_user_to_out(b)) for b in blocks]
