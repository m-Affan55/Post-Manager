# here we define our models

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Index, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func

class Base(DeclarativeBase):
    pass


def make_conversation_id(user_a: int, user_b: int) -> str:
    """Canonical conversation key — always min_max so both sides get the same ID."""
    return f"{min(user_a, user_b)}_{max(user_a, user_b)}"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    password = Column(String)
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="sender", cascade="all, delete-orphan")
    notifications_received = relationship("Notification", foreign_keys="[Notification.user_id]", back_populates="recipient", cascade="all, delete-orphan")
    notifications_sent = relationship("Notification", foreign_keys="[Notification.sender_id]", back_populates="sender", cascade="all, delete-orphan")

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    title = Column(String , nullable=False)
    content = Column(String, nullable=False)
    user = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="post", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="post", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__= "comments"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), index=True)
    content = Column(String)
    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")

class Like(Base):
    __tablename__ = "likes"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), index=True)
    user = relationship("User", back_populates="likes")
    post = relationship("Post", back_populates="likes")

class Friendship(Base):
    __tablename__ = "friendships"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    friend_id = Column(Integer, ForeignKey("users.id"), index=True)
    status = Column(String, default="pending")
    requester = relationship("User", foreign_keys=[user_id])
    addressee = relationship("User", foreign_keys=[friend_id])

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), index=True)
    is_read = Column(Integer, default=0, index=True) # 0 for False, 1 for True, SQLite doesn't have native boolean sometimes, but Integer is fine
    message = Column(String) # optional, we can construct message on frontend, but good to have
    
    recipient = relationship("User", foreign_keys=[user_id], back_populates="notifications_received")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="notifications_sent")
    post = relationship("Post", foreign_keys=[post_id], back_populates="notifications")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    conversation_id = Column(String, nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=True)       # null when sharing a post
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)  # non-null = shared post
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="messages")
    post = relationship("Post", foreign_keys=[post_id], back_populates="messages")

    # Composite index for keyset pagination: one seek, one scan
    __table_args__ = (
        Index("ix_messages_convo_id", "conversation_id", "id"),
    )


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conversation_id = Column(String, nullable=False)
    last_read_message_id = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint("user_id", "conversation_id", name="uq_user_conversation"),
    )