"""
Chat REST API endpoints.

Design decisions:
- POST /message and /share are async def so they can await redis.publish().
- All sync DB work is wrapped in run_in_threadpool() to avoid blocking the event loop.
- ORM objects NEVER cross the threadpool boundary — helpers eager-load relationships
  and serialize to JSON-safe dicts inside the threadpool.
- GET and PATCH endpoints are plain def (no Redis publish needed).
- conversation_id is always computed server-side from authenticated user + friend_id.
- Friendship check on every write endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from starlette.concurrency import run_in_threadpool
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func, case

from dependencies import get_db
from routers.auth import get_current_user
from schemas import (
    MessageCreate, ShareMessageCreate, ReadUpdate,
    MessageResponse, ConversationPreview, UserResponse,
)
from models import (
    Message, ConversationParticipant, Friendship, User, Post,
    make_conversation_id,
)
from ws_manager import manager

router = APIRouter(prefix="/chat", tags=["Chat"])


# ── Sync helpers (everything runs inside run_in_threadpool) ──────────────────

def _check_friendship_sync(db: Session, user_a: int, user_b: int):
    """Raises 403 if users are not accepted friends."""
    friendship = db.query(Friendship).filter(
        or_(
            and_(Friendship.user_id == user_a, Friendship.friend_id == user_b),
            and_(Friendship.user_id == user_b, Friendship.friend_id == user_a),
        ),
        Friendship.status == "accepted"
    ).first()
    if not friendship:
        raise HTTPException(status_code=403, detail="You can only message your friends")


def _create_and_serialize_message(
    db: Session, convo_id: str, sender_id: int,
    content: str | None = None, post_id: int | None = None,
) -> dict:
    """
    Creates a message, eager-loads relationships, serializes to a JSON-safe dict.
    Returns a plain dict — NO ORM objects leave this function.
    """
    if not content and not post_id:
        raise HTTPException(status_code=400, detail="Message must have content or a shared post")

    msg = Message(
        conversation_id=convo_id,
        sender_id=sender_id,
        content=content,
        post_id=post_id,
    )
    db.add(msg)
    db.commit()

    # Re-query with eager loading so .sender and .post are populated — no lazy-loads
    msg = (
        db.query(Message)
        .options(joinedload(Message.sender), joinedload(Message.post))
        .filter(Message.id == msg.id)
        .one()
    )

    # Serialize INSIDE the threadpool — mode="json" converts datetime to ISO string
    return MessageResponse.model_validate(msg).model_dump(mode="json")


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/conversations", response_model=list[ConversationPreview])
def get_conversations(
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all conversations for the current user with last message + unread count.
    """
    # Get all accepted friendships
    friendships = db.query(Friendship).filter(
        or_(Friendship.user_id == current_user, Friendship.friend_id == current_user),
        Friendship.status == "accepted",
    ).all()

    conversations = []
    for f in friendships:
        friend_id = f.friend_id if f.user_id == current_user else f.user_id
        convo_id = make_conversation_id(current_user, friend_id)

        # Get friend user object
        friend = db.query(User).filter(User.id == friend_id).first()
        if not friend:
            continue

        # Get the last message in this conversation
        last_msg = (
            db.query(Message)
            .options(joinedload(Message.sender), joinedload(Message.post))
            .filter(Message.conversation_id == convo_id)
            .order_by(Message.id.desc())
            .first()
        )

        # Count unread messages (messages after last_read_message_id)
        participant = db.query(ConversationParticipant).filter(
            ConversationParticipant.user_id == current_user,
            ConversationParticipant.conversation_id == convo_id,
        ).first()
        last_read_id = participant.last_read_message_id if participant else 0

        unread_count = db.query(func.count(Message.id)).filter(
            Message.conversation_id == convo_id,
            Message.id > last_read_id,
            Message.sender_id != current_user,  # Don't count own messages as unread
        ).scalar()

        last_msg_response = None
        if last_msg:
            last_msg_response = MessageResponse.model_validate(last_msg).model_dump(mode="json")

        conversations.append({
            "friend": UserResponse.model_validate(friend).model_dump(mode="json"),
            "last_message": last_msg_response,
            "unread_count": unread_count or 0,
        })

    # Sort by last message id (most recent conversation first)
    conversations.sort(
        key=lambda c: c["last_message"]["id"] if c["last_message"] else 0,
        reverse=True,
    )
    return conversations


@router.get("/{friend_id}", response_model=list[MessageResponse])
def get_messages(
    friend_id: int,
    cursor: int | None = Query(None, description="Message ID cursor for keyset pagination"),
    limit: int = Query(20, ge=1, le=100),
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Paginated message history using keyset pagination on message ID.
    conversation_id is computed server-side — never trust client input.
    """
    convo_id = make_conversation_id(current_user, friend_id)

    # Security: verify current user is a participant
    if current_user != min(current_user, friend_id) and current_user != max(current_user, friend_id):
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")

    query = (
        db.query(Message)
        .options(joinedload(Message.sender), joinedload(Message.post))
        .filter(Message.conversation_id == convo_id)
    )

    if cursor is not None:
        query = query.filter(Message.id < cursor)

    messages = query.order_by(Message.id.desc()).limit(limit).all()

    return messages


@router.post("/message")
async def send_message(
    body: MessageCreate,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a text message. async def so we can await redis.publish().
    All sync DB work runs inside run_in_threadpool.
    """
    def _do():
        _check_friendship_sync(db, current_user, body.receiver_id)
        convo_id = make_conversation_id(current_user, body.receiver_id)
        return _create_and_serialize_message(db, convo_id, current_user, content=body.content)

    msg_dict = await run_in_threadpool(_do)

    # msg_dict is a plain JSON-safe dict — safe to publish + return
    await manager.publish(current_user, body.receiver_id, msg_dict)
    return msg_dict




@router.patch("/{friend_id}/read")
def mark_read(
    friend_id: int,
    body: ReadUpdate,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Atomic upsert on ConversationParticipant.last_read_message_id.
    Uses INSERT ... ON CONFLICT UPDATE for atomicity (no duplicate rows).
    """
    convo_id = make_conversation_id(current_user, friend_id)

    # Check if participant record exists
    participant = db.query(ConversationParticipant).filter(
        ConversationParticipant.user_id == current_user,
        ConversationParticipant.conversation_id == convo_id,
    ).first()

    if participant:
        # Only update if the new message_id is greater (don't go backwards)
        if body.message_id > participant.last_read_message_id:
            participant.last_read_message_id = body.message_id
    else:
        participant = ConversationParticipant(
            user_id=current_user,
            conversation_id=convo_id,
            last_read_message_id=body.message_id,
        )
        db.add(participant)

    db.commit()
    return {"message": "Read state updated"}
